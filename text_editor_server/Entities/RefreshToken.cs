
namespace text_editor_server.Entities
{
    public class RefreshToken
    {
        public string TokenId { get; set; } = default!;
        public Guid Id { get; set; }
        public string TokenHash { get; set; } = default!;
        public DateTime ExpiresAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public bool IsRevoked { get; set; } = false;
        public string? ReplacedByToken { get; set; }
        public DateTime? RevokedAt { get; set; }
        // tracking
        public string? CreatedByIp { get; set; }
        public string? Device { get; set; }

        // FK
        public Guid UserId { get; set; }
        public User User { get; set; } = default!;
    }
}