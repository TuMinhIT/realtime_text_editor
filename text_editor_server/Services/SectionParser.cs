using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
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

        // =========================
        // CORE PARSER (FIXED)
        // =========================
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

                //  IMPORTANT: giữ raw SFDT blocks
                var contentBuffer = new List<JObject>();

                foreach (var blockToken in blocks)
                {
                    try
                    {
                        var block = (JObject)blockToken.DeepClone();

                        string styleName = block.SelectToken("pf.stn")?.ToString() ?? "";
                        int level = ExtractLevel(styleName);

                        bool isHeading = level == 1 || level == 2;

                        if (isHeading)
                        {
                            // flush section cũ
                            if (currentSection != null)
                            {
                                currentSection.Content = SerializeBlocks(contentBuffer);
                                sections.Add(currentSection);
                            }

                            contentBuffer.Clear();

                            // xử lý hierarchy
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
                                Title = ExtractTitle(block),
                                Level = level,
                                OrderIndex = orderIndex++,
                                ParentSectionId = parentId,
                                Version = 0,
                                Timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
                            };

                            sectionStack.Push(newSection);
                            currentSection = newSection;

                            //  QUAN TRỌNG NHẤT
                            // thêm luôn heading vào content
                            contentBuffer.Add(block);
                        }
                        else
                        {
                            // content giữ nguyên SFDT block
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
                    currentSection.Content = SerializeBlocks(contentBuffer);
                    sections.Add(currentSection);
                }
            }

            return sections;
        }

        // =========================
        // HELPERS
        // =========================

        // KHÔNG flatten text nữa → giữ format
        //private string ExtractTitle(JObject block)
        //{
        //    string test = block.ToString();
        //    if (string.IsNullOrEmpty(test))
        //        return "Untitled";
        //    string test1 = block.SelectToken("i[0].tlp")?.ToString() ?? "Untitled";
        //    return block.SelectToken("i[0].tlp")?.ToString() ?? "Untitled";
        //}
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

        private int ExtractLevel(string styleName)
        {
            if (string.IsNullOrWhiteSpace(styleName))
                return 0;

            if (styleName.StartsWith("Heading "))
                return int.TryParse(styleName.Replace("Heading ", ""), out var lvl)
                    ? lvl
                    : 0;

            return 0;
        }

        // lưu RAW SFDT blocks
        private string SerializeBlocks(List<JObject> blocks)
        {
            return JsonConvert.SerializeObject(blocks);
        }

        public string RebuildSfdt(List<Section> sections, JObject originalSfdt)
        {
            if (originalSfdt == null)
                throw new ArgumentNullException(nameof(originalSfdt));

            // 1. Merge toàn bộ blocks từ section
            var finalBlocks = new JArray();

            foreach (var section in sections.OrderBy(s => s.OrderIndex))
            {
                if (string.IsNullOrWhiteSpace(section.Content))
                    continue;

                try
                {
                    var blocks = JArray.Parse(section.Content);

                    foreach (var b in blocks)
                    {
                        finalBlocks.Add(b); // giữ nguyên block → không mất format
                    }
                }
                catch (Exception ex)
                {
                    // tránh crash toàn bộ document
                    Console.WriteLine($"Invalid JSON in section {section.Id}: {ex.Message}");
                }
            }

            // 2. Clone toàn bộ SFDT gốc (GIỮ 100% metadata)
            var result = (JObject)originalSfdt.DeepClone();

            // 3. Ensure structure an toàn
            if (result["sec"] is not JArray secArray || secArray.Count == 0)
            {
                secArray = new JArray
        {
            new JObject()
        };
                result["sec"] = secArray;
            }

            var firstSection = (JObject)secArray[0];

            // 4. Giữ lại secpr (layout)
            if (firstSection["secpr"] == null && originalSfdt["sec"]?[0]?["secpr"] != null)
            {
                firstSection["secpr"] = originalSfdt["sec"]![0]!["secpr"];
            }

            // 5. Replace content DUY NHẤT chỗ này
            firstSection["b"] = finalBlocks;

            return result.ToString(Newtonsoft.Json.Formatting.None);
        }

        public string BuildSectionPreview(string sectionContent, JObject originalSfdt)
        {
            if (string.IsNullOrWhiteSpace(sectionContent))
                return null;

            // parse blocks của section
            var sectionBlocks = JArray.Parse(sectionContent);

            //  clone full document
            var result = (JObject)originalSfdt.DeepClone();

            // đảm bảo structure
            if (result["sec"] is not JArray secArray || secArray.Count == 0)
            {
                secArray = new JArray
        {
            new JObject()
        };
                result["sec"] = secArray;
            }

            var firstSection = (JObject)secArray[0];

            //  chỉ thay content
            firstSection["b"] = sectionBlocks;

            return result.ToString();
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

        public async Task ExportDebugFiles(Guid documentId, string originalContent)
        {
            try
            {
                var baseDir = Path.Combine(
                    Directory.GetCurrentDirectory(),
                    "debug_sfdt",
                    documentId.ToString()
                );

                Directory.CreateDirectory(baseDir);

                // =========================
                // 1. ORIGINAL
                // =========================
                var originalPath = Path.Combine(baseDir, "0_original.sfdt");
                await File.WriteAllTextAsync(originalPath, JObject.Parse(originalContent)
                    .ToString(Formatting.Indented));

                // =========================
                // 2. LOAD SECTIONS
                // =========================
                var sections = await _db.Sections
                    .Where(s => s.DocumentId == documentId)
                    .OrderBy(s => s.OrderIndex)
                    .ToListAsync();

                var originalSfdt = JObject.Parse(originalContent);

                // =========================
                // 3. EXPORT TỪNG SECTION
                // =========================
                int index = 0;
                foreach (var section in sections)
                {
                    if (string.IsNullOrWhiteSpace(section.Content))
                        continue;

                    try
                    {
                        var preview = BuildSectionPreview(section.Content, originalSfdt);

                        var safeTitle = string.Join("_",
                        section.Title.Split(Path.GetInvalidFileNameChars()));

                        // 🔥 cắt còn 30 ký tự
                        if (safeTitle.Length > 30)
                            safeTitle = safeTitle.Substring(0, 30);

                        // 🔥 thêm hash chống trùng
                        using var sha = System.Security.Cryptography.SHA1.Create();
                        var hashBytes = sha.ComputeHash(System.Text.Encoding.UTF8.GetBytes(section.Title));
                        var hash = BitConverter.ToString(hashBytes).Replace("-", "").Substring(0, 8);

                        var fileName = $"{index:D2}_L{section.Level}_{safeTitle}_{hash}.sfdt";

                        var path = Path.Combine(baseDir, fileName);

                        await File.WriteAllTextAsync(path,
                            JObject.Parse(preview).ToString(Formatting.Indented));

                        index++;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, $"Export section failed: {section.Id}");
                    }
                }

                // =========================
                // 4. MERGED
                // =========================
                var merged = RebuildSfdt(sections, originalSfdt);

                var mergedPath = Path.Combine(baseDir, "999_merged.sfdt");

                await File.WriteAllTextAsync(mergedPath,
                    JObject.Parse(merged).ToString(Formatting.Indented));

                _logger.LogInformation("Exported debug SFDT to {Dir}", baseDir);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "ExportDebugFiles failed");
            }
        }

    }
}