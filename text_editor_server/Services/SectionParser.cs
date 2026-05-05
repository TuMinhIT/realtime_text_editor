using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json.Linq;
using text_editor_server.Data;
using text_editor_server.Entities;

namespace text_editor_server.Services
{
    public class SectionParser
    {
        private readonly AppDbContext _db;
        private readonly ILogger<SectionParser> _logger;

        public SectionParser(AppDbContext db, ILogger<SectionParser> logger)
        {
            _db = db;
            _logger = logger;
        }   

        public async Task ParseNow(DocumentSnapshot documentSnapshot)
        {
            try
            {
                var snapshot = documentSnapshot;
                var documentId = snapshot.DocumentId;
                if (snapshot == null)
                {
                    _logger.LogWarning("Snapshot not found: {DocumentId}", documentId);
                    return;
                }

                //kiểm tra đã tách section chưa, nếu đã tách rồi thì thôi
                var existingSections = _db.Sections.Where(x => x.DocumentId == documentId);
                if (existingSections.Any())
                {
                    _logger.LogInformation("Sections already exist for document {DocumentId}, skipping parsing",
                        documentId);
                    return;
                }

                var sections = ParseSectionsFromSfdt(snapshot.JsonContent, documentId);

                _db.Sections.AddRange(sections);
                await _db.SaveChangesAsync();

                _logger.LogInformation("Parsed {Count} sections for document {DocumentId}",
                    sections.Count, documentId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "ParseNow failed for document {DocumentId}", documentSnapshot.DocumentId);
                throw;
            }
        }

        //Hàm parse SFDT và lưu vào database (chỉ lưu range block)
        private List<Section> ParseSectionsFromSfdt(string sfdtJson, Guid documentId)
        {
            var sections = new List<Section>();

            JObject sfdt;
            try
            {
                sfdt = JObject.Parse(sfdtJson);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Invalid SFDT JSON");
                return sections;
            }

            var secArray = sfdt["sec"] as JArray;
            if (secArray == null)
            {
                _logger.LogWarning("Missing 'sec' in SFDT");
                return sections;
            }

            int orderIndex = 0;
            int blockIndex = 0;
            bool hasAnySection = false;

            foreach (var sec in secArray)
            {
                var blocks = sec["b"] as JArray;
                if (blocks == null) continue;

                var sectionStack = new Stack<Section>();
                Section? currentSection = null;

                foreach (var block in blocks)
                {
                    try
                    {
                        string styleName = block.SelectToken("pf.stn")?.ToString() ?? "";
                        string text = ExtractText(block);

                        int level = ExtractLevel(styleName);

                        // Giới hạn 2 cấp chỉ lấy heading cấp 1 và 2.
                        bool isHeading = level == 1 || level == 2;

                        if (isHeading)
                        {
                            if (currentSection != null && currentSection.EndBlockIndex == 0)
                            {
                                currentSection.EndBlockIndex = blockIndex;
                                sections.Add(currentSection);
                            }

                            while (sectionStack.Count > 0 &&
                                   sectionStack.Peek().Level >= level)
                            {
                                sectionStack.Pop();
                            }

                            var parentId = sectionStack.Count > 0
                                ? sectionStack.Peek().Id
                                : (Guid?)null;

                            var newSection = new Section
                            {
                                Id = Guid.NewGuid(),
                                DocumentId = documentId,
                                Title = string.IsNullOrWhiteSpace(text) ? "Untitled" : text,
                                Level = level,
                                OrderIndex = orderIndex++,
                                ParentSectionId = parentId,
                                StartBlockIndex = blockIndex,
                                EndBlockIndex = 0,
                                Version = 0,
                                Timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
                            };

                            sectionStack.Push(newSection);
                            currentSection = newSection;
                            hasAnySection = true;
                        }
                        //else if (!hasAnySection && currentSection == null)
                        //{
                        //    var fullSection = new Section
                        //    {
                        //        Id = Guid.NewGuid(),
                        //        DocumentId = documentId,
                        //        Title = "Full Document",
                        //        Level = 1,
                        //        OrderIndex = orderIndex++,
                        //        ParentSectionId = null,
                        //        StartBlockIndex = blockIndex,
                        //        EndBlockIndex = 0,
                        //        Version = 0,
                        //        Timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
                        //    };

                        //    currentSection = fullSection;
                        //    hasAnySection = true;
                        //}
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error parsing block");
                    }

                    blockIndex++;
                }

                if (currentSection != null && currentSection.EndBlockIndex == 0)
                {
                    currentSection.EndBlockIndex = blockIndex;
                    sections.Add(currentSection);
                }
            }

            return sections;
        }

        //HELPERS 

        // lấy toàn bộ text trong SFDT (không mất nội dung)
        private string ExtractText(JToken block)
        {
            return string.Join(" ",
                block.SelectTokens("i[*].tlp")
                     .Select(x => x.ToString()));
        }

        // Heading level parser
        private int ExtractLevel(string styleName)
        {
            if (string.IsNullOrWhiteSpace(styleName))
                return 0;

            var num = styleName
                .Replace("Heading", "")
                .Trim();

            return int.TryParse(num, out var level) ? level : 0;
        }

       

        // Build SFDT content block (metadata + sec)
        private string BuildSfdt(List<JToken> blocks, JObject metadataTemplate)
        {
            try
            {
                var sfdt = (JObject)metadataTemplate.DeepClone();
                sfdt["sec"] = new JArray
                {
                    new JObject
                    {
                        ["b"] = new JArray(blocks)
                    }
                };

                return sfdt.ToString();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "BuildSfdt failed");
                return "{}";
            }
        }
    }
}