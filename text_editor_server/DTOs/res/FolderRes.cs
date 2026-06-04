namespace text_editor_server.DTOs.res
{
    public class FolderRes
    {
        public Guid Id { get; set; }

        public string Name { get; set; } = null!;

        public DateTime CreatedAt { get; set; }
    }
}