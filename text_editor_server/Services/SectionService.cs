using Newtonsoft.Json;
using text_editor_server.Data;
using text_editor_server.DTOs.res;
using text_editor_server.Entities;

namespace text_editor_server.Services
{
    public class SectionService
    {

        private readonly AppDbContext _context;
        private readonly IDocxParsingService _docxParsingService;
        private readonly ILogger<DocumentService> _logger;

        public SectionService(AppDbContext context, IDocxParsingService docxParsingService, ILogger<DocumentService> logger)
        {
            _context = context;
            _docxParsingService = docxParsingService;
            _logger = logger;
        }


       public async Task<ServiceResult<DocumentUploadRes>> ImportSection(
       IFormFile? file,
       string? title,
       Guid currentUserId)
        {
          
            try
            {
                await using var stream = new MemoryStream();
                await file.CopyToAsync(stream);

                if (stream.Length == 0)
                    return ServiceResult<DocumentUploadRes>.Fail("File is empty");

                // ======================
                // Parse sections
                // ======================
                stream.Position = 0;
                var (sections, plainText) =
                    await _docxParsingService.ParseDocxAsync(stream);

                var sectionsList = sections ?? new List<Section>();

                // ======================
                // Convert DOCX -> SFDT JSON (KHÔNG NÉN)
                // ======================
                stream.Position = 0;

                using var wordDoc = new Syncfusion.DocIO.DLS.WordDocument(
                    stream,
                    Syncfusion.DocIO.FormatType.Docx);

            
                var editorDoc = Syncfusion.EJ2.DocumentEditor.WordDocument.Load(wordDoc);


                // QUAN TRỌNG: đây mới là JSON thật
                string sfdtJson = JsonConvert.SerializeObject(editorDoc);

                editorDoc.Dispose();

                // ======================
                // Save DB
                // ======================
                var document = new Document
                {
                    Id = Guid.NewGuid(),
                    Title = string.IsNullOrWhiteSpace(title)
                        ? Path.GetFileNameWithoutExtension(file.FileName)
                        : title.Trim(),
                    Content = sfdtJson,
                    SourceFilePath = file.FileName,
                    CreatedBy = currentUserId,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Documents.Add(document);

                // ======================
                // Default section
                // ======================
                if (!sectionsList.Any())
                {
                    sectionsList.Add(new Section
                    {
                        Id = Guid.NewGuid(),
                        Title = "1",
                        Content = plainText ?? "",
                        DocumentId = document.Id,
                        Version = 0,
                        Timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
                    });
                }

                foreach (var section in sectionsList)
                {
                    if (section.Id == Guid.Empty)
                        section.Id = Guid.NewGuid();

                    section.DocumentId = document.Id;
                    section.Version = 0;
                    section.Timestamp =
                        DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
                }

                _context.Sections.AddRange(sectionsList);

                var permissions = sectionsList.Select(s => new SectionPermission
                {
                    Id = Guid.NewGuid(),
                    SectionId = s.Id,
                    UserId = currentUserId,
                    Permission = PermissionLevel.Admin,
                    AssignedAt = DateTime.UtcNow
                });

                _context.SectionPermissions.AddRange(permissions);

                await _context.SaveChangesAsync();

                return ServiceResult<DocumentUploadRes>.Ok(
                    new DocumentUploadRes
                    {
                        DocumentId = document.Id,
                        Title = document.Title,
                        Blocks = sectionsList
                            .Select((s, index) => new DocumentBlockItemRes
                            {
                                SectionId = s.Id,
                                Title = s.Title,
                                Order = index + 1,
                                Preview = string.IsNullOrEmpty(s.Content)
                                    ? ""
                                    : s.Content.Length > 200
                                        ? s.Content.Substring(0, 200)
                                        : s.Content
                            })
                            .ToList()
                    });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Upload failed");
                return ServiceResult<DocumentUploadRes>.Fail("Upload failed");
            }
        }



           
}
}
