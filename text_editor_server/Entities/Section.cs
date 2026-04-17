namespace text_editor_server.Entities
{
    public class Section
    {
        public Guid Id { get; set; }
        public string Name { get; set; } // 1.1, 2.1
        public string Content { get; set; } = ""; // SFDT JSON or rich text
        public int Version { get; set; } = 0; // For Operational Transformation
        public long Timestamp { get; set; } = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

        public Guid DocumentId { get; set; }
        public Document Document { get; set; }

        // Navigation properties
        public ICollection<SectionUser> Assignments { get; set; } = new List<SectionUser>();
        public ICollection<OperationalChange> ChangeLog { get; set; } = new List<OperationalChange>();
    }
}
