namespace text_editor_server.Entities
{
    /// <summary>
    /// Represents an operational transformation change for collaborative editing
    /// </summary>
    public class OperationalChange
    {
        public Guid Id { get; set; }
        public Guid SectionId { get; set; }
        public Guid UserId { get; set; }

        // Operation type: insert, delete, replace
        public string OperationType { get; set; } // "insert", "delete", "replace"

        // Text content
        public string Text { get; set; }

        // Position and length for the operation
        public int Position { get; set; }
        public int Length { get; set; }

        // Version tracking for OT conflict resolution
        public int VersionBefore { get; set; }
        public int VersionAfter { get; set; }

        // Timestamps
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public long Timestamp { get; set; } = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

        // Navigation properties
        public Section Section { get; set; }
        public User User { get; set; }
    }
}
