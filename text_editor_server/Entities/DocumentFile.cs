
namespace text_editor_server.Entities
{
    public class DocumentFile
    {
        public Guid Id { get; set; }

        public Guid DocumentId { get; set; }

        public Guid FileId { get; set; }

        public Guid AttachedBy { get; set; }

        public DateTime AttachedAt { get; set; }

        // navigation
        //public DocumentEntity Document { get; set; } = null!;

        //public FileEntity File { get; set; } = null!;
        
    }
}
