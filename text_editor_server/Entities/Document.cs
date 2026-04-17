namespace text_editor_server.Entities
{
    public class Document
    {
        public Guid Id { get; set; }
        public string Title { get; set; }
        public Guid CreatedBy { get; set; } // UserId
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public string? SourceFilePath { get; set; } // Path to original .docx file

        // Navigation properties
        public User Creator { get; set; }
        public ICollection<Section> Sections { get; set; } = new List<Section>();
    }
}
