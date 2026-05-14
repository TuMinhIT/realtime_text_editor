namespace text_editor_server.DTOs.res
{
    public class DocumentRes
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string JsonContent { get; set; } = string.Empty;
        public string? SourceFilePath { get; set; }
        public Guid CreatedBy { get; set; }
        public DateTime CreatedAt { get; set; }
        public UserRes? Creator { get; set; }
        // admin khóa mở full document, user không thể chỉnh sửa gì cả, chỉ có thể xem
        public bool isActive { get; set; }
        //check xem document có thay đổi gì không, nếu có thì mới tạo snapshot, nếu không thì thôi
        public bool hasChanges { get; set; }

        public int Version { get; set; }
    }
}
