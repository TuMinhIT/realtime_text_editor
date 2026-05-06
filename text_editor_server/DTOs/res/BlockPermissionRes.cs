namespace text_editor_server.DTOs.res
{
    public class BlockPermissionRes
    {
        public Guid SectionId { get; set; }
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string fullName{ get; set; } = string.Empty;
        public string UserEmail { get; set; } = string.Empty;
        public string Permission { get; set; } = string.Empty;
        public DateTime AssignedAt { get; set; }
    }
}
