using DocumentFormat.OpenXml.InkML;
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

       
        // CORE PARSER
       
        private List<Section> ParseSectionsFromSfdt(
            string sfdtJson,
            Guid documentId)
        {


            //Danh sách section cuối cùng:
            var result = new List<Section>();

            // PARSE SFDT SAFE
           
            JObject sfdt;

            try
            {
                sfdt = JObject.Parse(sfdtJson); //Chuyển từ chuỗi JSON thành đối tượng JObject để dễ dàng truy cập các phần tử bên trong. Nếu chuỗi JSON không hợp lệ, sẽ ném ra một ngoại lệ và được bắt trong khối catch.
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Invalid SFDT JSON for document {DocumentId}",
                    documentId);

                return result;
            }


            //Lay sec array:
            var secArray = sfdt["sec"] as JArray;


            // Check sec array:
            if (secArray == null || secArray.Count == 0)
            {
                _logger.LogWarning(
                    "SFDT missing sec array for document {DocumentId}",
                    documentId);

                return result;
            }

            var styleLevelMap = BuildStyleLevelMap(sfdt);


            // Parser STATE
            // Sử dụng stack để quản lý hierarchy của section dựa trên level của heading
            var stack = new Stack<Section>();

            Section? currentSection = null; //section hiện tại đang bỏ.

            var currentBlocks = new List<JObject>(); //Tất cả Block của section hiện tại 
            int globalIndex = 0; //Đánh index toàn cục cho tất cả block để xác định phạm vi của section
            int orderIndex = 0; //Đánh index cho thứ tự section trong document, tăng dần theo thứ tự xuất hiện


            // Duyet từng section và block trong SFDT để xác định heading và phân chia section

            foreach (var secToken in secArray)
            {
                //Kiem tra phan tu sec co phai la JObject khong, neu khong thi bo qua
                if (secToken is not JObject secObj) //
                    continue;


                //Lay mang block tu sec, neu khong co block thi bo qua
                var blocks = secObj["b"] as JArray;


                
                if (blocks == null || blocks.Count == 0)
                    continue;
                //Duyet tung block trong sec
                
                foreach (var blockToken in blocks)
                {
                    
                    // SAFE BLOCK
                    
                    if (blockToken is not JObject rawBlock)
                    {
                        globalIndex++; //giữ tăng index ngay cả khi block không hợp lệ.
                        continue;
                    }

                    //Tạo bản sao của block để tránh thay đổi dữ liệu gốc trong snapshot, vì chúng ta sẽ lưu nộ
                    //1. Tách block ra khỏi cây Json gốc.
                    //2. Section giữ snapshot độc lập
                    //3. Tránh Mutate reference shared 
                    var block = (JObject)rawBlock.DeepClone();

                    
                    // HEADING DETECTION
                    
                    var styleName =
                        block.SelectToken("pf.stn")?.ToString();
                    
                    //int level = ExtractLevel(styleName);
                    int level = 0;

                    if (!string.IsNullOrWhiteSpace(styleName) &&
                        styleLevelMap.TryGetValue(styleName, out var l))
                    {
                        level = l;
                    }

                    bool isHeading = level > 0 && level <= 2 ;

                    
                    // NEW SECTION
                    
                    if (isHeading)
                    {
                        // flush previous section
                        if (currentSection != null)
                        {
                            currentSection.EndIndex =
                            Math.Max(
                                currentSection.StartIndex,
                                globalIndex - 1);

                            currentSection.Content =
                                SerializeBlocks(currentBlocks);

                            result.Add(currentSection);

                            currentBlocks = new List<JObject>();
                        }

                        
                        // BUILD HIERARCHY
                        
                        while (stack.Count > 0 &&
                               stack.Peek().Level >= level)
                        {
                            stack.Pop();
                        }

                        Guid? parentId =
                            stack.Count > 0
                                ? stack.Peek().Id
                                : null;

                        
                        // CREATE SECTION
                        
                        var section = new Section
                        {
                            Id = Guid.NewGuid(),

                            DocumentId = documentId,

                            Title = ExtractTitle(block),

                            Level = level,

                            ParentSectionId = parentId,

                            OrderIndex = orderIndex++,

                            StartIndex = globalIndex,

                            EndIndex = globalIndex,

                            Version = 0,

                            Timestamp =
                                DateTimeOffset.UtcNow
                                    .ToUnixTimeMilliseconds()
                        };

                        // push hierarchy
                        stack.Push(section);

                        currentSection = section;

                        currentBlocks.Add(block);
                    }
                    else
                    {
                        
                        // NORMAL CONTENT
                        
                        if (currentSection != null)
                        {
                            currentBlocks.Add(block);

                            currentSection.EndIndex = globalIndex;
                        }
                    }

                    globalIndex++;
                }
            }

            
            // 4. FLUSH LAST SECTION
            
            if (currentSection != null)
            {
                currentSection.EndIndex =
                Math.Max(
                    currentSection.StartIndex,
                    globalIndex - 1);

                currentSection.Content =
                    SerializeBlocks(currentBlocks);

                result.Add(currentSection);
            }

            
            // 5. FINAL SORT
            
            return result
                .OrderBy(x => x.StartIndex)
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
        private string SerializeBlocks(List<JObject> blocks)
        {
            return new JObject
            {
                ["b"] = new JArray(blocks)
            }.ToString(Formatting.None);
        }

       

        // Hàm inject section content vào SFDT gốc để preview (giữ nguyên metadata, chỉ thay đổi content)
        public string BuildPreviewInject(Guid documentId, Guid sectionId)
        {
            var section = _db.Sections.First(x => x.Id == sectionId);
            var snapshot = _db.DocumentSnapshots.First(x => x.DocumentId == documentId);

            var sfdt = JObject.Parse(snapshot.JsonContent);
            var secArray = (JArray)sfdt["sec"];

            var sectionObj = JObject.Parse(section.Content);
            var sectionBlocks = (JArray)sectionObj["b"];


            var expectedLength =
    section.EndIndex - section.StartIndex + 1;

            if (expectedLength != sectionBlocks.Count)
            {
                throw new Exception(
                    $"Section range mismatch. Expected: {expectedLength}, Actual: {sectionBlocks.Count}");
            }

            int index = 0;

            for (int s = 0; s < secArray.Count; s++)
            {
                var blocks = secArray[s]?["b"] as JArray;
                if (blocks == null) continue;

                for (int b = 0; b < blocks.Count; b++)
                {
                    if (index >= section.StartIndex && index <= section.EndIndex)
                    {
                        int localIndex = index - section.StartIndex;
                        if (localIndex < sectionBlocks.Count)
                        {
                            blocks[b] = (JObject)sectionBlocks[localIndex].DeepClone();
                        }
                    }

                    index++;
                }
            }

            return sfdt.ToString(Formatting.None);
        }




        public string BuildSectionPreview(string sectionContent, JObject originalSfdt)
        {
            if (string.IsNullOrWhiteSpace(sectionContent))
                return null;

            JArray sectionBlocks;

            try
            {
                var obj = JObject.Parse(sectionContent);

                sectionBlocks = obj["b"] as JArray;

                if (sectionBlocks == null)
                    return null;
            }
            catch
            {
                return null;
            }

            var result = (JObject)originalSfdt.DeepClone();

            var secArray = result["sec"] as JArray;
            if (secArray == null || secArray.Count == 0)
                return result.ToString();

            var first = secArray[0] as JObject;
            first["b"] = sectionBlocks;

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

                
                // 1. PARSE SAFE SFDT
                
                JObject originalSfdt;

                try
                {
                    originalSfdt = JObject.Parse(originalContent);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Invalid SFDT JSON");
                    return;
                }

                await File.WriteAllTextAsync(
                    Path.Combine(baseDir, "0_original.sfdt"),
                    originalSfdt.ToString(Formatting.Indented)
                );

                
                // 2. LOAD SECTIONS FROM DB
                
                var sections = await _db.Sections
                    .Where(s => s.DocumentId == documentId)
                    .OrderBy(s => s.OrderIndex)
                    .ToListAsync();

                
                // 3. SAFE GET SEC ARRAY
                
                var secArray = originalSfdt["sec"] as JArray;

                if (secArray == null || secArray.Count == 0)
                {
                    _logger.LogWarning("SFDT has no sections");
                    return;
                }

                
                // 4. FLATTEN BLOCKS (SAFE VERSION)
                
                var allBlocks = new List<JObject>();
                var indexMap = new List<object>();

                int globalIndex = 0;

                foreach (var sec in secArray)
                {
                    var blocks = sec?["b"] as JArray;

                    if (blocks == null || blocks.Count == 0)
                        continue;

                    foreach (var b in blocks)
                    {
                        if (b is not JObject obj)
                            continue;

                        var clone = (JObject)obj.DeepClone();

                        allBlocks.Add(clone);

                        var runs = clone["i"] as JArray;

                        var preview = (runs != null && runs.Count > 0)
                            ? runs[0]?["tlp"]?.ToString() ?? ""
                            : "";

                        indexMap.Add(new
                        {
                            Index = globalIndex,
                            Type = clone.SelectToken("pf.stn")?.ToString() ?? "normal",
                            Preview = preview
                        });

                        globalIndex++;
                    }
                }
                
                // 5. EXPORT INDEX MAP
                
                await File.WriteAllTextAsync(
                    Path.Combine(baseDir, "index_map.json"),
                    JsonConvert.SerializeObject(indexMap, Formatting.Indented)
                );

                
                // 6. EXPORT SECTION DEBUG
                
                int fileIndex = 0;

                foreach (var section in sections)
                {
                    try
                    {
                        if (string.IsNullOrWhiteSpace(section.Content))
                            continue;

                        var sectionObj = JObject.Parse(section.Content);
                        var sectionBlocks = sectionObj["b"] as JArray;

                        var debugObj = new JObject
                        {
                            ["sectionId"] = section.Id,
                            ["title"] = section.Title,
                            ["level"] = section.Level,
                            ["startIndex"] = section.StartIndex,
                            ["endIndex"] = section.EndIndex,
                            ["blockCount"] = sectionBlocks?.Count ?? 0,
                            ["blocks"] = sectionBlocks ?? new JArray()
                        };

                        var safeName = string.Join("_",
                            section.Title.Split(Path.GetInvalidFileNameChars()));

                        var path = Path.Combine(baseDir,
                            $"{fileIndex:D2}_L{section.Level}_{safeName}.sfdt");

                        await File.WriteAllTextAsync(
                            path,
                            debugObj.ToString(Formatting.Indented)
                        );

                        fileIndex++;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, $"Export section failed: {section.Id}");
                    }
                }

                
                // 7. SECTION RANGE CHECK
                
                var rangeCheck = sections.Select(s => new
                {
                    s.Title,
                    s.StartIndex,
                    s.EndIndex,
                    Length = s.EndIndex >= s.StartIndex
                        ? s.EndIndex - s.StartIndex + 1
                        : 0
                });

                await File.WriteAllTextAsync(
                    Path.Combine(baseDir, "section_ranges.json"),
                    JsonConvert.SerializeObject(rangeCheck, Formatting.Indented)
                );

                
                // 8. FLATTENED BLOCKS EXPORT
                
                await File.WriteAllTextAsync(
                    Path.Combine(baseDir, "flatten_blocks.json"),
                    JsonConvert.SerializeObject(allBlocks, Formatting.Indented)
                );

                _logger.LogInformation("DEBUG EXPORT DONE: {Dir}", baseDir);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "ExportDebugFiles failed");
            }
        }


    }
}