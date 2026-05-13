
namespace text_editor_server.Entities
{
    public class Document
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? SourceFilePath { get; set; }
        public Guid CreatedBy { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public User? Creator { get; set; }
        public ICollection<Section> Sections { get; set; } = new List<Section>();

        // admin khóa mở full document, user không thể chỉnh sửa gì cả, chỉ có thể xem
        public bool isActive { get; set; } = false;
        //check xem document có thay đổi gì không, nếu có thì mới tạo snapshot, nếu không thì thôi
        public bool hasChanges { get; set; } = false;
    }
}
