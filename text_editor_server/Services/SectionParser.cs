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

        // ================= CORE PARSER =================

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

                if (blocks == null)
                {
                    _logger.LogWarning("Missing 'b' blocks in section");
                    continue;
                }

                var sectionStack = new Stack<(Section section, int level)>();
                Section? currentSection = null;
                var contentBuffer = new List<JToken>();

                foreach (var block in blocks)
                {
                    try
                    {
                        string? styleName = block.SelectToken("pf.stn")?.ToString();
                        string text = block.SelectToken("i[0].tlp")?.ToString() ?? "";

                        bool isHeading =
                            !string.IsNullOrWhiteSpace(styleName) &&
                            styleName.StartsWith("Heading");

                        if (isHeading)
                        {
                            int level = ExtractLevel(styleName);

                            if (currentSection != null)
                            {
                                currentSection.Content = BuildSfdt(contentBuffer);
                                sections.Add(currentSection);
                            }

                            contentBuffer.Clear();

                            while (sectionStack.Count > 0 &&
                                   sectionStack.Peek().level >= level)
                            {
                                sectionStack.Pop();
                            }

                            var parentId = sectionStack.Count > 0
                                ? sectionStack.Peek().section.Id
                                : (Guid?)null;

                            var newSection = new Section
                            {
                                Id = Guid.NewGuid(),
                                DocumentId = documentId,
                                Title = text,
                                Level = level,
                                OrderIndex = orderIndex++,
                                ParentSectionId = parentId,
                                Version = 0,
                                Timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
                            };

                            sectionStack.Push((newSection, level));
                            currentSection = newSection;
                        }
                        else
                        {
                            if (currentSection != null)
                                contentBuffer.Add(block);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error parsing block: {Block}", block?.ToString());
                    }
                }

                if (currentSection != null)
                {
                    currentSection.Content = BuildSfdt(contentBuffer);
                    sections.Add(currentSection);
                }
            }

            return sections;
        }

        // ================= HELPERS =================

        private int ExtractLevel(string styleName)
        {
            try
            {
                var num = styleName
                    .Replace("Heading ", "")
                    .Replace("Heading", "");

                return int.TryParse(num, out int level) ? level : 1;
            }
            catch
            {
                return 1;
            }
        }

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