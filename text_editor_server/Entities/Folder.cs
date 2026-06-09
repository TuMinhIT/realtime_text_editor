namespace text_editor_server.Entities
{
    public class Folder
    {
        public Guid Id { get; set; }

        public string Name { get; set; } = null!;

        public bool IsGlobal { get; set; }

        public ICollection<ProofFile> Files { get; set; }
            = new List<ProofFile>();

        public ICollection<DocumentFile> DocumentFiles { get; set; }
            = new List<DocumentFile>();

        public DateTime CreatedAt { get; set; }
    }
}


