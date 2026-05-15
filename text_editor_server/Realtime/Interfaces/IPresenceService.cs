using text_editor_server.Realtime.DTOs;

namespace text_editor_server.Realtime.Interfaces
{
    public interface IPresenceService
    {
        
        Task<SectionPresenceDto>
        JoinSectionAsync(
            string connectionId,
            Guid sectionId);

        Task<SectionPresenceDto>
            LeaveCurrentSectionAsync(
                string connectionId);

        Task<SectionLockDto>
            GetSectionLockAsync(
                Guid sectionId);

        Task<bool>
            RequestEditSessionAsync(
                string connectionId,
                Guid sectionId);

        Task ReleaseEditSessionAsync(
            string connectionId,
            Guid sectionId);
    }
}
