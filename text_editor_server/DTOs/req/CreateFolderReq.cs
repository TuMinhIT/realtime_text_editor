namespace text_editor_server.DTOs.req
{
    public class UploadFolderRequest
    {
        public string FolderName { get; set; } = null!;
        public List<IFormFile> Files { get; set; } = new();
    }
}
