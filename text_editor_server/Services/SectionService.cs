using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Text.Json;
using System.Text.RegularExpressions;
using text_editor_server.Data;
using text_editor_server.DTOs.res;
using text_editor_server.Entities;

using System.Text.RegularExpressions;

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
            using var transaction =
                await _context.Database.BeginTransactionAsync();

            try
            {
                var section =
                    await _context.Sections
                        .FirstOrDefaultAsync(x => x.Id == sectionId);

                if (section == null)
                    return false;

                // =========================
                // PHASE 1: PARSE SFDT
                // =========================

                var root = JObject.Parse(newContent);

                var blocks =
                    ExtractBlocksFromSfdt(newContent);

                var safeSectionJson =
                    new JObject
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

                // =========================
                // PHASE 2: REPLACE LINKS
                // =========================

                var oldLinks =
                    await _context.SectionHyperlinks
                        .Where(x => x.SectionId == sectionId)
                        .ToListAsync();

                _context.SectionHyperlinks.RemoveRange(oldLinks);

                foreach (var item in rewriteResult.Hyperlinks)
                {
                    _context.SectionHyperlinks.Add(
                        new SectionHyperlink
                        {
                            Id = Guid.NewGuid(),
                            SectionId = sectionId,
                            ProofFileId = item.ProofFileId,
                            Url = item.Url,
                            Position = item.Position,
                            CreatedAt = DateTime.UtcNow
                        });
                }

                await _context.SaveChangesAsync();

                // =========================
                // LOAD DOCUMENT LINKS
                // =========================

                var currentLinks =
                    await _context.SectionHyperlinks
                        .Include(x => x.Section)
                        .Where(x =>
                            x.Section.DocumentId == section.DocumentId)
                        .ToListAsync();

                // =========================
                // RECALCULATE OWNER
                // =========================

                RecalculateOwners(currentLinks);

                // =========================
                // BUILD NUMBERING
                // =========================

                BuildNumbering(currentLinks, section.DocumentId);

                // =========================
                // REWRITE DISPLAY
                // =========================

                RewriteAllSections(section.DocumentId);

                // =========================
                // FINAL SAVE + VERSION
                // =========================
                await _context.SaveChangesAsync();
                section.Version++;
                section.Timestamp =
                    DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

                var docEntity =
                    await _context.Documents
                        .FirstOrDefaultAsync(x => x.Id == section.DocumentId);

                if (docEntity != null)
                    docEntity.hasChanges = true;

                await _context.SaveChangesAsync();

                await transaction.CommitAsync();

                return true;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();

                _logger.LogError(ex, "UpdateSectionContent error");
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

        //HELPER for update:
        private void RecalculateOwners(List<SectionHyperlink> links)
        {
            var groups =
                links
                    .Where(x => x.ProofFileId.HasValue)
                    .GroupBy(x => x.ProofFileId.Value);

            foreach (var group in groups)
            {
                var safeGroup = group.ToList();

                var owner =
                    safeGroup
                        .OrderBy(x => x.Section?.OrderIndex ?? int.MaxValue)
                        .ThenBy(x => x.Position)
                        .FirstOrDefault();

                if (owner == null)
                    continue;

                foreach (var item in safeGroup)
                {
                    item.OwnerSectionId = owner.SectionId;
                }
            }
        }
        //   private void BuildNumbering(
        //List<SectionHyperlink> links,
        //Guid documentId)
        //   {
        //       var sections =
        //           _context.Sections
        //               .Where(x => x.DocumentId == documentId)
        //               .OrderBy(x => x.OrderIndex)
        //               .ToList();

        //       foreach (var section in sections)
        //       {
        //           var sectionCode =
        //               Regex.Match(section.Title ?? "", @"^\d+(\.\d+)*").Value;

        //           if (string.IsNullOrWhiteSpace(sectionCode))
        //               sectionCode = "section";

        //           int counter = 1;

        //           var ownerLinks =
        //               links
        //                   .Where(x => x.OwnerSectionId == section.Id)
        //                   .GroupBy(x => x.ProofFileId)
        //                   .Select(g => g.First())
        //                   .OrderBy(x => x.Position)
        //                   .ToList();

        //           foreach (var link in ownerLinks)
        //           {
        //               var code = $"{sectionCode}-{counter:D2}";

        //               var sameProof =
        //                   links.Where(x => x.ProofFileId == link.ProofFileId);

        //               foreach (var item in sameProof)
        //               {
        //                   item.Code = code;
        //               }

        //               counter++;
        //           }
        //       }
        //   }


        private void BuildNumbering(
    List<SectionHyperlink> links,
    Guid documentId)
        {
            var sections =
                _context.Sections
                    .Where(x => x.DocumentId == documentId)
                    .OrderBy(x => x.OrderIndex)
                    .ToList();

            foreach (var section in sections)
            {
                var sectionCode =
                    Regex.Match(
                        section.Title ?? "",
                        @"^\d+(\.\d+)*")
                    .Value;

                if (string.IsNullOrWhiteSpace(sectionCode))
                    sectionCode = "section";

                int counter = 1;

                var ownerLinks =
                    links
                        .Where(x =>
                            x.OwnerSectionId == section.Id &&
                            x.ProofFileId.HasValue)
                        .GroupBy(x => x.ProofFileId!.Value)
                        .Select(g =>
                            g.OrderBy(x => x.Section?.OrderIndex ?? int.MaxValue)
                             .ThenBy(x => x.Position)
                             .First())
                        .OrderBy(x => x.Section?.OrderIndex ?? int.MaxValue)
                        .ThenBy(x => x.Position)
                        .ToList();

                foreach (var link in ownerLinks)
                {
                    var code =
                        $"{sectionCode}-{counter:D2}";

                    var sameProof =
                        links.Where(x =>
                            x.ProofFileId ==
                            link.ProofFileId);

                    foreach (var item in sameProof)
                    {
                        item.Code = code;
                    }

                    counter++;
                }
            }
        }

        private void RewriteAllSections(Guid documentId)
        {
            var sections =
                _context.Sections
                    .Where(x => x.DocumentId == documentId)
                    .ToList();

            var links =
                _context.SectionHyperlinks
                    .Where(x => x.Section.DocumentId == documentId)
                    .Include(x => x.Section)
                    .ToList();

            foreach (var section in sections)
            {
                var map =
              links
                  .Where(x => x.SectionId == section.Id)
                  .Where(x => x.ProofFileId.HasValue && !string.IsNullOrEmpty(x.Code))
                  .GroupBy(x => x.ProofFileId.Value)
                  .ToDictionary(
                      g => g.Key,
                      g => g
                          .OrderBy(x => x.Position)
                          .First()
                          .Code
                  );

                section.Content =
                    RewriteSfdtDisplayText(section.Content, map);

                // ❗ FIX: remove double version increment (ONLY HERE)
                section.Timestamp =
                    DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            }
        }

        private string RewriteSfdtDisplayText(
     string content,
     Dictionary<Guid, string> codeMap)
        {
            if (string.IsNullOrWhiteSpace(content))
                return content;

            using var doc = JsonDocument.Parse(content);

            var safeMap =
                codeMap.ToDictionary(
                    x => (Guid?)x.Key,
                    x => x.Value ?? ""
                );

            var rewritten =
                _hyperlinkEngine.RewriteDisplayCodes(
                    doc.RootElement,
                    safeMap);

            return rewritten.GetRawText();
        }

    }
}