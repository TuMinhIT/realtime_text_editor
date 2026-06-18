using System.Text.Json;
using System.Text.RegularExpressions;
using text_editor_server.Data;
using text_editor_server.Entities;
using Microsoft.EntityFrameworkCore;

namespace text_editor_server.Services.Helper
{
    public class UpdateSectionContentHelper
    {

        private readonly AppDbContext _context;
        private readonly HyperlinkEngine _hyperlinkEngine;

        public UpdateSectionContentHelper(
            AppDbContext context,
            HyperlinkEngine hyperlinkEngine)
        {
            _context = context;
            _hyperlinkEngine = hyperlinkEngine;
        }
        //HELPER for update:
        public  void RecalculateOwners(List<SectionHyperlink> links)
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

        public  void BuildNumbering(
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

        public void RewriteAllSections(Guid documentId)
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

        public string RewriteSfdtDisplayText(
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
