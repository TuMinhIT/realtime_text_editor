using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

using text_editor_server.Realtime.Constants;
using text_editor_server.Realtime.DTOs;
using text_editor_server.Realtime.Interfaces;

using ConnectionInfo =
    text_editor_server.Realtime.Models.ConnectionInfo;

namespace text_editor_server.Realtime.Hubs
{
    [Authorize]
    public class CollaborationHub : Hub
    {
        private readonly
            IRealtimeStateManager
                _stateManager;

        private readonly
            IPresenceService
                _presenceService;


        public CollaborationHub(
            IRealtimeStateManager stateManager,
            IPresenceService presenceService)
        {
            _stateManager =
                stateManager;

            _presenceService =
                presenceService;
        }

        // 
        // CONNECT
        public override async Task
            OnConnectedAsync()
        {
            Console.WriteLine("-----");
    
            Console.WriteLine(
                "SIGNALR CONNECTED");

            Console.WriteLine(
                $"ConnectionId: {Context.ConnectionId}");
            
  
            foreach (var claim
                in Context.User!.Claims)
            {
                Console.WriteLine(
                    $"{claim.Type}: {claim.Value}");
            }

            var userId =
                Guid.Parse(
                    Context.User!
                        .FindFirst(
                            ClaimTypes.NameIdentifier)!
                        .Value);

            var username =
                Context.User!
                    .FindFirst("fullName")?
                    .Value
                ?? "Unknown";

            var connection =
                new ConnectionInfo
                {
                    ConnectionId =
                        Context.ConnectionId,

                    UserId =
                        userId,

                    FullName =
                        username,

                    ConnectedAt =
                        DateTime.UtcNow,

                    LastActivityAt =
                        DateTime.UtcNow
                };

            _stateManager
                .AddConnection(
                    connection);

            Console.WriteLine(
                $"USER CONNECTED: {username}");

            Console.WriteLine(
                $"USER ID: {userId}");

            Console.WriteLine("");

            await base
                .OnConnectedAsync();
        }


        // DISCONNECT
        public override async Task
            OnDisconnectedAsync(
                Exception? exception)
        {

            Console.WriteLine(
                "SIGNALR DISCONNECTED");

            Console.WriteLine(
                $"ConnectionId: {Context.ConnectionId}");

            var connection =
                _stateManager
                    .GetConnection(
                        Context.ConnectionId);

            if (connection != null)
            {
                Console.WriteLine(
                    $"USER: {connection.FullName}");

                Console.WriteLine(
                    $"CURRENT SECTION: {connection.CurrentSectionId}");
            }

            if (connection?
                .CurrentSectionId
                    != null)
            {
                var sectionId =
                    connection
                        .CurrentSectionId
                        .Value;

                await Groups
                    .RemoveFromGroupAsync(
                        Context.ConnectionId,
                        RealtimeGroups
                            .Section(sectionId));

                Console.WriteLine(
                    $"REMOVED FROM GROUP: {sectionId}");

                var presence =
                    await _presenceService
                        .LeaveCurrentSectionAsync(
                            Context.ConnectionId);

                await Clients
                    .Group(
                        RealtimeGroups
                            .Section(sectionId))
                    .SendAsync(
                        RealtimeEvents
                            .SectionPresenceUpdated,
                        presence);

                Console.WriteLine(
                    "PRESENCE UPDATED");

                var lockState =
                    await _presenceService
                        .GetSectionLockAsync(
                            sectionId);

                await Clients
                    .Group(
                        RealtimeGroups
                            .Section(sectionId))
                    .SendAsync(
                        RealtimeEvents
                            .SectionLockUpdated,
                        lockState);

                Console.WriteLine(
                    "LOCK UPDATED");
            }

            _stateManager
                .RemoveConnection(
                    Context.ConnectionId);

            Console.WriteLine(
                "CONNECTION REMOVED");

            Console.WriteLine(
                "===================================");


            await base
                .OnDisconnectedAsync(
                    exception);
        }


        // JOIN SECTION


        public async Task
            JoinSection(
                JoinSectionRequest request)
        {
     
            Console.WriteLine(
                "=========== JOIN SECTION ===========");

            Console.WriteLine(
                $"ConnectionId: {Context.ConnectionId}");

            Console.WriteLine(
                $"SectionId: {request.SectionId}");

            var connection =
                _stateManager
                    .GetConnection(
                        Context.ConnectionId);

            if (connection == null)
            {
                Console.WriteLine(
                    "CONNECTION NOT FOUND");

                return;
            }

            Console.WriteLine(
                $"USER: {connection.FullName}");


            //Checkout section  - tránh user nằm nhiều section cùng lúc
            if (connection
                .CurrentSectionId
                    != null)
            {
                Console.WriteLine(
                    $"LEAVING OLD SECTION: {connection.CurrentSectionId}");

                await LeaveCurrentSection();
            }

            connection.CurrentSectionId =
                request.SectionId;

            Console.WriteLine(
                "CURRENT SECTION UPDATED");

            await Groups
                .AddToGroupAsync(
                    Context.ConnectionId,
                    RealtimeGroups
                        .Section(
                            request.SectionId));

            Console.WriteLine(
                $"ADDED TO GROUP: {request.SectionId}");

            var presence =
                await _presenceService
                    .JoinSectionAsync(
                        Context.ConnectionId,
                        request.SectionId);

            Console.WriteLine(
                "PRESENCE JOINED");

            await Clients
                .Group(
                    RealtimeGroups
                        .Section(
                            request.SectionId))
                .SendAsync(
                    RealtimeEvents
                        .SectionPresenceUpdated,
                    presence);

            Console.WriteLine(
                "PRESENCE EVENT SENT");

            var lockState =
                await _presenceService
                    .GetSectionLockAsync(
                        request.SectionId);

            await Clients
                .Caller
                .SendAsync(
                    RealtimeEvents
                        .SectionLockUpdated,
                    lockState);

            Console.WriteLine(
                "LOCK EVENT SENT");

            Console.WriteLine(
                "===================================");

            Console.WriteLine("");
        }


        // LEAVE SECTION


        public async Task
            LeaveCurrentSection()
        {
            Console.WriteLine("");
            Console.WriteLine(
                "=========== LEAVE SECTION ===========");

            var connection =
                _stateManager
                    .GetConnection(
                        Context.ConnectionId);

            if (connection?
                .CurrentSectionId
                    == null)
            {
                Console.WriteLine(
                    "NO CURRENT SECTION");

                return;
            }

            var sectionId =
                connection
                    .CurrentSectionId
                    .Value;

            Console.WriteLine(
                $"LEAVING SECTION: {sectionId}");

            await Groups
                .RemoveFromGroupAsync(
                    Context.ConnectionId,
                    RealtimeGroups
                        .Section(
                            sectionId));

            Console.WriteLine(
                "REMOVED FROM GROUP");

            var presence =
                await _presenceService
                    .LeaveCurrentSectionAsync(
                        Context.ConnectionId);

            connection.CurrentSectionId =
                null;

            Console.WriteLine(
                "CURRENT SECTION CLEARED");

            await Clients
                .Group(
                    RealtimeGroups
                        .Section(
                            sectionId))
                .SendAsync(
                    RealtimeEvents
                        .SectionPresenceUpdated,
                    presence);

            Console.WriteLine(
                "PRESENCE EVENT SENT");

            var lockState =
                await _presenceService
                    .GetSectionLockAsync(
                        sectionId);

            await Clients
                .Group(
                    RealtimeGroups
                        .Section(
                            sectionId))
                .SendAsync(
                    RealtimeEvents
                        .SectionLockUpdated,
                    lockState);

            Console.WriteLine(
                "LOCK EVENT SENT");

            Console.WriteLine(
                "===================================");

            Console.WriteLine("");
        }


        // REQUEST LOCK


        public async Task
            RequestEditSession(
                Guid sectionId)
        {
            Console.WriteLine("");
            Console.WriteLine(
                "=========== REQUEST LOCK ===========");

            Console.WriteLine(
                $"ConnectionId: {Context.ConnectionId}");

            Console.WriteLine(
                $"SectionId: {sectionId}");

            var success =
                await _presenceService
                    .RequestEditSessionAsync(
                        Context.ConnectionId,
                        sectionId);

            Console.WriteLine(
                $"LOCK SUCCESS: {success}");

            var lockState =
                await _presenceService
                    .GetSectionLockAsync(
                        sectionId);

            await Clients
                .Group(
                    RealtimeGroups
                        .Section(
                            sectionId))
                .SendAsync(
                    RealtimeEvents
                        .SectionLockUpdated,
                    lockState);

            Console.WriteLine(
                "LOCK EVENT SENT");

            if (success)
            {
                var presence =
                    await _presenceService
                        .JoinSectionAsync(
                            Context.ConnectionId,
                            sectionId);

                await Clients
                    .Group(
                        RealtimeGroups
                            .Section(
                                sectionId))
                    .SendAsync(
                        RealtimeEvents
                            .SectionPresenceUpdated,
                        presence);

                Console.WriteLine(
                    "PRESENCE EVENT SENT");
            }

            Console.WriteLine(
                "===================================");

            Console.WriteLine("");
        }


        // RELEASE LOCK


        public async Task
            ReleaseEditSession(
                Guid sectionId)
        {
            Console.WriteLine("");
            Console.WriteLine(
                "=========== RELEASE LOCK ===========");

            Console.WriteLine(
                $"ConnectionId: {Context.ConnectionId}");

            Console.WriteLine(
                $"SectionId: {sectionId}");

            await _presenceService
                .ReleaseEditSessionAsync(
                    Context.ConnectionId,
                    sectionId);

            Console.WriteLine(
                "LOCK RELEASED");

            var lockState =
                await _presenceService
                    .GetSectionLockAsync(
                        sectionId);

            await Clients
                .Group(
                    RealtimeGroups
                        .Section(
                            sectionId))
                .SendAsync(
                    RealtimeEvents
                        .SectionLockUpdated,
                    lockState);

            Console.WriteLine(
                "LOCK EVENT SENT");

            Console.WriteLine(
                "===================================");

            Console.WriteLine("");
        }

        //Cursor position:
        // CURSOR POSITION

        public async Task
            UpdateCursor(
                Guid sectionId,
                CursorDto cursor)
        {
            var connection =
                _stateManager
                    .GetConnection(
                        Context.ConnectionId);

            if (connection == null)
            {
                return;
            }

            // chỉ gửi cho user khác
            await Clients
                .OthersInGroup(
                    RealtimeGroups
                        .Section(sectionId))
                .SendAsync(
                    RealtimeEvents
                        .CursorUpdated,
                    new
                    {
                        sectionId,

                        userId =
                            connection.UserId,

                        username =
                            connection.FullName,

                        x = cursor.X,
                        y = cursor.Y
                    });
        }

        // CONTENT UPDATE   
        public async Task
     NotifySectionUpdated(
         Guid sectionId)
        {
            var connection =
                _stateManager
                    .GetConnection(
                        Context.ConnectionId);

            if (connection == null)
            {
                return;
            }

            // validate current section
            if (connection
                    .CurrentSectionId
                != sectionId)
            {
                return;
            }

            await Clients
                .OthersInGroup(
                    RealtimeGroups
                        .Section(
                            sectionId))
                .SendAsync(
                    RealtimeEvents
                        .SectionContentUpdated,
                    new
                    {
                        sectionId,

                        updatedByUserId =
                            connection.UserId,

                        updatedByUsername =
                            connection.FullName,

                        updatedAt =
                            DateTime.UtcNow
                    });
        }
    }
}