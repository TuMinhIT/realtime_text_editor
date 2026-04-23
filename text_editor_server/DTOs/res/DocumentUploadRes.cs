using text_editor_server.Services;

namespace text_editor_server.DTOs.res
{

    public class DocumentUploadRes
    {
        public Guid DocumentId { get; set; }
        public string Title { get; set; } = string.Empty;
        public List<DocumentBlockItemRes> Blocks { get; set; } = new();
    }

}
