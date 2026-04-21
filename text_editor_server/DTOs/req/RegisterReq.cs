namespace text_editor_server.DTOs.req
{
    public class RegisterReq
    {
        public string Email { get; set; } = null!;
        public string Password { get; set; } = null!;
        public string? FullName { get; set; }
        
    }
}
