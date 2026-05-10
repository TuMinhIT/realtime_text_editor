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
        //Xác định vị trí của section trong cây cấu trúc tài liệu, giúp xác định thứ tự hiển thị và quan hệ cha con giữa các section
        //public int StartIndex { get; set; }
        //public int EndIndex { get; set; }


        public Section? ParentSection { get; set; }
        public string Content { get; set; } = "";
        public ICollection<Section> Children { get; set; } = new List<Section>();
        public int Version { get; set; } = 0;
        public long Timestamp { get; set; } = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        public ICollection<SectionPermission> Assignments { get; set; } = new List<SectionPermission>();
    }
}