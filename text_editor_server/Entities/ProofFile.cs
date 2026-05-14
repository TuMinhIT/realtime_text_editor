namespace text_editor_server.Entities
{
    public class ProofFile
    {
        public Guid Id { get; set; }

        public string FileName { get; set; } = null!;

        public string StoredFileName { get; set; } = null!;

        public string FileUrl { get; set; } = null!;

        public byte[] Data { get; set; } = null!;

 
        public long FileSize { get; set; }

        public string ContentType { get; set; } = null!;

        public bool IsGlobal { get; set; }

        public DateTime CreatedAt { get; set; }
    }

   
}
