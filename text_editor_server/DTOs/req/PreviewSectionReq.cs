namespace text_editor_server.DTOs.req
{
    public class PreviewSectionReq
    {
        public Guid SectionId { get; set; }
        public string SectionContent { get; set; }
        public Guid DocumentId { get; set; }
    }
}
