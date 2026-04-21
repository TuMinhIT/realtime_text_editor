using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using text_editor_server.Data;
using text_editor_server.Entities;
using text_editor_server.Services;

namespace text_editor_server.Hubs
{
    public class DocumentHub : Hub
    {
        private readonly AppDbContext _context;
        private readonly IOperationalTransformService _otService;
        private readonly ILogger<DocumentHub> _logger;

        public DocumentHub(AppDbContext context, IOperationalTransformService otService, ILogger<DocumentHub> logger)
        {
            _context = context;
            _otService = otService;
            _logger = logger;
        }

        /// <summary>
        /// User joins a section for real-time editing
        /// </summary>
        public async Task JoinSection(string sectionId, string userId)
        {
            try
            {
                if (!Guid.TryParse(sectionId, out var sectionGuid) || !Guid.TryParse(userId, out var userGuid))
                {
                    await Clients.Caller.SendAsync("Error", "Invalid section or user ID");
                    return;
                }

                // Verify user has permission to access this section
                var hasPermission = await _context.SectionUsers
                    .AnyAsync(su => su.SectionId == sectionGuid && su.UserId == userGuid);

                if (!hasPermission)
                {
                    await Clients.Caller.SendAsync("Error", "You don't have permission to access this section");
                    return;
                }

                await Groups.AddToGroupAsync(Context.ConnectionId, sectionId);
                
                // Get current section content
                var section = await _context.Sections.FindAsync(sectionGuid);
                if (section != null)
                {
                    await Clients.Caller.SendAsync("LoadSection", new
                    {
                        sectionId = section.Id,
                        content = section.Content,
                        version = section.Version
                    });
                }

                // Notify others that user joined
                await Clients.OthersInGroup(sectionId).SendAsync("UserJoined", new
                {
                    userId,
                    sectionId
                });

                _logger.LogInformation($"User {userId} joined section {sectionId}");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error joining section: {ex.Message}");
                await Clients.Caller.SendAsync("Error", "Failed to join section");
            }
        }

        /// <summary>
        /// User leaves a section
        /// </summary>
        public async Task LeaveSection(string sectionId, string userId)
        {
            try
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, sectionId);
                await Clients.OthersInGroup(sectionId).SendAsync("UserLeft", new { userId, sectionId });
                
                _logger.LogInformation($"User {userId} left section {sectionId}");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error leaving section: {ex.Message}");
            }
        }

        /// <summary>
        /// Handle incoming operational changes with OT transformation
        /// </summary>
        public async Task SendChange(string sectionId, string userId, string operationType, 
            string text, int position, int length, int versionBefore)
        {
            try
            {
                if (!Guid.TryParse(sectionId, out var sectionGuid) || !Guid.TryParse(userId, out var userGuid))
                {
                    await Clients.Caller.SendAsync("Error", "Invalid IDs");
                    return;
                }

                var section = await _context.Sections
                    .Include(s => s.ChangeLog)
                    .FirstOrDefaultAsync(s => s.Id == sectionGuid);

                if (section == null)
                {
                    await Clients.Caller.SendAsync("Error", "Section not found");
                    return;
                }

                // Verify user permission
                var hasEditPermission = await _context.SectionUsers
                    .AnyAsync(su => su.SectionId == sectionGuid && su.UserId == userGuid 
                        && su.Permission >= PermissionLevel.Edit);

                if (!hasEditPermission)
                {
                    await Clients.Caller.SendAsync("Error", "You don't have edit permission");
                    return;
                }

                // Create operational change
                var change = new OperationalChange
                {
                    Id = Guid.NewGuid(),
                    SectionId = sectionGuid,
                    UserId = userGuid,
                    OperationType = operationType,
                    Text = text,
                    Position = position,
                    Length = length,
                    VersionBefore = versionBefore,
                    VersionAfter = versionBefore + 1,
                    Timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
                };

                // Get changes from other users that haven't been acknowledged yet
                var pendingChanges = section.ChangeLog
                    .Where(c => c.VersionAfter > versionBefore)
                    .ToList();

                // Apply OT transformation
                var transformedChange = _otService.TransformOperation(change, pendingChanges);

                // Apply operation to content
                if (_otService.IsOperationValid(section.Content, transformedChange))
                {
                    section.Content = _otService.ApplyOperation(section.Content, transformedChange);
                    section.Version++;
                    transformedChange.VersionAfter = section.Version;

                    // Save changes
                    _context.OperationalChanges.Add(transformedChange);
                    await _context.SaveChangesAsync();

                    // Broadcast to other users in the section
                    await Clients.OthersInGroup(sectionId).SendAsync("ReceiveChange", new
                    {
                        changeId = transformedChange.Id,
                        operationType = transformedChange.OperationType,
                        text = transformedChange.Text,
                        position = transformedChange.Position,
                        length = transformedChange.Length,
                        version = transformedChange.VersionAfter,
                        userId
                    });
                }
                else
                {
                    _logger.LogWarning($"Invalid operation on section {sectionId}");
                    await Clients.Caller.SendAsync("Error", "Operation could not be applied");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error sending change: {ex.Message}");
                await Clients.Caller.SendAsync("Error", "Failed to send change");
            }
        }

        /// <summary>
        /// Get change history for a section
        /// </summary>
        public async Task GetChangeHistory(string sectionId, int fromVersion)
        {
            try
            {
                if (!Guid.TryParse(sectionId, out var sectionGuid))
                {
                    await Clients.Caller.SendAsync("Error", "Invalid section ID");
                    return;
                }

                var changes = await _context.OperationalChanges
                    .Where(c => c.SectionId == sectionGuid && c.VersionAfter > fromVersion)
                    .OrderBy(c => c.VersionAfter)
                    .Select(c => new
                    {
                        c.Id,
                        c.OperationType,
                        c.Text,
                        c.Position,
                        c.Length,
                        c.VersionBefore,
                        c.VersionAfter,
                        UserId = c.UserId
                    })
                    .ToListAsync();

                await Clients.Caller.SendAsync("ChangeHistory", changes);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting change history: {ex.Message}");
                await Clients.Caller.SendAsync("Error", "Failed to get change history");
            }
        }
    }
}
