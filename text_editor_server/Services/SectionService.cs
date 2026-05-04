using Microsoft.EntityFrameworkCore;
using text_editor_server.Data;
using text_editor_server.DTOs.res;
using text_editor_server.Entities;

namespace text_editor_server.Services
{       
    public class SectionService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<SectionService> _logger;

        public SectionService(AppDbContext context, ILogger<SectionService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<ServiceResult<List<BlockPermissionRes>>> GetBlockUsersAsync(Guid sectionId)
        {
            var sectionExists = await _context.Sections.AnyAsync(s => s.Id == sectionId);
            if (!sectionExists)
            {
                return ServiceResult<List<BlockPermissionRes>>.Fail("Section not found");
            }

            var users = await _context.SectionPermissions
                .Where(sp => sp.SectionId == sectionId)
                .Join(
                    _context.Users,
                    sp => sp.UserId,
                    u => u.Id,
                    (sp, u) => new BlockPermissionRes
                    {
                        SectionId = sp.SectionId,
                        UserId = sp.UserId,
                        UserEmail = u.Email,
                        Permission = sp.Permission.ToString(),
                        AssignedAt = sp.AssignedAt
                    })
                .ToListAsync();

            return ServiceResult<List<BlockPermissionRes>>.Ok(users);
        }

        public async Task<ServiceResult<BlockPermissionRes>> AssignUserToSectionAsync(Guid sectionId, Guid userId, PermissionLevel permission)
        {
            var sectionExists = await _context.Sections.AnyAsync(s => s.Id == sectionId);
            if (!sectionExists)
            {
                return ServiceResult<BlockPermissionRes>.Fail("Section not found");
            }

            var user = await _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
            {
                return ServiceResult<BlockPermissionRes>.Fail("User not found");
            }

            var assignment = await _context.SectionPermissions
                .FirstOrDefaultAsync(sp => sp.SectionId == sectionId && sp.UserId == userId);

            if (assignment == null)
            {
                assignment = new SectionPermission
                {
                    Id = Guid.NewGuid(),
                    SectionId = sectionId,
                    UserId = userId,
                    Permission = permission,
                    AssignedAt = DateTime.UtcNow
                };
                _context.SectionPermissions.Add(assignment);
            }
            else
            {
                assignment.Permission = permission;
                assignment.AssignedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            return ServiceResult<BlockPermissionRes>.Ok(new BlockPermissionRes
            {
                SectionId = sectionId,
                UserId = userId,
                UserEmail = user.Email,
                Permission = permission.ToString(),
                AssignedAt = assignment.AssignedAt
            });
        }

        public async Task<ServiceResult<bool>> RemoveUserFromSectionAsync(Guid sectionId, Guid userId)
        {
            var assignment = await _context.SectionPermissions
                .FirstOrDefaultAsync(sp => sp.SectionId == sectionId && sp.UserId == userId);

            if (assignment == null)
            {
                return ServiceResult<bool>.Fail("Permission assignment not found for this user");
            }

            _context.SectionPermissions.Remove(assignment);
            await _context.SaveChangesAsync();

            return ServiceResult<bool>.Ok(true);
        }

        public async Task<ServiceResult<List<Section>>> GetAllSectionsForAdminAsync()
        {
            // Trong thực tế, bạn có thể map sang một DTO khác nếu không muốn trả thẳng Entity ra view
            var sections = await _context.Sections
                .AsNoTracking()
                .ToListAsync();

            return ServiceResult<List<Section>>.Ok(sections);
        }
    }
}
