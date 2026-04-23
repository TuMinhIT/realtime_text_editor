namespace text_editor_server.DTOs.res
{
    public class DocumentRes
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string? SourceFilePath { get; set; }
        public Guid CreatedBy { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public UserRes? Creator { get; set; }

    }
}
