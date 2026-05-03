using System;

namespace text_editor_server.Entities
{
    public class SectionSnapshot
    {
        public Guid Id { get; set; }
        public Guid SectionId { get; set; }
        public Guid UserId { get; set; }
        public int Version { get; set; } = 0; // For Operational Transformation 
        public string JsonContent { get; set; } = string.Empty; // JSON
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
