using System.Text.Json;
using System.Text.RegularExpressions;
using text_editor_server.DTOs.res;
using text_editor_server.Entities;

namespace text_editor_server.Services
{
    public class HyperlinkEngine
    {
        public HyperLinkRewriteResult BuildAndRewrite(
     JsonElement sfdt,
     Guid currentSectionId,
     string sectionCode,
     List<SectionHyperlink> existingLinks)
        {
            var result = new List<HyperlinkIndexedRes>();

            if (!sfdt.TryGetProperty("b", out var blocks))
            {
                return new HyperLinkRewriteResult
                {
                    Sfdt = sfdt,
                    Hyperlinks = result
                };
            }

            var updatedBlocks = new List<JsonElement>();

            int linkCounter =
                GetMaxCounter(existingLinks, sectionCode);

            foreach (var block in blocks.EnumerateArray())
            {
                if (!block.TryGetProperty("i", out var inlineNodes))
                {
                    updatedBlocks.Add(block);
                    continue;
                }

                var updatedNodes = new List<JsonElement>();

                bool insideHyperlink = false;
                string currentUrl = "";

                foreach (var node in inlineNodes.EnumerateArray())
                {
                    var currentNode = node;

                    // ================= START FIELD =================

                    if (node.TryGetProperty("ft", out var ftStart)
                        && ftStart.GetInt32() == 0)
                    {
                        insideHyperlink = true;

                        updatedNodes.Add(currentNode);
                        continue;
                    }

                    // ================= FIELD INSTRUCTION =================

                    if (insideHyperlink
                        && node.TryGetProperty("tlp", out var instructionProp))
                    {
                        var instructionText =
                            instructionProp.GetString();

                        if (!string.IsNullOrWhiteSpace(instructionText)
                            && instructionText.TrimStart()
                                .StartsWith(
                                    "HYPERLINK",
                                    StringComparison.OrdinalIgnoreCase))
                        {
                            currentUrl =
                                ExtractHyperlink(instructionText);

                            updatedNodes.Add(currentNode);
                            continue;
                        }
                    }

                    // ================= FIELD SEPARATOR =================

                    if (insideHyperlink
                        && node.TryGetProperty("ft", out var ftSeparator)
                        && ftSeparator.GetInt32() == 2)
                    {
                        updatedNodes.Add(currentNode);
                        continue;
                    }

                    // ================= DISPLAY TEXT =================

                    if (insideHyperlink
                        && node.TryGetProperty("tlp", out var displayProp)
                        && !string.IsNullOrWhiteSpace(currentUrl))
                    {
                        Guid? proofFileId =
                            ExtractProofFileId(currentUrl);

                        string finalCode;

                        var existed = existingLinks
                            .FirstOrDefault(x =>
                                proofFileId != null
                                && x.ProofFileId == proofFileId);

                        if (existed != null)
                        {
                            // Đã tồn tại hyperlink cho proof file này, dùng lại code cũ
                            finalCode = existed.Code;
                            //cache reuse:
                            existingLinks.Add(new SectionHyperlink
                            {

                                SectionId = currentSectionId,
                                //Kế thừa owner cũ:
                                OwnerSectionId = existed.OwnerSectionId,


                                ProofFileId = proofFileId,
                                Url = currentUrl,
                                Code = finalCode
                            });
                        }
                        else
                        {
                            linkCounter++;

                            finalCode =
                                $"{sectionCode}-{linkCounter:D2}";

                            existingLinks.Add(new SectionHyperlink
                            {
                                //Tự làm owner:
                                SectionId = currentSectionId,


                                //Set owner cho section hiện tại với link chưa từng được section nào sử dụng trong tài liệu

                                OwnerSectionId = currentSectionId,
                                ProofFileId = proofFileId,
                                Url = currentUrl,
                                Code = finalCode
                            });
                        }

                        result.Add(new HyperlinkIndexedRes
                        {
                            Code = finalCode,
                            Url = currentUrl
                        });

                        // CHỈ replace DISPLAY TEXT
                        currentNode = UpdateNodeText(
                            node,
                            $"[{finalCode}]");

                        updatedNodes.Add(currentNode);

                        continue;
                    }

                    // ================= END FIELD =================

                    if (insideHyperlink
                        && node.TryGetProperty("ft", out var ftEnd)
                        && ftEnd.GetInt32() == 1)
                    {
                        insideHyperlink = false;
                        currentUrl = "";

                        updatedNodes.Add(currentNode);
                        continue;
                    }

                    updatedNodes.Add(currentNode);
                }

                updatedBlocks.Add(
                    UpdateBlock(block, updatedNodes));
            }

            var updatedSfdt =
                UpdateSfdt(sfdt, updatedBlocks);

            return new HyperLinkRewriteResult
            {
                Sfdt = updatedSfdt,
                Hyperlinks = result
            };
        }

        // ================= EXTRACT PROOF FILE ID =================

        private Guid? ExtractProofFileId(string url)
        {
            if (string.IsNullOrWhiteSpace(url))
                return null;

            var match = Regex.Match(
                url,
                @"([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12})");

            if (!match.Success)
                return null;

            return Guid.TryParse(
                match.Value,
                out var id)
                ? id
                : null;
        }

        // ================= GET MAX COUNTER =================

        private int GetMaxCounter(
            List<SectionHyperlink> links,
            string sectionCode)
        {
            var nums = links
                .Where(x =>
                    !string.IsNullOrWhiteSpace(x.Code)
                    && x.Code.StartsWith(sectionCode + "-"))
                .Select(x =>
                {
                    var parts = x.Code.Split('-');

                    if (parts.Length < 2)
                        return 0;

                    return int.TryParse(parts[1], out var n)
                        ? n
                        : 0;
                });

            return nums.Any()
                ? nums.Max()
                : 0;
        }


        // ================= EXTRACT URL =================
        private string ExtractHyperlink(string text)
        {
            const string prefix = "HYPERLINK \"";

            var start = text.IndexOf(prefix, StringComparison.OrdinalIgnoreCase);

            if (start == -1)
                return "";

            start += prefix.Length;

            var end = text.IndexOf("\"", start);

            if (end == -1)
                return "";

            return text.Substring(start, end - start);
        }


        // ================= UPDATE NODE =================

        private JsonElement UpdateNodeText(
            JsonElement node,
            string newText)
        {
            var dict =
                JsonSerializer.Deserialize<
                    Dictionary<string, object>>(
                        node.GetRawText());

            dict["tlp"] = newText;

            return JsonSerializer.Deserialize<JsonElement>(
                JsonSerializer.Serialize(dict));
        }

        // ================= UPDATE BLOCK =================

        private JsonElement UpdateBlock(
            JsonElement block,
            List<JsonElement> nodes)
        {
            var dict =
                JsonSerializer.Deserialize<
                    Dictionary<string, object>>(
                        block.GetRawText());

            dict["i"] = nodes;

            return JsonSerializer.Deserialize<JsonElement>(
                JsonSerializer.Serialize(dict));
        }

        // ================= UPDATE SFDT =================

        private JsonElement UpdateSfdt(
            JsonElement sfdt,
            List<JsonElement> blocks)
        {
            var dict =
                JsonSerializer.Deserialize<
                    Dictionary<string, object>>(
                        sfdt.GetRawText());

            dict["b"] = blocks;

            return JsonSerializer.Deserialize<JsonElement>(
                JsonSerializer.Serialize(dict));
        }
    }
}