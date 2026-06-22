using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Text.Json;
using System.Text.RegularExpressions;
using text_editor_server.Data;
using text_editor_server.DTOs.res;
using text_editor_server.Entities;
using text_editor_server.Services.Helper;

namespace text_editor_server.Services
{
    public class SectionService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<SectionService> _logger;
        private readonly HyperlinkEngine _hyperlinkEngine;
        private readonly UpdateSectionContentHelper _updateHelper;

        public SectionService(AppDbContext context,
            ILogger<SectionService> logger,
            HyperlinkEngine hyperlinkEngine,
            UpdateSectionContentHelper updateHelper)
        {
            _context = context;
            _logger = logger;
            _hyperlinkEngine = hyperlinkEngine;
            _updateHelper = updateHelper;
        }

        // Get user permissions on section:
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

        // Assign permission for user on section:
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

        // Delete permission of user on section:
        public async Task<ServiceResult<bool>> RemoveUserFromSectionAsync(Guid sectionPermissionId)
        {
            var assignment = await _context.SectionPermissions
                .FirstOrDefaultAsync(sp => sp.Id == sectionPermissionId);

            if (assignment == null)
            {
                return ServiceResult<bool>.Fail("Permission assignment not found for this user");
            }

            _context.SectionPermissions.Remove(assignment);
            await _context.SaveChangesAsync();

            return ServiceResult<bool>.Ok(true);
        }

        // Get all sections of a document:
        public async Task<ServiceResult<List<Section>>> GetAllSectionsByDocumentAsync(Guid documentId)
        {
            var sections = await _context.Sections
                .AsNoTracking()
                .Where(s => s.DocumentId == documentId)
                .OrderBy(s => s.OrderIndex)
                .ToListAsync();
            return ServiceResult<List<Section>>.Ok(sections);
        }

        // Get section by id:
        public async Task<ServiceResult<SectionRes>> GetSectionAndPermissionAsync(Guid userId, Guid sectionId)
        {
            var section = await _context.Sections.FirstOrDefaultAsync(s => s.Id == sectionId);
            if (section == null)
            {
                return ServiceResult<SectionRes>.Fail("Section not found");
            }

            var permission = await _context.SectionPermissions
                    .AsNoTracking()
                    .Where(s => s.SectionId == sectionId && s.UserId == userId)
                    .FirstOrDefaultAsync();

            return ServiceResult<SectionRes>.Ok(new SectionRes
            {
                Id = section.Id,
                DocumentId = section.DocumentId,
                Title = section.Title,
                Level = section.Level,
                OrderIndex = section.OrderIndex,
                ParentSectionId = section.ParentSectionId,
                Content = section.Content,
                UserId = userId,
                Permission = permission?.Permission ?? PermissionLevel.ViewOnly,
                AssignedAt = permission?.AssignedAt ?? DateTime.UtcNow
            });
        }

        // Get all user permissions on section:
        public async Task<List<BlockPermissionRes>> GetSectionPermissionsAsync(Guid sectionId)
        {
            var sectionPermissions = await _context.SectionPermissions
                .AsNoTracking()
                .Where(s => s.SectionId == sectionId)
                .Join(
                    _context.Users.AsNoTracking(),
                    sp => sp.UserId,
                    u => u.Id,
                    (sp, u) => new BlockPermissionRes
                    {
                        Id = sp.Id,
                        fullName = u.FullName,
                        SectionId = sp.SectionId,
                        UserId = sp.UserId,
                        UserEmail = u.Email,
                        Permission = sp.Permission.ToString(),
                        AssignedAt = sp.AssignedAt
                    })
                .ToListAsync();

            return sectionPermissions;
        }

        //// Get permission of user on section:
        public async Task<SectionPermission?> GetUserPermissonAsync(Guid userId, Guid sectionId)
        {
            var permission = await _context.SectionPermissions
                .AsNoTracking()
                .Where(s => s.SectionId == sectionId && s.UserId == userId)
                .FirstOrDefaultAsync();

            return permission;
        }

        // Update section content and manage hyperlinks:
        public async Task<ServiceResult<UpdateContentRes>> UpdateSectionContentAsync(Guid sectionId, string newContent)
        {
            // START TRANSACTION
            using var transaction =
                await _context.Database.BeginTransactionAsync();

            var response = new UpdateContentRes
            {
                Id = sectionId,
                Flag = false
            };

            try
            {
                var section = await _context.Sections
                    .FirstOrDefaultAsync(x => x.Id == sectionId);

                if (section == null)
                {
                    return ServiceResult<UpdateContentRes>
                        .Fail("Section not found");
                }


                // PHASE 1: PARSE SFDT
                var root = JObject.Parse(newContent);

                var blocks = ExtractBlocksFromSfdt(newContent);

                var safeSectionJson = new JObject
                {
                    ["b"] = new JArray(blocks),
                    ["imgs"] = root["imgs"]
                };

                using var doc =
                    JsonDocument.Parse(
                        safeSectionJson.ToString(Formatting.None));

                var rewriteResult =
                    _hyperlinkEngine.BuildAndRewrite(
                        doc.RootElement);

                section.Content =
                    rewriteResult.Sfdt.GetRawText();

                // PHASE 2: REPLACE LINK
                var oldCount = await _context.SectionHyperlinks
                    .CountAsync(x => x.SectionId == sectionId);

                response.Flag =
                    rewriteResult.Hyperlinks.Count > oldCount;

                await _context.SectionHyperlinks
                    .Where(x => x.SectionId == sectionId)
                    .ExecuteDeleteAsync();

                var newLinks = rewriteResult.Hyperlinks
                    .Select(item => new SectionHyperlink
                    {
                        Id = Guid.NewGuid(),
                        SectionId = sectionId,
                        ProofFileId = item.ProofFileId,
                        Url = item.Url,
                        Position = item.Position,
                        CreatedAt = DateTime.UtcNow
                    })
                    .ToList();

                _context.SectionHyperlinks.AddRange(newLinks);

                await _context.SaveChangesAsync();

                // LOAD DOCUMENT LINKS

                var currentLinks =
                    await _context.SectionHyperlinks
                        .Include(x => x.Section)
                        .Where(x =>
                            x.Section.DocumentId ==
                            section.DocumentId)
                        .ToListAsync();

                // RECALCULATE OWNER
                _updateHelper.RecalculateOwners(currentLinks);
                // BUILD NUMBERING
                _updateHelper.BuildNumbering(currentLinks, section.DocumentId);

                // REWRITE DISPLAY
                _updateHelper.RewriteAllSections(section.DocumentId);
                // FINAL SAVE + VERSION

                section.Version++;
                section.Timestamp =
                    DateTimeOffset.UtcNow
                        .ToUnixTimeMilliseconds();

                var docEntity =
                    await _context.Documents
                        .FirstOrDefaultAsync(
                            x => x.Id == section.DocumentId);

                if (docEntity != null)
                {
                    docEntity.hasChanges = true;
                }

                await _context.SaveChangesAsync();

                await transaction.CommitAsync();

                return ServiceResult<UpdateContentRes>
                    .Ok(response);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();

                _logger.LogError(
                    ex,
                    "UpdateSectionContent error");

                return ServiceResult<UpdateContentRes>
                    .Fail("Failed to update section");
            }
        }
        //Hàm chuyển từ sfdt gốc sang section content:
        public static List<JObject> ExtractBlocksFromSfdt(string json)
        {
            var result = new List<JObject>();

            if (string.IsNullOrWhiteSpace(json))
                return result;

            try
            {
                var root = JObject.Parse(json);

                if (root["sec"] is not JArray sections)
                    return result;

                // Optional: estimate capacity
                int estimatedCount = 0;

                foreach (var sec in sections)
                {
                    if (sec?["b"] is JArray b)
                        estimatedCount += b.Count;
                }

                result = new List<JObject>(estimatedCount);

                foreach (var sec in sections)
                {
                    if (sec?["b"] is not JArray blocks)
                        continue;

                    foreach (var block in blocks)
                    {
                        if (block is JObject obj)
                        {
                            // KHÔNG clone nếu không cần mutate
                            result.Add(obj);
                        }
                    }
                }
            }
            catch
            {
                return new List<JObject>();
            }
            return result;
        }


        // Get section by sectionId
        public async Task<ServiceResult<Section>> GetSectionByIdAsync(Guid sectionId)
        {
            var section = await _context.Sections
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.Id == sectionId);
            if (section == null)
            {
                return ServiceResult<Section>.Fail("Section not found");
            }
            return ServiceResult<Section>.Ok(section);
        }
    }
}