
using System.Text.Json;

namespace text_editor_server.DTOs.res
{
    public class HyperLinkRewriteResult
    {
        public JsonElement  Sfdt { get; set; }

        public List<HyperlinkIndexedRes> Hyperlinks { get; set; }
    }
}
