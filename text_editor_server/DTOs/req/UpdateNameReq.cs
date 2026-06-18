namespace text_editor_server.DTOs.req
{
    public class UpdateNameReq
    {
        public Guid id { get; set; }
        public string fileName { get; set; } = string.Empty;
    }
}