namespace text_editor_server.Entities
{
    public class SectionHyperlink
    {
        public Guid Id { get; set; }

        // section chứa hyperlink
        public Guid SectionId { get; set; }

        public Section Section { get; set; }

        // mã hiển thị: [1.1-01]
        // phase đầu sẽ null
        public string? Code { get; set; }

        // link thật
        public string Url { get; set; } = string.Empty;

        // section owner của proof
        // chỉ có sau phase recalculate owner
        public Guid? OwnerSectionId { get; set; }

        public Section? OwnerSection { get; set; }

        // vị trí hyperlink trong section
        public int Position { get; set; }

        // file minh chứng nếu có
        public Guid? ProofFileId { get; set; }

        public DateTime CreatedAt { get; set; }
    }
}