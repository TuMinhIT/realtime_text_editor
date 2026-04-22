namespace text_editor_server.Entities
{
    public class DocumentBlock
    {
        public Guid Id { get; set; }

        public Guid DocumentId { get; set; }

        public string Name { get; set; } = string.Empty;
        // VD: "Introduction", "Clause 1"

        public string RangeKey { get; set; } = string.Empty;
        // map với editing region trong editor

        public int Order { get; set; } // để sort

        public string? Metadata { get; set; } // JSON mở rộng sau này
    }
}
