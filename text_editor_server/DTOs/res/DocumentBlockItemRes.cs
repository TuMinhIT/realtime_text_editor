namespace text_editor_server.DTOs.res
{
    public class DocumentBlockItemRes
    {
        public Guid SectionId { get; set; }
        public string Title { get; set; } = string.Empty;
        public int Order { get; set; }
        public string Preview { get; set; } = string.Empty;
    }
}
