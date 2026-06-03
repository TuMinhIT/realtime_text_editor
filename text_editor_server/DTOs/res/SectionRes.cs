using text_editor_server.Entities;

namespace text_editor_server.DTOs.res
{
    public class SectionRes
    {
        public Guid Id { get; set; }
        public Guid DocumentId { get; set; }
        public string Title { get; set; }
        public int Level { get; set; }
        public int OrderIndex { get; set; }
        public Guid? ParentSectionId { get; set; }
        public Section? ParentSection { get; set; }
        public string Content { get; set; } = "";
    
        public Guid UserId { get; set; }
        public PermissionLevel Permission { get; set; } = PermissionLevel.Edit;
        public DateTime AssignedAt { get; set; } = DateTime.UtcNow;


    }
 }
