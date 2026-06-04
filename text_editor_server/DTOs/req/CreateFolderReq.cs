namespace text_editor_server.DTOs.req
{
    public class CreateFolderReq
    {
        public string Name { get; set; } = null!;

        public bool IsGlobal { get; set; }

        public Guid? DocumentId { get; set; }
    }
}