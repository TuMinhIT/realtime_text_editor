using System;

namespace text_editor_server.Entities
{
    public class RefreshToken
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string TokenHash { get; set; }
        public DateTime ExpiryTime { get; set; }
        public bool IsUsed { get; set; } = false;
        public bool IsRevoked { get; set; } = false;
        public string? CreatedByIp { get; set; }
        public string? UserAgent { get; set; }
        public Guid UserId { get; set; }
        public User User { get; set; }
    }
}