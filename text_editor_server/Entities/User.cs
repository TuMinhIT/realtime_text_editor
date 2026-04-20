namespace text_editor_server.Entities
{
    public class User
    {
        public Guid Id { get; set; }
        public string Email { get; set; }
        public string PasswordHash { get; set; }
        public string FullName { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public bool IsActive { get; set; } = true;
        public string Role { get; set; } = "User";


        // Navigation properties
        public ICollection<Document> OwnedDocuments { get; set; } = new List<Document>();
        public ICollection<SectionUser> SectionAssignments { get; set; } = new List<SectionUser>();
        public ICollection<OperationalChange> Changes { get; set; } = new List<OperationalChange>();
        public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    }
}
