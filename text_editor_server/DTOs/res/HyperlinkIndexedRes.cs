namespace text_editor_server.DTOs.res
{
    public class HyperlinkIndexedRes
    {
        public Guid? ProofFileId { get; set; }

        public string Url { get; set; }
            = string.Empty;

        public int Position { get; set; }
    }
}