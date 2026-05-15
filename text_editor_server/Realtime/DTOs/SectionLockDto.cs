namespace text_editor_server.Realtime.DTOs
{
    public class SectionLockDto
    {
        public Guid SectionId { get; set; }

        public bool IsLocked { get; set; }

        //Người đang giữ lock của section này:
        public Guid? LockedByUserId { get; set; }

        public string? LockedByUsername { get; set; }
    }
}
