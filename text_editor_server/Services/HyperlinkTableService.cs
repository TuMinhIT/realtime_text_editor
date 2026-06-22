
using Newtonsoft.Json.Linq;
using text_editor_server.DTOs.req;

namespace text_editor_server.Services;

public class HyperlinkTableService
{
    private readonly JObject _tableTemplate;

    public HyperlinkTableService()
    {
        _tableTemplate = GetTableTemplate();
    }

    public JObject InsertTableAtEnd(JObject document)
    {
        if (document["sec"] is not JArray sections)
            throw new Exception("Document missing sec array");

        var lastSection = (JObject)sections.Last!;

        if (lastSection["b"] is not JArray blocks)
            throw new Exception("Section missing blocks");

        blocks.Add(CreateEvidenceTable());

        return document;
    }

    private JObject CreateEvidenceTable()
    {
        var criteria = GetMockCriteria();

        var table = (JObject)_tableTemplate.DeepClone();

        var rows = (JArray)table["r"]!;
        rows.Clear();

        rows.Add(CreateEvidenceRow(
            "No.",
            "Code",
            "Name of evidence"));

        foreach (var criterion in criteria)
        {
            rows.Add(CreateCriterionRow(criterion.Title));

            int no = 1;

            foreach (var evidence in criterion.Evidences)
            {
                rows.Add(CreateEvidenceRow(
                    no.ToString(),
                    evidence.Code,
                    evidence.Name));

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

    private JObject CreateEvidenceRow(
      string no,
      string code,
      string name)
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
              "i":[
                {
                  "cf":{"bi":false},
                  "tlp":""
                }
              ]
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
              "i":[
                {
                  "cf":{"bi":false},
                  "tlp":""
                }
              ]
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

        row["c"]![0]!["b"]![0]!["i"]![0]!["tlp"] = no;
        row["c"]![1]!["b"]![0]!["i"]![0]!["tlp"] = code;
        row["c"]![2]!["b"]![0]!["i"]![0]!["tlp"] = name;

        return row;
    }
    private List<CriterionReq> GetMockCriteria()
    {
        return
        [
            new CriterionReq
            {
                Title = "Criterion 1: Expected Learning Outcomes",
                Evidences =
                [
                    new EvidenceReq
                    {
                        Code = "1.1-01",
                        Name = "Programme Learning Outcomes"
                    },
                    new EvidenceReq
                    {
                        Code = "1.1-02",
                        Name = "Course Learning Outcomes Mapping"
                    }
                ]
            },

            new CriterionReq
            {
                Title = "Criterion 2: Programme Structure and Content",
                Evidences =
                [
                    new EvidenceReq
                    {
                        Code = "2.1-01",
                        Name = "Curriculum Structure"
                    },
                    new EvidenceReq
                    {
                        Code = "2.1-02",
                        Name = "Curriculum Review Report"
                    }
                ]
            },

            new CriterionReq
            {
                Title = "Criterion 3: Teaching and Learning Approach",
                Evidences =
                [
                    new EvidenceReq
                    {
                        Code = "3.1-01",
                        Name = "Teaching Plan"
                    },
                    new EvidenceReq
                    {
                        Code = "3.1-02",
                        Name = "Learning Activities"
                    }
                ]
            },

            new CriterionReq
            {
                Title = "Criterion 4: Student Assessment",
                Evidences =
                [
                    new EvidenceReq
                    {
                        Code = "4.1-01",
                        Name = "Assessment Rubrics"
                    },
                    new EvidenceReq
                    {
                        Code = "4.1-02",
                        Name = "Final Examination"
                    }
                ]
            }
        ];
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
}

