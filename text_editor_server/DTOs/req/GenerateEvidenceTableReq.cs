namespace text_editor_server.DTOs.req
{
    public class GenerateEvidenceTableReq
    {
        /// <summary>
        /// Tiêu đề phụ lục, ví dụ: "Appendix A: Evidence Table"
        /// </summary>
        public string AppendixTitle { get; set; } = string.Empty;


        /// <summary>
        /// Danh sách các tiêu chí và minh chứng tương ứng để tạo bảng minh chứng
        /// </summary>
        public List<CriterionReq> Criteria { get; set; } = new List<CriterionReq>();
    }
}
