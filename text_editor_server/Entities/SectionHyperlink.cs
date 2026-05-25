namespace text_editor_server.Entities
{
    public class SectionHyperlink
    {
        public Guid Id { get; set; }

        // section chứa hyperlink
        public Guid SectionId { get; set; }

        public Section Section { get; set; }

        // mã hiển thị: [1.1-01]
        public string Code { get; set; } = string.Empty;

        // link thật
        public string Url { get; set; } = string.Empty;


        //Owner section hyperlink:
        public Guid OwnerSectionId { get; set; } //Mục tiêu để xác định file minh chứng thuộc về section nào.
        public Section OwnerSection { get; set; }


        // file minh chứng nếu có
        public Guid? ProofFileId { get; set; }

        public ProofFile? ProofFile { get; set; }

        public DateTime CreatedAt { get; set; }
    }
}
