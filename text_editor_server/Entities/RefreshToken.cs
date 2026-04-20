
namespace text_editor_server.Entities
{
    public class RefreshToken
    {
        public Guid Id { get; set; }
        public string Token { get; set; } = default!;
        public DateTime ExpiresAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public bool IsRevoked { get; set; } = false;

        // tracking
        public string? CreatedByIp { get; set; }
        public string? Device { get; set; }

        // FK
        public Guid UserId { get; set; }
        public User User { get; set; } = default!;
    }
}