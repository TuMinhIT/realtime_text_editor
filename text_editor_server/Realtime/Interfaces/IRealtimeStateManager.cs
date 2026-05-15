using text_editor_server.Realtime.Models;
using ConnectionInfo = text_editor_server.Realtime.Models.ConnectionInfo;

namespace text_editor_server.Realtime.Interfaces;

public interface IRealtimeStateManager
{
    void AddConnection(
        ConnectionInfo connection);

    void RemoveConnection(
        string connectionId);

    ConnectionInfo?
        GetConnection(
            string connectionId);

    void SetCurrentSection(
        string connectionId,
        Guid? sectionId);

    List<ConnectionInfo>
        GetSectionConnections(
            Guid sectionId);

    List<ConnectionInfo>
        GetOnlineUsers();

    bool TryAcquireLock(
        Guid sectionId,
        Guid userId,
        string username);

    void ReleaseLock(
        Guid sectionId,
        Guid userId);

    SectionLock?
        GetSectionLock(
            Guid sectionId);

    bool HasLock(
        Guid sectionId,
        Guid userId);
}