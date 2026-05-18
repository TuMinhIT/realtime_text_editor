namespace text_editor_server.DTOs.res
{
    public class ProofFileDownloadRes
    {
        public string FileName { get; set; } = null!;

        public string ContentType { get; set; } = null!;

        public byte[] Data { get; set; } = null!;
    }
}