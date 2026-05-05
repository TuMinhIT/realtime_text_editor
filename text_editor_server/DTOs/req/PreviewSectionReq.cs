namespace text_editor_server.DTOs.req
{
    public class PreviewSectionReq
    {
        public string SectionContent { get; set; }
        public Guid DocumentId { get; set; }
    }
}
