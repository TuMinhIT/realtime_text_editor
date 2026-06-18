namespace text_editor_server.Entities
{
    public class Document
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? SourceFilePath { get; set; }
        public Guid CreatedBy { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public User? Creator { get; set; }
        public ICollection<Section> Sections { get; set; } = new List<Section>();

        public ICollection<DocumentFile> DocumentFiles { get; set; } = new List<DocumentFile>();

        public bool isActive { get; set; } = false;
        public bool hasChanges { get; set; } = false;


    }
}
