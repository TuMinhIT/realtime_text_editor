namespace text_editor_server.Entities
{
    public class DocumentSnapshot
    {
        public Guid Id { get; set; }
        public Guid DocumentId { get; set; }
        public string Content { get; set; } = string.Empty;
    
        public string Title { get; set; } = string.Empty;
        public int Version { get; set; } = 0; // For Operational Transformation
    }
    
}
