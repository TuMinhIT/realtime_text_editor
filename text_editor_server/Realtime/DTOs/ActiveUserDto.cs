namespace text_editor_server.Realtime.DTOs
{
    public class ActiveUserDto
    {
        public Guid UserId { get; set; }
        public string Username { get; set; } = default!;
        public bool IsEditing { get; set; }
    }
}
