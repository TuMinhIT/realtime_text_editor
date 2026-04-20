namespace text_editor_server.DTOs.req
{
    public class RegisterReq
    {
        public string Email { get; set; }
        public string Password { get; set; }
        public string? FullName { get; set; }
        
    }
}
