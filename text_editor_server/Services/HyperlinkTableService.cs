using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Linq;

using text_editor_server.Data;
using text_editor_server.DTOs.req;

namespace text_editor_server.Services;

public class HyperlinkTableService
{
    private readonly JObject _tableTemplate;
    private readonly AppDbContext _db;

    public HyperlinkTableService(AppDbContext db)
    {
        _db = db;
        _tableTemplate = GetTableTemplate();
    }
    public async Task<JObject> InsertTableToSection(Guid sectionId, JObject sfdt)
    {
        var section = await _db.Sections
            .FirstOrDefaultAsync(s => s.Id == sectionId);

        if (section == null)
            throw new Exception("Section not found");

        // 1. lấy section đầu tiên
        var sec = sfdt["sec"]?[0] as JObject;
        if (sec == null)
            throw new Exception("Invalid SFDT: missing sec");

        var blocks = sec["b"] as JArray;
        if (blocks == null)
            throw new Exception("Invalid SFDT: missing blocks (b)");

        // 2. convert block list
        var blockList = blocks
            .Cast<JObject>()
            .ToList();

        //2.1 Xóa bảng cũ nếu block cuối 
        blockList.RemoveAll(block =>
            block["r"] != null &&
            IsEnvidenceTable(block)
        );

        // 3. CHÈN TABLE
        blockList.Add(CreateEvidenceTable());

        // 4. replace lại blocks trong section
        sec["b"] = new JArray(blockList);

        // 5. build lại SFDT rút gọn để lưu DB
        var simplified = SerializeSection(sec);

        section.Content = simplified;
        section.Version++;
        section.Timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

        await _db.SaveChangesAsync();

        return JObject.Parse(simplified);
    }
    private string SerializeSection(JObject section)
    {
        return new JObject
        {
            ["b"] = section["b"],
            ["imgs"] = section["imgs"] ?? new JObject()
        }.ToString(Formatting.None);
    }

    private JObject CreateEvidenceTable()
    {
        var criteria = GetCriteriaFromDb();

        var table = (JObject)_tableTemplate.DeepClone();

        var rows = (JArray)table["r"]!;
        rows.Clear();

        rows.Add(CreateEvidenceRow(
            "No.",
            "Code",
            "Name of evidence",
            null));

        foreach (var criterion in criteria)
        {
            rows.Add(CreateCriterionRow(criterion.Title));

            int no = 1;

            foreach (var evidence in criterion.Evidences)
            {
                rows.Add(CreateEvidenceRow(
                    no.ToString(),
                    evidence.Code,
                    evidence.Name,
                    evidence.Url));

                no++;
            }
        }

        return table;
    }

    private JObject CreateCriterionRow(string title)
    {
        var row = JObject.Parse("""
    {
      "c":[
        {
          "b":[
            {
              "pf":{
                "bdrs":{"tp":{},"lt":{},"rg":{},"bt":{},"h":{},"v":{}},
                "lin":0,
                "fin":0,
                "stn":"Normal",
                "lif":{}
              },
              "cf":{},
              "i":[
                {
                  "cf":{"bi":false},
                  "tlp":""
                }
              ]
            }
          ],
          "tcpr":{
            "bdrs":{
              "tp":{},"lt":{},"rg":{},"bt":{},
              "dd":{},"du":{},"h":{},"v":{}
            },
            "sd":{},
            "pw":468,
            "cw":468,
            "colsp":3,
            "rwsp":1
          },
          "ci":0
        }
      ],
      "trpr":{
        "h":1,
        "ht":0,
        "bdrs":{
          "tp":{},"lt":{},"rg":{},"bt":{},
          "dd":{},"du":{},"h":{},"v":{}
        },
        "gb":0,
        "ga":0
      }
    }
    """);

        row["c"]![0]!["b"]![0]!["i"]![0]!["tlp"] = title;

        return row;
    }
    //Hàm tạo 1 row cho bảng minh chứng có link đính kèm:
    public JObject CreateEvidenceRow(
     string no,
     string code,
     string name,
     string? url)
    {
        var row = JObject.Parse("""
    {
      "c":[
        {
          "b":[
            {
              "pf":{
                "bdrs":{"tp":{},"lt":{},"rg":{},"bt":{},"h":{},"v":{}},
                "lin":0,
                "fin":0,
                "stn":"Normal",
                "lif":{}
              },
              "cf":{},
              "i":[]
            }
          ],
          "tcpr":{
            "bdrs":{"tp":{},"lt":{},"rg":{},"bt":{},"dd":{},"du":{},"h":{},"v":{}},
            "sd":{},
            "pw":156,
            "cw":156,
            "colsp":1,
            "rwsp":1
          },
          "ci":0
        },
        {
          "b":[
            {
              "pf":{
                "bdrs":{"tp":{},"lt":{},"rg":{},"bt":{},"h":{},"v":{}},
                "lin":0,
                "fin":0,
                "stn":"Normal",
                "lif":{}
              },
              "cf":{},
              "i":[]
            }
          ],
          "tcpr":{
            "bdrs":{"tp":{},"lt":{},"rg":{},"bt":{},"dd":{},"du":{},"h":{},"v":{}},
            "sd":{},
            "pw":156,
            "cw":156,
            "colsp":1,
            "rwsp":1
          },
          "ci":1
        },
        {
          "b":[
            {
              "pf":{
                "bdrs":{"tp":{},"lt":{},"rg":{},"bt":{},"h":{},"v":{}},
                "lin":0,
                "fin":0,
                "stn":"Normal",
                "lif":{}
              },
              "cf":{},
              "i":[]
            }
          ],
          "tcpr":{
            "bdrs":{"tp":{},"lt":{},"rg":{},"bt":{},"dd":{},"du":{},"h":{},"v":{}},
            "sd":{},
            "pw":156,
            "cw":156,
            "colsp":1,
            "rwsp":1
          },
          "ci":2
        }
      ],
      "trpr":{
        "h":1,
        "ht":0,
        "bdrs":{
          "tp":{},"lt":{},"rg":{},"bt":{},
          "dd":{},"du":{},"h":{},"v":{}
        },
        "gb":0,
        "ga":0
      }
    }
    """);

        // ===== Column No =====

        row["c"]![0]!["b"]![0]!["i"] = new JArray
    {
        new JObject
        {
            ["cf"] = new JObject
            {
                ["bi"] = false
            },
            ["tlp"] = no
        }
    };

        // ===== Column Code =====
        var codeRuns = new JArray();

        if (!string.IsNullOrWhiteSpace(url))
        {
            // Field Begin
            codeRuns.Add(new JObject
            {
                ["cf"] = new JObject
                {
                    ["hc"] = 0,
                    ["bi"] = false
                },
                ["ft"] = 0,
                ["hfe"] = true
            });

            // Hyperlink instruction
            codeRuns.Add(new JObject
            {
                ["cf"] = new JObject
                {
                    ["hc"] = 0,
                    ["bi"] = false
                },
                ["tlp"] = $" HYPERLINK \"{url}\" "
            });

            // Field Separator
            codeRuns.Add(new JObject
            {
                ["cf"] = new JObject
                {
                    ["hc"] = 0,
                    ["bi"] = false
                },
                ["ft"] = 2
            });

            // Text hiển thị
            codeRuns.Add(new JObject
            {
                ["cf"] = new JObject
                {
                    ["u"] = 1,
                    ["hc"] = 0,
                    ["fc"] = "#0563c1",
                    ["bi"] = false
                },
                ["tlp"] = code
            });

            // Field End
            codeRuns.Add(new JObject
            {
                ["cf"] = new JObject
                {
                    ["hc"] = 0,
                    ["bi"] = false
                },
                ["ft"] = 1
            });
        }
        else
        {
            codeRuns.Add(new JObject
            {
                ["cf"] = new JObject
                {
                    ["bi"] = false
                },
                ["tlp"] = code
            });
        }


        row["c"]![1]!["b"]![0]!["i"] = codeRuns;
        Console.WriteLine(
    row["c"]![1]!["b"]![0]!["i"]!.ToString()
);

        // ===== Column Name =====

        row["c"]![2]!["b"]![0]!["i"] = new JArray
    {
        new JObject
        {
            ["cf"] = new JObject
            {
                ["bi"] = false
            },
            ["tlp"] = name
        }
    };

        return row;
    }

    // New implementation: read criteria + evidences from DB.
    //private List<CriterionReq> GetCriteriaFromDb()
    //{
    //    // Query all sections ordered by OrderIndex (adjust filter if you need only certain sections)
    //    var sections = _db.Sections
    //        .Where(s => s.Level == 2)
    //        .OrderBy(s => s.OrderIndex)
    //        .Select(s => new { s.Id, s.Title })
    //        .ToList();

    //   // Console.WriteLine($"Found {sections.Count} sections in DB.");
    //    var result = new List<CriterionReq>();

    //    foreach (var s in sections)
    //    {

    //        var evidences =
    //        (
    //            from h in _db.SectionHyperlinks
    //            join p in _db.ProofFiles
    //                on h.ProofFileId equals p.Id into proofs
    //            from p in proofs.DefaultIfEmpty()

    //            where h.SectionId == s.Id && !string.IsNullOrEmpty(h.Code)

    //            orderby h.Position

    //            select new EvidenceReq
    //            {
    //                Code = h.Code ?? string.Empty,
    //                Name = p != null
    //              ? p.FileName
    //              : "No proof file",
    //               Url = h.Url ?? string.Empty
    //            }

    //        ).ToList();

    //        //Console.WriteLine($"Section '{s.Title}' has {evidences.Count} coded hyperlinks.");

    //        if (evidences.Count == 0)
    //        {
    //            // continue; // skip sections without coded hyperlinks

    //            //evidences.Add(new EvidenceReq
    //            //{
    //            //    Code = "N/A",
    //            //    Name = "No coded hyperlinks"
    //            //});
    //            continue;
    //        }


    //        result.Add(new CriterionReq
    //        {
    //            Title = s.Title,
    //            Evidences = evidences
    //        });
    //    }

    //    return result;
    //}

    private List<CriterionReq> GetCriteriaFromDb()
    {
        var sections = _db.Sections
            .Where(s => s.Level == 2)
            .OrderBy(s => s.OrderIndex)
            .Select(s => new { s.Id, s.Title })
            .ToList();

        var result = new List<CriterionReq>();

        foreach (var s in sections)
        {
            var evidences =
            (
                from h in _db.SectionHyperlinks
                join p in _db.ProofFiles
                    on h.ProofFileId equals p.Id into proofs
                from p in proofs.DefaultIfEmpty()

                where h.SectionId == s.Id && !string.IsNullOrEmpty(h.Code)

                orderby h.Position

                select new
                {
                    h.Code,
                    h.Url,
                    h.ProofFileId,
                    ProofFileName = p != null ? p.FileName : null
                }

            ).ToList()
            .Select(x => new EvidenceReq
            {
                Code = x.Code ?? string.Empty,
                Name = x.ProofFileName
                       ?? _db.Folders
                           .Where(f => f.Id == x.ProofFileId)
                           .Select(f => f.Name)
                           .FirstOrDefault()
                       ?? "No proof file",
                Url = x.Url ?? string.Empty
            })
            .ToList();

            if (evidences.Count == 0)
            {
                continue;
            }

            result.Add(new CriterionReq
            {
                Title = s.Title,
                Evidences = evidences
            });
        }

        return result;
    }

    private JObject GetTableTemplate()
    {
        return JObject.Parse("""
        {
          "r":[],
          "grd":[156,156,156],
          "colc":3,
          "tblpr":{
            "bdrs":{
              "tp":{"ls":0,"lw":0.5},
              "lt":{"ls":0,"lw":0.5},
              "rg":{"ls":0,"lw":0.5},
              "bt":{"ls":0,"lw":0.5},
              "dd":{},
              "du":{},
              "h":{"ls":0,"lw":0.5},
              "v":{"ls":0,"lw":0.5}
            },
            "sd":{},
            "lin":0,
            "tm":0,
            "rm":5.4,
            "lm":5.4,
            "bm":0
          }
        }
        """);
    }

    // Hàm kiểm tra xem block cuối cùng có phải là bảng minh chứng hay không?
    private bool IsEnvidenceTable (JObject table)
    {
        try
        {
            var rows = table["r"] as JArray;
            if (rows == null || rows.Count == 0)
                return false;


            var firstRow = rows[0] as JObject;

            var cells = firstRow?["c"] as JArray;

            //Kiểm tra từng ô:
            if (cells == null || cells.Count < 3)
                return false;

            var no = cells[0]?["b"]?[0]?["i"]?[0]?["tlp"]?.ToString();
            var code = cells[1]?["b"]?[0]?["i"]?[0]?["tlp"]?.ToString();
            var name = cells[2]?["b"]?[0]?["i"]?[0]?["tlp"]?.ToString();

            return no == "No." && code == "Code" && name == "Name of evidence";
        }
        catch
        {
            return false;
        }
    }
}
