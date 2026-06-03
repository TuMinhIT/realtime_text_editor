using text_editor_server.Realtime.Interfaces;
using text_editor_server.Realtime.Models;
using System.Collections.Concurrent;

namespace text_editor_server.Realtime.Managers
{
    public class RealtimeStateManager : IRealtimeStateManager
    {

        private readonly ConcurrentDictionary<
            string,
            Models.ConnectionInfo> _connections
                = new();

        private readonly ConcurrentDictionary<
            Guid,
            Models.SectionLock> _sectionLocks
                = new();


        // Triển khai các phương thức của IRealtimeStateManager để quản lý trạng thái realtime, bao gồm kết nối, section locks, và thông tin user online.
        public void AddConnection(Models.ConnectionInfo connection)
        {
            _connections[
                connection.ConnectionId]
                    = connection;
        }
        // Xóa connectionId khỏi _connections, dùng khi user ngắt kết nối hoặc timeout. Giúp giải phóng tài nguyên và cập nhật trạng thái online chính xác.
        public void RemoveConnection(string connectionId)
        {
            _connections.TryRemove(connectionId, out _);

        }

        // Lấy connectionId, trả về ConnectionInfo nếu tồn tại, hoặc null nếu không tìm thấy. Dùng để xác định thông tin user và section đang xem.
        public Models.ConnectionInfo? GetConnection(string connectionId)
        {
            _connections.TryGetValue(connectionId, out var connection);
            return connection;
        }

        // Lấy connectionId, sectionId. Cập nhật sectionId vào connection, và cập nhật LastActivityAt để theo dõi hoạt động của user.
        public void SetCurrentSection(string connectionId, Guid? sectionId)
        {
            if(_connections.TryGetValue(connectionId,
                out var connection))
            {
                connection.CurrentSectionId = sectionId;
                connection.LastActivityAt = DateTime.UtcNow;
            }
        }

        //Lấy sectionId, trả về danh sách ConnectionInfo của những user đang xem hoặc chỉnh sửa section đó. Dùng để hiển thị thông tin user online theo section.
        public List<Models.ConnectionInfo> GetSectionConnections(Guid sectionId)
        {
            return _connections.Values
                .Where(c => c.CurrentSectionId == sectionId)
                .ToList();  
        }

        // Trả về danh sách ConnectionInfo của tất cả user đang online, bất kể section nào. Dùng để hiển thị tổng quan trạng thái online của hệ thống.
        public List<Models.ConnectionInfo> GetOnlineUsers()
        {
            return _connections.Values
                .ToList();
        }


        // Lấy sectionId, trả về SectionLock nếu section đang bị khóa, hoặc null nếu không có lock nào. Dùng để kiểm tra trạng thái lock của section trước khi cho phép user chỉnh sửa.
        public SectionLock? GetSectionLock(Guid sectionId)
        {
            _sectionLocks.TryGetValue(
                sectionId,
                out var sectionLock);

            return sectionLock;
        }

        // Lấy sectionId, userId. Kiểm tra nếu section đang bị khóa bởi userId đó, trả về true, ngược lại trả về false. Dùng để xác định quyền chỉnh sửa của user trên section.
        public bool HasLock(Guid sectionId, Guid userId)
        {
             return _sectionLocks.TryGetValue(sectionId, out var sectionLock) &&
                   sectionLock.UserId == userId;
        }

        public void ReleaseLock(Guid sectionId, Guid userId)
        {
            if (!_sectionLocks.TryGetValue(sectionId, out var sectionLock))
            {
                return;
            }

            if (sectionLock.UserId != userId)
            {
                return;
            }

            _sectionLocks.TryRemove(sectionId, out _);
        }




        // Lấy sectionId, userId, username.
        // Nếu section chưa có lock nào, tạo một SectionLock mới với thông tin user và thêm vào _sectionLocks, trả về true.
        // Nếu section đã có lock, trả về false. Dùng để kiểm soát quyền chỉnh sửa của user trên từng section.
        public bool TryAcquireLock(Guid sectionId, Guid userId, string username)
        {
            var sectionLock = new SectionLock
            {
                SectionId = sectionId,
                UserId = userId,
                Username = username,
                LockedAt = DateTime.UtcNow,
                LastHeartbeatAt = DateTime.UtcNow
            };
            // Sử dụng TryAdd để đảm bảo tính nguyên tử khi thêm lock mới. Nếu đã có lock tồn tại, TryAdd sẽ trả về false.
            var acquired = _sectionLocks.TryAdd(sectionId, sectionLock);
            return acquired;
        }
    }
}
