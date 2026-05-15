using text_editor_server.Realtime.DTOs;
using text_editor_server.Realtime.Interfaces;

namespace text_editor_server.Realtime.Services
{
    public class PresenceService : IPresenceService
    {

        private readonly IRealtimeStateManager _stateManager;
        public PresenceService(IRealtimeStateManager stateManager)
        {
            _stateManager = stateManager;
        }

        // Lấy thông tin lock của section (Biết ai đang edit)
        public Task<SectionLockDto> GetSectionLockAsync(Guid sectionId)
        {
            var lockInfo =
                _stateManager
                    .GetSectionLock(
                        sectionId);

            if (lockInfo == null) //nếu ko có ai giữ lock section này thì trả về isLocked = false
            {
                return Task.FromResult(
                    new SectionLockDto
                    {
                        SectionId =
                            sectionId,

                        IsLocked =
                            false
                    });
            }

            return Task.FromResult(
                new SectionLockDto
                {
                    SectionId =
                        sectionId,

                    IsLocked =
                        true,

                    LockedByUserId =
                        lockInfo.UserId,

                    LockedByUsername =
                        lockInfo.Username
                });
        }

        public Task<SectionPresenceDto> JoinSectionAsync(string connectionId, Guid sectionId)
        {

            // Lấy connection hiện tại:
            _stateManager.SetCurrentSection(connectionId, sectionId);
            // Build lại active users:
            var presence = BuildSectionPresence(sectionId);

            // Trả về presence mới:
            return Task.FromResult(presence);


        }

        public Task<SectionPresenceDto> LeaveCurrentSectionAsync(string connectionId)
        {

            //Lấy connection hiện tại:
            var connection = _stateManager.GetConnection(connectionId);

            //check:có đang ở section nào không
            if (connection?.CurrentSectionId == null)
            {
                return Task.FromResult(new SectionPresenceDto());
            }

            //Nếu có, check xem có đang giữ lock section đó không, nếu có thì release lock
            var sectionId = connection.CurrentSectionId.Value;
            if (_stateManager.HasLock(
               sectionId,
               connection.UserId))
            {
                _stateManager.ReleaseLock(
                    sectionId,
                    connection.UserId);
            }
            // Set connection isEditing về false:
            connection.isEdit = false;
            // Set current section về null:
            _stateManager
                .SetCurrentSection(
                    connectionId,
                    null);

            var presence =
                BuildSectionPresence(
                    sectionId);

            return Task.FromResult(
                presence);


        }

        public Task ReleaseEditSessionAsync(string connectionId, Guid sectionId)
        {
            var connection =
             _stateManager
                 .GetConnection(
                     connectionId);

            if (connection == null)
            {
                return Task.CompletedTask;
            }

            _stateManager
                .ReleaseLock(
                    sectionId,
                    connection.UserId);

            connection.isEdit =
                false;

            return Task.CompletedTask;
        }

        public Task<bool> RequestEditSessionAsync(string connectionId, Guid sectionId)
        {
            var connection =
              _stateManager
                  .GetConnection(
                      connectionId);

            if (connection == null)
            {
                return Task.FromResult(
                    false);
            }

            var acquired =
                _stateManager
                    .TryAcquireLock(
                        sectionId,
                        connection.UserId,
                        connection.FullName)
                     ;

            if (acquired)
            {
                connection.isEdit =
                    true;
            }

            return Task.FromResult(
                acquired);

        }



        private SectionPresenceDto
     BuildSectionPresence(
         Guid sectionId)
        {
            var users =
                _stateManager
                    .GetSectionConnections(
                        sectionId)
                    .Select(x =>
                        new ActiveUserDto
                        {
                            UserId =
                                x.UserId,

                            Username =
                                x.FullName,

                            IsEditing =
                                x.isEdit
                        })
                    .DistinctBy(
                        x => x.UserId)
                    .ToList();

            return new
                SectionPresenceDto
            {
                SectionId =
                    sectionId,

                Users =
                    users
            };
        }
    }
}
