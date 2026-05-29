using DocumentFormat.OpenXml.Drawing.Wordprocessing;

namespace text_editor_server.Entities
{
    public class Section
    {
        public Guid Id { get; set; }
        public Guid DocumentId { get; set; }
        public string Title { get; set; }
        public int Level { get; set; }
        public int OrderIndex { get; set; }
        public Guid? ParentSectionId { get; set; }

        public Section? ParentSection { get; set; }
        public string Content { get; set; } = "";
        public ICollection<Section> Children { get; set; } = new List<Section>();

        //Optimistic concurrency control: mỗi khi section được cập nhật, version sẽ tăng lên. Khi client gửi yêu cầu cập nhật, nó phải kèm theo version hiện tại của section. Server sẽ so sánh version này với version trong database. Nếu chúng không khớp, có nghĩa là section đã bị thay đổi bởi một client khác, server sẽ trả về lỗi để client có thể xử lý (ví dụ: tải lại section mới nhất trước khi thử lại).
        public int Version { get; set; } = 0;
        public long Timestamp { get; set; } = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        public ICollection<SectionPermission> Assignments { get; set; } = new List<SectionPermission>();
    }
}