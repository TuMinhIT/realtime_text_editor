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
                var existingLinks = await _context.SectionHyperlinks
                    .Include(x => x.Section)
                    .Where(x =>
                        x.Section.DocumentId == section.DocumentId)
                    .ToListAsync();

                var json = safeSectionJson.ToString(Formatting.None);

                using var doc = JsonDocument.Parse(json);

                //Cắt section title ở đây 1.1 

                //Chỉ lấy phần số ở đầu title 
                var titleCut = Regex.Match(
                    section.Title ?? "",
                    @"^\d+(\.\d+)*"
                ).Value;

                var rewriteResult = _hyperlinkEngine.BuildAndRewrite(
                    doc.RootElement,
                    sectionId,
                    string.IsNullOrWhiteSpace(titleCut)
                    ? "section"
                    : titleCut,
                    existingLinks
                );

                // ================= SAVE REWRITTEN SFDT =================
                section.Content = rewriteResult.Sfdt.GetRawText();


                var affectedOwnerIds = new HashSet<Guid>();

                // section hiện tại luôn có thể bị resequence
                affectedOwnerIds.Add(sectionId);

                //Remove old link:
                var oldLinks = await _context.SectionHyperlinks
                    .Where(h => h.SectionId == sectionId)
                    .ToListAsync();

                // Transfer owner:
                foreach (var oldLink in oldLinks)
                {
                    // chỉ xử lý proof mà section hiện tại đang owner
                    if (oldLink.OwnerSectionId != sectionId)
                        continue;

                    var proofFileId =
                        oldLink.ProofFileId;

                    if (proofFileId == null)
                        continue;

                    // tất cả section khác đang dùng proof này
                    var candidates =
                        await _context.SectionHyperlinks
                        .Include(x => x.Section)
                        .Where(x =>
                            x.ProofFileId == proofFileId
                            && x.SectionId != sectionId)
                        .ToListAsync();

                    // không ai dùng nữa => proof bị xoá hẳn
                    if (!candidates.Any())
                        continue;

                    // owner cũ
                    var currentOwnerOrder =
                        section.OrderIndex;

                    // owner mới = section gần owner cũ nhất
                    var newOwner = candidates
                        .OrderBy(x =>
                            Math.Abs(
                                x.Section.OrderIndex
                                - currentOwnerOrder))
                        // nếu bằng khoảng cách
                        // ưu tiên section phía trước
                        .ThenBy(x =>
                            x.Section.OrderIndex)
                        .First();

                    var newOwnerId =
                        newOwner.SectionId;

                    // owner cũ phải resequence
                    affectedOwnerIds.Add(sectionId);

                    // owner mới phải resequence
                    affectedOwnerIds.Add(newOwnerId);

                    // update owner cho toàn bộ proof
                    foreach (var candidate in candidates)
                    {
                        candidate.OwnerSectionId =
                            newOwnerId;
                    }
                }
                _context.SectionHyperlinks.RemoveRange(oldLinks);

                await _context.SaveChangesAsync();

                // INSERT NEW LINKS
                foreach (var item in rewriteResult.Hyperlinks
                 .GroupBy(x => x.Url)
                 .Select(g => g.First()))
                {
                    Guid? proofFileId =
                        ExtractProofFileId(item.Url);

                    //var existed = existingLinks.FirstOrDefault(x =>
                    //    x.ProofFileId == proofFileId);
                    var existed = existingLinks
                    .FirstOrDefault(x =>
                        x.ProofFileId ==
                            proofFileId
                        && x.SectionId != sectionId);
                    var hyperlink = new SectionHyperlink
                    {
                        Id = Guid.NewGuid(),
                        SectionId = sectionId,

                        //Owner:
                        OwnerSectionId = existed?.OwnerSectionId ?? sectionId,
                        Code = item.Code,
                        Url = item.Url,
                        ProofFileId = proofFileId,
                        CreatedAt = DateTime.UtcNow
                    };

                    _context.SectionHyperlinks.Add(hyperlink);
                }
                await _context.SaveChangesAsync();
                var currentLinks =
                   await _context.SectionHyperlinks
                   .Include(x => x.Section)
                   .Where(x =>
                       x.Section.DocumentId ==
                       section.DocumentId)
                   .ToListAsync();


                // chỉ owner của section hiện tại mới được resequence
                foreach (var ownerId in affectedOwnerIds)
                {
                    await ReSequenceSectionHyperlinksAsync(
                        ownerId,
                        currentLinks
                    );
                }
                var hyperlinks = currentLinks
            .Where(x =>
                x.OwnerSectionId == sectionId
                && x.ProofFileId != null)
            .GroupBy(x => x.ProofFileId)
            .Select(g => g
                .OrderBy(x => x.CreatedAt)
                .First())
            .OrderBy(x => x.CreatedAt)
            .ToList();

                //Nâng cấp cho section liên quan luôn:
                //var affectedSectionIds = currentLinks
                //    .Where(x => x.OwnerSectionId != Guid.Empty)
                //    .Select(x => x.OwnerSectionId)
                //    .Distinct()
                //    .ToList();
                //foreach (var affectedSectionId in affectedSectionIds)
                //{
                //    await ReSequenceSectionHyperlinksAsync(
                //        affectedSectionId,
                //        currentLinks
                //    );
                //}


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

        //helper:
        private async Task RewriteSectionHyperlinkCodeAsync(
    Guid sectionId,
    string oldCode,
    string newCode)
        {
            var section = await _context.Sections
                .FirstOrDefaultAsync(x => x.Id == sectionId);

            if (section == null
                || string.IsNullOrWhiteSpace(section.Content))
                return;

            // replace display text cũ
            section.Content = section.Content.Replace(
                $"[{oldCode}]",
                $"[{newCode}]");

            section.Version += 1;

            section.Timestamp =
                DateTimeOffset.UtcNow
                .ToUnixTimeMilliseconds();
        }
       
        private async Task ReSequenceSectionHyperlinksAsync(
    Guid sectionId,
    List<SectionHyperlink> currentLinks)
        {
            var section = await _context.Sections
                .FirstOrDefaultAsync(x =>
                    x.Id == sectionId);

            if (section == null)
                return;

            var sectionCode = Regex.Match(
                section.Title ?? "",
                @"^\d+(\.\d+)*"
            ).Value;

            sectionCode =
                string.IsNullOrWhiteSpace(sectionCode)
                ? "section"
                : sectionCode;

            // unique proof theo owner
            var hyperlinks = currentLinks
                .Where(x =>
                    x.OwnerSectionId == sectionId
                    && x.ProofFileId != null)
                .GroupBy(x => x.ProofFileId)
                .Select(g => g.First())
                .OrderBy(x =>
                    x.Section.OrderIndex)
                .ThenBy(x =>
                    x.CreatedAt)
                .ToList();

            var mapping =
                new List<(
                    Guid? ProofFileId,
                    string OldCode,
                    string TempCode,
                    string NewCode)>();

            int counter = 1;

            // build mapping
            foreach (var link in hyperlinks)
            {
                var oldCode =
                    link.Code;

                var newCode =
                    $"{sectionCode}-{counter:D2}";

                var tempCode =
                    $"TMP-{Guid.NewGuid():N}";

                mapping.Add((
                    link.ProofFileId,
                    oldCode,
                    tempCode,
                    newCode));

                counter++;
            }

            // =================
            // phase 1:
            // old -> temp
            // =================
            foreach (var item in mapping)
            {
                var sharedLinks =
                    currentLinks
                    .Where(x =>
                        x.ProofFileId ==
                        item.ProofFileId)
                    .ToList();

                foreach (var link in sharedLinks)
                {
                    link.Code =
                        item.TempCode;

                    await RewriteSectionHyperlinkCodeAsync(
                        link.SectionId,
                        item.OldCode,
                        item.TempCode
                    );
                }
            }

            // =================
            // phase 2:
            // temp -> final
            // =================
            foreach (var item in mapping)
            {
                var sharedLinks =
                    currentLinks
                    .Where(x =>
                        x.ProofFileId ==
                        item.ProofFileId)
                    .ToList();

                foreach (var link in sharedLinks)
                {
                    link.Code =
                        item.NewCode;

                    await RewriteSectionHyperlinkCodeAsync(
                        link.SectionId,
                        item.TempCode,
                        item.NewCode
                    );
                }
            }
        }

    }
}