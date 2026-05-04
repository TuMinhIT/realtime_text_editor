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

       
        public async Task ParseNow(Guid documentId)
        {
            try
            {
                var snapshot = await _db.DocumentSnapshots
                    .FirstOrDefaultAsync(x => x.DocumentId == documentId);

                if (snapshot == null)
                {
                    _logger.LogWarning("Snapshot not found: {DocumentId}", documentId);
                    return;
                }

                var sections = ParseSectionsFromSfdt(snapshot.JsonContent, documentId);

                var old = _db.Sections.Where(x => x.DocumentId == documentId);
                _db.Sections.RemoveRange(old);

                _db.Sections.AddRange(sections);
                await _db.SaveChangesAsync();

                _logger.LogInformation("Parsed {Count} sections for document {DocumentId}",
                    sections.Count, documentId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "ParseNow failed for document {DocumentId}", documentId);
                throw;
            }
        }

        //Hàm parse SFDT và lưu vào database
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

            foreach (var sec in secArray)
            {
                var blocks = sec["b"] as JArray;
                if (blocks == null) continue;

                var sectionStack = new Stack<Section>();
                Section? currentSection = null;
                var contentBuffer = new List<JToken>();

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
                            // flush section cũ
                            if (currentSection != null)
                            {
                                currentSection.Content = BuildSfdt(contentBuffer);
                                sections.Add(currentSection);
                            }

                            contentBuffer.Clear();

                            // handle hierarchy
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
                                Version = 0,
                                Timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
                            };

                            sectionStack.Push(newSection);
                            currentSection = newSection;
                        }
                        else
                        {
                            // content belongs to current section
                            if (currentSection != null)
                            {
                                contentBuffer.Add(block);
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error parsing block");
                    }
                }

                // flush last section
                if (currentSection != null)
                {
                    currentSection.Content = BuildSfdt(contentBuffer);
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

        // Build SFDT content block
        private string BuildSfdt(List<JToken> blocks)
        {
            try
            {
                var sfdt = new JObject
                {
                    ["sec"] = new JArray
                    {
                        new JObject
                        {
                            ["b"] = new JArray(blocks)
                        }
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