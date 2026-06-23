namespace text_editor_server.DTOs.req
{
    public class EvidenceReq
    {
        /// <summary>
        /// Mã tài liệu minnh chứng [1.1-01]
        /// </summary>
        public string Code { get; set; } = string.Empty;

        /// <summary>
        /// Tên tài liệu minh chứng
        /// </summary>
        public string Name { get; set; } = string.Empty;

        ///<summary>
        ///Link tài liệu minh chứng:
        ///</summary>      
        public string Url { get; set; } = string.Empty;
        
    }
}