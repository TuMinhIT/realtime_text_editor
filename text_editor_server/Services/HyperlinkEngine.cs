using System.Text.Json;
using System.Text.RegularExpressions;
using text_editor_server.DTOs.res;

namespace text_editor_server.Services
{
    public class HyperlinkEngine
    {
        public HyperLinkRewriteResult BuildAndRewrite(
            JsonElement sfdt)
        {
            var result =
                new List<HyperlinkIndexedRes>();

            if (!sfdt.TryGetProperty("b", out var blocks))
            {
                return new HyperLinkRewriteResult
                {
                    Sfdt = sfdt,
                    Hyperlinks = result
                };
            }

            var updatedBlocks =
                new List<JsonElement>();

            int position = 0;

            foreach (var block in blocks.EnumerateArray())
            {
                if (!block.TryGetProperty("i", out var inlineNodes))
                {
                    updatedBlocks.Add(block);
                    continue;
                }

                var updatedNodes =
                    new List<JsonElement>();

                bool insideHyperlink = false;
                bool passedSeparator = false;
                bool hyperlinkCaptured = false;

                string currentUrl = "";

                foreach (var node in inlineNodes.EnumerateArray())
                {
                    var currentNode = node;

                    // ================= START FIELD =================

                    if (node.TryGetProperty("ft", out var ftStart)
                        && ftStart.GetInt32() == 0)
                    {
                        insideHyperlink = true;
                        passedSeparator = false;
                        hyperlinkCaptured = false;
                        currentUrl = "";

                        updatedNodes.Add(currentNode);
                        continue;
                    }

                    // ================= INSTRUCTION =================

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
                                ExtractHyperlink(
                                    instructionText);

                            updatedNodes.Add(currentNode);
                            continue;
                        }
                    }

                    // ================= SEPARATOR =================

                    // bỏ toàn bộ text còn lại trong hyperlink
                    if (insideHyperlink
                      && passedSeparator
                      && hyperlinkCaptured
                      && node.TryGetProperty("tlp", out var t))
                    {
                        Console.WriteLine(t.GetString());
                        continue;
                    }

                    if (insideHyperlink
                        && node.TryGetProperty("ft", out var ftSeparator)
                        && ftSeparator.GetInt32() == 2)
                    {
                        passedSeparator = true;

                        updatedNodes.Add(currentNode);
                        continue;
                    }

                    // ================= DISPLAY TEXT =================

                    if (insideHyperlink
                        && passedSeparator
                        && !hyperlinkCaptured
                        && node.TryGetProperty("tlp", out _)
                        && !string.IsNullOrWhiteSpace(currentUrl))
                    {
                        position++;

                        var proofFileId =
                            ExtractProofFileId(
                                currentUrl);

                        result.Add(
                            new HyperlinkIndexedRes
                            {
                                Url = currentUrl,
                                ProofFileId = proofFileId,
                                Position = position
                            });

                        hyperlinkCaptured = true;

                        // placeholder
                        currentNode =
                            UpdateNodeText(
                                node,
                                "[LINK]");

                        updatedNodes.Add(currentNode);
                        continue;
                    }

                    // ================= END FIELD =================

                    if (insideHyperlink
                        && node.TryGetProperty("ft", out var ftEnd)
                        && ftEnd.GetInt32() == 1)
                    {
                        insideHyperlink = false;
                        passedSeparator = false;
                        hyperlinkCaptured = false;
                        currentUrl = "";

                        updatedNodes.Add(currentNode);
                        continue;
                    }

                    updatedNodes.Add(currentNode);
                }

                updatedBlocks.Add(
                    UpdateBlock(
                        block,
                        updatedNodes));
            }

            var updatedSfdt =
                UpdateSfdt(
                    sfdt,
                    updatedBlocks);

            return new HyperLinkRewriteResult
            {
                Sfdt = updatedSfdt,
                Hyperlinks = result
            };
        }

        public JsonElement RewriteDisplayCodes(
            JsonElement sfdt,
            Dictionary<Guid?, string> codeMap)
        {
            if (!sfdt.TryGetProperty("b", out var blocks))
            {
                return sfdt;
            }

            var updatedBlocks =
                new List<JsonElement>();

            foreach (var block in blocks.EnumerateArray())
            {
                if (!block.TryGetProperty("i", out var inlineNodes))
                {
                    updatedBlocks.Add(block);
                    continue;
                }

                var updatedNodes =
                    new List<JsonElement>();

                bool insideHyperlink = false;
                bool passedSeparator = false;
                bool replacedDisplay = false;

                string currentUrl = "";

                foreach (var node in inlineNodes.EnumerateArray())
                {
                    var currentNode = node;

                    // START FIELD
                    if (node.TryGetProperty("ft", out var ftStart)
                        && ftStart.GetInt32() == 0)
                    {
                        insideHyperlink = true;
                        passedSeparator = false;
                        replacedDisplay = false;
                        currentUrl = "";

                        updatedNodes.Add(currentNode);
                        continue;
                    }

                    // INSTRUCTION
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
                                ExtractHyperlink(
                                    instructionText);

                            updatedNodes.Add(currentNode);
                            continue;
                        }
                    }

                    // SEPARATOR
                    if (insideHyperlink
                        && node.TryGetProperty("ft", out var ftSeparator)
                        && ftSeparator.GetInt32() == 2)
                    {
                        passedSeparator = true;

                        updatedNodes.Add(currentNode);
                        continue;
                    }

                    // DISPLAY TEXT
                    if (insideHyperlink
                        && passedSeparator
                        && !replacedDisplay
                        && node.TryGetProperty("tlp", out _)
                        && !string.IsNullOrWhiteSpace(currentUrl))
                    {
                        var proofId = ExtractProofFileId(currentUrl);

                        if (proofId != null
                            && codeMap.TryGetValue(proofId, out var code))
                        {
                            currentNode =
                                UpdateNodeText(
                                    node,
                                    $"[{code}]");
                        }

                        replacedDisplay = true;

                        updatedNodes.Add(currentNode);
                        continue;
                    }

                    // END FIELD
                    if (insideHyperlink
                        && node.TryGetProperty("ft", out var ftEnd)
                        && ftEnd.GetInt32() == 1)
                    {
                        insideHyperlink = false;
                        passedSeparator = false;
                        replacedDisplay = false;
                        currentUrl = "";

                        updatedNodes.Add(currentNode);
                        continue;
                    }

                    updatedNodes.Add(currentNode);
                }

                updatedBlocks.Add(
                    UpdateBlock(
                        block,
                        updatedNodes));
            }

            return UpdateSfdt(
                sfdt,
                updatedBlocks);
        }

        private Guid? ExtractProofFileId(
            string url)
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

        private string ExtractHyperlink(
            string text)
        {
            if (string.IsNullOrWhiteSpace(text))
                return "";

            var match = Regex.Match(
                text,
                @"HYPERLINK\s+""([^""]+)""",
                RegexOptions.IgnoreCase);

            return match.Success
                ? match.Groups[1].Value
                : "";
        }

        private JsonElement UpdateNodeText(
            JsonElement node,
            string newText)
        {
            var dict =
                JsonSerializer.Deserialize<
                    Dictionary<string, object>>(
                        node.GetRawText())
                ?? new();

            dict["tlp"] = newText;

            return JsonSerializer.Deserialize<JsonElement>(
                JsonSerializer.Serialize(dict));
        }

        private JsonElement UpdateBlock(
            JsonElement block,
            List<JsonElement> nodes)
        {
            var dict =
                JsonSerializer.Deserialize<
                    Dictionary<string, object>>(
                        block.GetRawText())
                ?? new();

            dict["i"] = nodes;

            return JsonSerializer.Deserialize<JsonElement>(
                JsonSerializer.Serialize(dict));
        }

        private JsonElement UpdateSfdt(
            JsonElement sfdt,
            List<JsonElement> blocks)
        {
            var dict =
                JsonSerializer.Deserialize<
                    Dictionary<string, object>>(
                        sfdt.GetRawText())
                ?? new();

            dict["b"] = blocks;

            return JsonSerializer.Deserialize<JsonElement>(
                JsonSerializer.Serialize(dict));
        }
    }
}