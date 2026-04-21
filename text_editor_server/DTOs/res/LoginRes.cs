namespace text_editor_server.DTOs.res
{
    namespace text_editor_server.DTOs.res
    {
        public class LoginRes
        {
            public UserRes User { get; set; } = default!;
            public string AccessToken { get; set; } = default!;
            public string RefreshToken { get; set; } = default!;
        }
    }
}


