namespace text_editor_server.Realtime.DTOs
{
    public class SectionPresenceDto
    {
        public Guid SectionId { get; set; }

        //Danh sách người dùng đang xem hoặc chỉnh sửa section này:
        public List<ActiveUserDto> Users
        {
            get;
            set;
        } = new();
    }
}
