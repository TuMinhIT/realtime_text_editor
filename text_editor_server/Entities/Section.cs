    namespace text_editor_server.Entities
{
    public class Section
    {
        public Guid Id { get; set; }
        public Guid DocumentId { get; set; }
        public string Title { get; set; }
        public int Level { get; set; }
        public int OrderIndex { get; set; }
        public Guid? ParentSectionId { get; set; }

        public Section? ParentSection { get; set; }
        public string Content { get; set; } = "";
        public ICollection<Section> Children { get; set; } = new List<Section>();
        public int Version { get; set; } = 0;
        public long Timestamp { get; set; } = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        public ICollection<SectionPermission> Assignments { get; set; } = new List<SectionPermission>();
    }
}