namespace text_editor_server.Entities
{
  
    public class DocumentPermission
    {
        public Guid Id { get; set; }

        public Guid DocumentId { get; set; }
        public Guid UserId { get; set; }

        public string Role { get; set; } = "Viewer";
        // Owner | Editor | Viewer

        public string? EditableRanges { get; set; }
        // JSON: ["range1","range2"]
    }
    
}
