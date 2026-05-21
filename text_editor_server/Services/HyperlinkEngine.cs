using System.Text.Json;
using text_editor_server.DTOs.res;

namespace text_editor_server.Services
{
    public class HyperlinkEngine
    {
        // This method processes the SFDT JSON, identifies hyperlinks, replaces their display text with unique codes, and collects the original URLs in a list.
        public HyperLinkRewriteResult BuildAndRewrite(JsonElement sfdt, string sectionCode)
        {
            var result = new List<HyperlinkIndexedRes>();

            if (!sfdt.TryGetProperty("b", out var sections))
                return new HyperLinkRewriteResult { Sfdt = sfdt, Hyperlinks = result };

            var updatedSections = new List<JsonElement>();

            int linkCounter = 0;

            foreach (var section in sections.EnumerateArray())
            {
                if (!section.TryGetProperty("i", out var inlineNodes))
                {
                    updatedSections.Add(section);
                    continue;
                }

                var updatedNodes = new List<JsonElement>();

                bool insideHyperlink = false;
                string currentUrl = "";

                foreach (var node in inlineNodes.EnumerateArray())
                {
                    // clone node
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
                        && node.TryGetProperty("tlp", out var instructionTlp))
                    {
                        var instructionText = instructionTlp.GetString();

                        if (!string.IsNullOrEmpty(instructionText)
                            && instructionText.Contains("HYPERLINK"))
                        {
                            currentUrl = ExtractHyperlink(instructionText);

                            updatedNodes.Add(currentNode);
                            continue;
                        }
                    }

                    // ================= SEPARATOR =================
                    if (insideHyperlink
                        && node.TryGetProperty("ft", out var ftSeparator)
                        && ftSeparator.GetInt32() == 2)
                    {
                        updatedNodes.Add(currentNode);
                        continue;
                    }

                    // ================= DISPLAY TEXT =================
                    if (insideHyperlink
                        && node.TryGetProperty("tlp", out var displayTlp)
                        && !string.IsNullOrEmpty(currentUrl))
                    {
                        linkCounter++;

                        var code = $"[{sectionCode}-{linkCounter:D2}]";

                        result.Add(new HyperlinkIndexedRes
                        {
                            Code = $"{sectionCode}-{linkCounter:D2}",
                            Url = currentUrl
                        });

                        currentNode = UpdateNodeText(node, code);

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

                    // default
                    updatedNodes.Add(currentNode);
                }

                updatedSections.Add(UpdateSection(section, updatedNodes));
            }

            var updatedSfdt = UpdateSfdt(sfdt, updatedSections);

            return new HyperLinkRewriteResult
            {
                Sfdt  = updatedSfdt,
                Hyperlinks = result
            };
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
        private JsonElement UpdateNodeText(JsonElement node, string newText)
        {
            var dict = JsonSerializer.Deserialize<Dictionary<string, object>>(
                node.GetRawText());

            dict["tlp"] = newText;

            return JsonSerializer.Deserialize<JsonElement>(
                JsonSerializer.Serialize(dict));
        }

        // ================= UPDATE SECTION =================
        private JsonElement UpdateSection(
            JsonElement section,
            List<JsonElement> nodes)
        {
            var dict = JsonSerializer.Deserialize<Dictionary<string, object>>(
                section.GetRawText());

            dict["i"] = nodes;

            return JsonSerializer.Deserialize<JsonElement>(
                JsonSerializer.Serialize(dict));
        }

        // ================= UPDATE SFDT =================
        private JsonElement UpdateSfdt(
            JsonElement sfdt,
            List<JsonElement> sections)
        {
            var dict = JsonSerializer.Deserialize<Dictionary<string, object>>(
                sfdt.GetRawText());

            dict["b"] = sections;

            return JsonSerializer.Deserialize<JsonElement>(
                JsonSerializer.Serialize(dict));
        }
    }
}