namespace text_editor_server.Realtime.Models
{
    public class ConnectionInfo
    {
        public string ConnectionId { get; set; } = default!;

        //Thông tin user
        public Guid UserId { get; set; }
        public string FullName { get; set; } = string.Empty;

        //Xác định section nào đang được xem, và quyền:
        public Guid? CurrentSectionId { get; set; }
        public bool isEdit { get; set; } = false;
        //Xác định thời gian kết nối, để kiểm soát timeout:
        public DateTime ConnectedAt { get; set; } = DateTime.UtcNow;

        public DateTime LastActivityAt { get; set; } = DateTime.UtcNow;


    }
}
