

namespace text_editor_server.Entities
{
    public class Section
    {
        public Guid Id { get; set; }
        public Guid DocumentId { get; set; }
        public string Title { get; set; }
        public int OrderIndex { get; set; } // For ordering sections within a document
        public Guid? ParentSectionId { get; set; } // For hierarchical sections
        public string JsonContent { get; set; } = ""; // SFDT JSON or rich text
        public int Version { get; set; } = 0; // For Operational Transformation
        public long Timestamp { get; set; } = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        public ICollection<SectionPermission> Assignments { get; set; } = new List<SectionPermission>();
    }
}
