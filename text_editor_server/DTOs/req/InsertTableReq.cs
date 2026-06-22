using Newtonsoft.Json.Linq;

namespace text_editor_server.DTOs.req
{
    public class InsertTableReq
    {
        public JObject? sfdt { get; set; }


        //  public GenerateEvidenceTableReq? TableData { get; set; } = new();
    }
}
