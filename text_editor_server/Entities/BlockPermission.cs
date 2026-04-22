namespace text_editor_server.Entities
{
    public class BlockPermission
    {
        public Guid Id { get; set; }

        public Guid BlockId { get; set; }
        public Guid UserId { get; set; }

        public string Role { get; set; } = "Editor";
        // Viewer | Editor | Owner
    }
}
