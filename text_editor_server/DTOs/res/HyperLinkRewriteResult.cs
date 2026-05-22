
using System.Text.Json;
using text_editor_server.Entities;

namespace text_editor_server.DTOs.res
{
    public class HyperLinkRewriteResult
    {
        public JsonElement  Sfdt { get; set; }

        public List<HyperlinkIndexedRes> Hyperlinks { get; set; }
        
        //Thêm list để check danh sách tồn tại:
        public List<SectionHyperlink> existingLinks { get; set; } = new List<SectionHyperlink>();
    }
}
