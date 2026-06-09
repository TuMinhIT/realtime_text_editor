namespace text_editor_server.Entities
{
    public class DocumentFile
    {
        public Guid Id { get; set; }

        public Guid DocumentId { get; set; }

        public Guid? FileId { get; set; } 

        public Guid? FolderId { get; set; }

        public Guid AttachedBy { get; set; }
        public DateTime AttachedAt { get; set; }

        // navigation
        public Document Document { get; set; } = null!;

        public ProofFile? File { get; set; }

        public Folder? Folder { get; set; }
        
    }
}


