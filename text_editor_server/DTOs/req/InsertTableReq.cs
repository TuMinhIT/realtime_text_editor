using Newtonsoft.Json.Linq;

namespace text_editor_server.DTOs.req
{
    public class InsertTableReq
    {
        public Object sfdt { get; set; } 
        public Guid sectionId { get; set; } = Guid.Empty;

    }
}
