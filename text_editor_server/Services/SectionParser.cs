using DocumentFormat.OpenXml.InkML;
using DocumentFormat.OpenXml.Office2010.Word;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using SkiaSharp;
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

                _logger.LogInformation(
                    "Parsed {Count} sections for document {DocumentId}",
                    sections.Count, documentId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "ParseNow failed for document {DocumentId}", documentId);
                throw;
            }
        }

        private List<Section> ParseSectionsFromSfdt(
             string sfdtJson,
             Guid documentId)
        {
            var result = new List<Section>();

            // =========================
            // 1. PARSE SFDT SAFE
            // =========================
            JObject sfdt;

            try
            {
                sfdt = JObject.Parse(sfdtJson);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Invalid SFDT JSON for document {DocumentId}",
                    documentId);

                return result;
            }

            // =========================
            // 2. LOAD SEC ARRAY
            // =========================
            var secArray = sfdt["sec"] as JArray;

            if (secArray == null || secArray.Count == 0)
            {
                _logger.LogWarning(
                    "SFDT missing sec array for document {DocumentId}",
                    documentId);

                return result;
            }

            // =========================
            // 3. BUILD STYLE MAP
            // =========================
            var styleLevelMap = BuildStyleLevelMap(sfdt);

            // =========================
            // 4. PARSER STATE
            // =========================
            var stack = new Stack<Section>();

            Section? currentSection = null;

            var currentBlocks = new List<JObject>();

            int orderIndex = 0;

            // =========================
            // 5. LOOP ALL BLOCKS
            // =========================
            foreach (var secToken in secArray)
            {
                if (secToken is not JObject secObj)
                    continue;

                var blocks = secObj["b"] as JArray;

                if (blocks == null || blocks.Count == 0)
                    continue;

                foreach (var blockToken in blocks)
                {
                    // =========================
                    // SAFE BLOCK
                    // =========================
                    if (blockToken is not JObject rawBlock)
                        continue;

                    // clone tránh mutate reference
                    var block =
                        (JObject)rawBlock.DeepClone();

                    // =========================
                    // HEADING DETECTION
                    // =========================
                    var styleName =
                        block.SelectToken("pf.stn")
                            ?.ToString();

                    int level = 0;

                    if (!string.IsNullOrWhiteSpace(styleName) &&
                        styleLevelMap.TryGetValue(styleName, out var l))
                    {
                        level = l;
                    }

                    bool isHeading =
                        level > 0 &&
                        level <= 2;

                    // =========================
                    // NEW SECTION
                    // =========================
                    if (isHeading)
                    {
                        // flush old section
                        if (currentSection != null)
                        {
                            currentSection.Content =
                                SerializeBlocks(currentBlocks, sfdt);

                            result.Add(currentSection);

                            currentBlocks =
                                new List<JObject>();
                        }

                        // =========================
                        // BUILD HIERARCHY
                        // =========================
                        while (stack.Count > 0 &&
                               stack.Peek().Level >= level)
                        {
                            stack.Pop();
                        }

                        Guid? parentId =
                            stack.Count > 0
                                ? stack.Peek().Id
                                : null;

                        // =========================
                        // CREATE SECTION
                        // =========================
                        var section = new Section
                        {
                            Id = Guid.NewGuid(),

                            DocumentId = documentId,

                            Title = ExtractTitle(block),

                            Level = level,

                            ParentSectionId = parentId,

                            OrderIndex = orderIndex++,

                            Version = 0,

                            Timestamp =
                                DateTimeOffset.UtcNow
                                    .ToUnixTimeMilliseconds()
                        };

                        stack.Push(section);

                        currentSection = section;

                        currentBlocks.Add(block);
                    }
                    else
                    {
                        // =========================
                        // NORMAL CONTENT
                        // =========================
                        if (currentSection != null)
                        {
                            currentBlocks.Add(block);
                        }
                    }
                }
            }

            // =========================
            // 6. FLUSH LAST SECTION
            // =========================
            if (currentSection != null)
            {
                currentSection.Content =
                    SerializeBlocks(currentBlocks, sfdt     );

                result.Add(currentSection);
            }

            // =========================
            // 7. FINAL SORT
            // =========================
            return result
                .OrderBy(x => x.OrderIndex)
                .ToList();
        }
        private string ExtractTitle(JObject block)
        {
            var runs = block["i"] as JArray;

            if (runs == null)
            {
                _logger.LogWarning("No runs found: {Block}", block.ToString());
                return "Untitled";
            }

            foreach (var r in runs)
            {
                _logger.LogInformation("Run: {Text}", r["tlp"]?.ToString());
            }

            var title = string.Concat(
                runs.Select(r => r["tlp"]?.ToString() ?? "")
            ).Trim();

            _logger.LogInformation("Final Title: {Title}", title);

            return title;
        }


        private Dictionary<string, int> BuildStyleLevelMap(JObject sfdt)
        {
            var result = new Dictionary<string, int>();

            var styles = sfdt["sty"] as JArray;

            if (styles == null)
                return result;

            // cache all styles by name
            var styleMap = styles
                .OfType<JObject>()
                .Where(x => x["n"] != null)
                .ToDictionary(
                    x => x["n"]!.ToString(),
                    x => x
                );

            foreach (var kv in styleMap)
            {
                var styleName = kv.Key;

                var level = ResolveOutlineLevel(
                    kv.Value,
                    styleMap
                );

                if (level != null)
                {
                    result[styleName] = level.Value;
                }
            }

            return result;
        }

        private int? ResolveOutlineLevel(
            JObject style,
            Dictionary<string, JObject> styleMap)
        {
            // direct ol
            var directLevel =
                style.SelectToken("pf.ol")
                     ?.Value<int?>();

            if (directLevel != null)
                return directLevel;

            // base style
            var baseStyle =
                style["b"]?.ToString();

            if (string.IsNullOrWhiteSpace(baseStyle))
                return null;

            if (!styleMap.TryGetValue(baseStyle, out var parent))
                return null;

            return ResolveOutlineLevel(parent, styleMap);
        }


        // lưu RAW SFDT blocks
        private string SerializeBlocks(List<JObject> blocks, JObject sfdt)
        {
            return new JObject
            {
                ["b"] = new JArray(blocks),

                ["imgs"] = sfdt["imgs"],
                //["cf"] = sfdt["cf"],
                //["sty"] = sfdt["sty"]
            }.ToString(Formatting.None);
        }


        public string BuildSectionPreview(
        string sectionContent,
        JObject originalSfdt)
        {
            if (string.IsNullOrWhiteSpace(sectionContent))
                return null;

            JArray sectionBlocks;
            JObject sectionObj;

            try
            {
                sectionObj = JObject.Parse(sectionContent);

                sectionBlocks = sectionObj["b"] as JArray;

                if (sectionBlocks == null)
                    return null;
            }
            catch
            {
                return null;
            }

            var result =
                (JObject)originalSfdt.DeepClone();

            var secArray =
                result["sec"] as JArray;

            if (secArray == null || secArray.Count == 0)
                return result.ToString();

            var first =
                secArray[0] as JObject;

            first["b"] = sectionBlocks;

            // FIX IMAGE
            if (sectionObj["imgs"] is JObject imgs)
            {
                result["imgs"] =
                    imgs.DeepClone();
            }

            return result.ToString(Formatting.None);
        }

        public async Task<string?> BuildPreviewAsync(Guid documentId, string sectionContent)
        {
            var snapshot = await _db.DocumentSnapshots
                .FirstOrDefaultAsync(x => x.DocumentId == documentId);

            if (snapshot == null || string.IsNullOrWhiteSpace(snapshot.JsonContent))
                return null;

            JObject originalSfdt;

            try
            {
                originalSfdt = JObject.Parse(snapshot.JsonContent);
            }
            catch
            {
                return null; // hoặc log lỗi
            }
      
            return BuildSectionPreview(sectionContent, originalSfdt);
        }

    }
}
