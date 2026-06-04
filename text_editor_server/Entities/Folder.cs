namespace text_editor_server.Entities
{
    public class Folder
    {
        public Guid Id { get; set; }

        public string Name { get; set; } = null!;

        public ICollection<ProofFile> Files { get; set; }
            = new List<ProofFile>();

        public DateTime CreatedAt { get; set; }
    }
}


