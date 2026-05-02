namespace text_editor_server.Entities
{
    public enum PermissionLevel
    {
        ViewOnly = 0,
        Edit = 1,
        Admin = 2
    }

    public class SectionPermission
    {
        public Guid Id { get; set; }
        public Guid SectionId { get; set; }
        public Guid UserId { get; set; }
        public PermissionLevel Permission { get; set; } = PermissionLevel.Edit;
        public DateTime AssignedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public Section Section { get; set; }
    }
}
