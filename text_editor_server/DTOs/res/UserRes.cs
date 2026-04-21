namespace text_editor_server.DTOs.res
{
    public class UserRes
    {
        public Guid Id { get; set; }
        public string Email { get; set; } = null!;
        public string FullName { get; set; } = null!;
        public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;
        public bool? IsActive { get; set; } = true;
        public string? Role { get; set; }
    }
        
}
