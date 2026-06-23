namespace text_editor_server.DTOs.req
{
    public class CriterionReq
    {
        /// <summary>
        /// Tên tài liệu
        /// </summary>
        public string Title { get; set; } = string.Empty;

        /// <summary>
        ///  Danh sách section
        /// </summary>
        public List<EvidenceReq> Evidences { get; set; } = new List<EvidenceReq>();
    }
}