using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Text.Json;
using text_editor_server.Data;
using text_editor_server.DTOs.res;
using text_editor_server.Entities;

namespace text_editor_server.Services
{
    public class SectionService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<SectionService> _logger;
        private readonly HyperlinkEngine _hyperlinkEngine;

        public SectionService(AppDbContext context, ILogger<SectionService> logger, HyperlinkEngine hyperlinkEngine)
        {
            _context = context;
            _logger = logger;
            _hyperlinkEngine = hyperlinkEngine;
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

        public async Task<ServiceResult<List<Section>>> GetAllSectionsByDocumentAsync(Guid documentId)
        {
            var sections = await _context.Sections
                .AsNoTracking()
                .Where(s => s.DocumentId == documentId)
                .OrderBy(s => s.OrderIndex)
                .ToListAsync();

            return ServiceResult<List<Section>>.Ok(sections);
        }

        public async Task<List<BlockPermissionRes>> GetSectionPermissonAsync(Guid sectionId)
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

        // lấy quyền của 1 user trên 1 section
        public async Task<SectionPermission> GetUserPermissonAsync(Guid userId, Guid sectionId)
        {
            var permission = await _context.SectionPermissions
                .AsNoTracking()
                .Where(s => s.SectionId == sectionId && s.UserId == userId)
                .FirstOrDefaultAsync();

            return permission;
        }




        public async Task<bool> UpdateSectionContentAsync(
          Guid sectionId,
          string newContent)
        {
            try
            {
                var section = await _context.Sections
                    .FirstOrDefaultAsync(s => s.Id == sectionId);

                if (section == null)
                    return false;

                // ================= PARSE SFDT =================
                var root = JObject.Parse(newContent);

                // extract blocks
                var blocks = ExtractBlocksFromSfdt(newContent);

                // rebuild SAFE section content
                var safeSectionJson = new JObject
                {
                    ["b"] = new JArray(blocks),
                    ["imgs"] = root["imgs"]
                };

                // ================= RUN HYPERLINK ENGINE =================
                var json = safeSectionJson.ToString(Formatting.None);

                using var doc = JsonDocument.Parse(json);

                var rewriteResult = _hyperlinkEngine.BuildAndRewrite(
                    doc.RootElement,
                    section.Title // ví dụ: 1.1
                );

                // ================= SAVE REWRITTEN SFDT =================
                section.Content = rewriteResult.Sfdt.GetRawText();

                // ================= REMOVE OLD LINKS =================
                var oldLinks = await _context.SectionHyperlinks
                    .Where(h => h.SectionId == sectionId)
                    .ToListAsync();

                if (oldLinks.Any())
                {
                    _context.SectionHyperlinks.RemoveRange(oldLinks);
                }

                // ================= INSERT NEW LINKS =================
                foreach (var item in rewriteResult.Hyperlinks)
                {
                    Guid? proofFileId =
                        ExtractProofFileId(item.Url);

                    var hyperlink = new SectionHyperlink
                    {
                        Id = Guid.NewGuid(),
                        SectionId = sectionId,
                        Code = item.Code,
                        Url = item.Url,
                        ProofFileId = proofFileId,
                        CreatedAt = DateTime.UtcNow
                    };

                    _context.SectionHyperlinks.Add(hyperlink);
                }

                // ================= UPDATE SECTION =================
                section.Version += 1;

                section.Timestamp =
                    DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

                // ================= UPDATE DOCUMENT =================
                var document = await _context.Documents
                    .FirstOrDefaultAsync(d => d.Id == section.DocumentId);

                if (document != null)
                {
                    document.hasChanges = true;
                }

                // ================= SAVE =================
                await _context.SaveChangesAsync();

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error updating section content");

                return false;
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

        private Guid? ExtractProofFileId(string url)
        {
            if (string.IsNullOrWhiteSpace(url))
                return null;

            const string marker = "/api/prooffile/file/";

            var index = url.IndexOf(
                marker,
                StringComparison.OrdinalIgnoreCase);

            if (index == -1)
                return null;

            var guidPart = url[(index + marker.Length)..];

            if (Guid.TryParse(guidPart, out var guid))
            {
                return guid;
            }

            return null;
        }
    }
}
