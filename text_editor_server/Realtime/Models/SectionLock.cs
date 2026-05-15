namespace text_editor_server.Realtime.Models
{
    public class SectionLock
    {
        public Guid SectionId { get; set; }

        public Guid UserId { get; set; }

        public string Username { get; set; } = default!;

        public DateTime LockedAt { get; set; }

        public DateTime LastHeartbeatAt { get; set; }
    }
}

