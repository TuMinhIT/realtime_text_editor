using DocumentFormat.OpenXml.Bibliography;
using Microsoft.EntityFrameworkCore;
using text_editor_server.Data;
using text_editor_server.DTOs.res;

namespace text_editor_server.Services
{
    public class ProofFileService
    {

        private readonly AppDbContext _context;

        private readonly ILogger<ProofFileService> _logger;

        public ProofFileService(AppDbContext context, ILogger<ProofFileService> logger)
        {
            _context = context;
            _logger = logger;

        }

        public async Task<ServiceResult<ProofFileRes>> UploadProofFileAsync(IFormFile file, string? title, Guid currentUserId)
        {
            return ServiceResult<ProofFileRes>.Fail("Chức năng đang được phát triển");
                    //new ProofFileRes
                    //{
                    //    Id = Guid.NewGuid(),
                    //    FileName = file.FileName,
                    //    StoredFileName = $"{Guid.NewGuid()}_{Path.GetFileName(file.FileName)}",
                    //    FileUrl = $"uploads/{Guid.NewGuid()}_{Path.GetFileName(file.FileName)}",
                    //    Data = Array.Empty<byte>(),
                    //    FileSize = file.Length,
                    //    ContentType = file.ContentType,
                    //    IsGlobal = false,
                    //    CreatedAt = DateTime.UtcNow
                    //});
                    //}

            //try
            //{
            //    if (file == null || file.Length == 0)
            //        return BadRequest("File không hợp lệ");

            //    // tên file unique
            //    var storedFileName =
            //        $"{Guid.NewGuid()}_{Path.GetFileName(file.FileName) }";

            //    var uploadPath = Path.Combine(
            //        Directory.GetCurrentDirectory(),
            //        "wwwroot",
            //        "uploads"
            //    );

            //    if (!Directory.Exists(uploadPath))
            //        Directory.CreateDirectory(uploadPath);

            //    var filePath = Path.Combine(uploadPath, storedFileName);


            //    using var memoryStream = new MemoryStream();

            //    await file.CopyToAsync(memoryStream);

            //    var entity = new FileEntity
            //    {
            //        Id = Guid.NewGuid(),
            //        FileName = file.FileName,
            //        Data = memoryStream.ToArray(),
            //        ContentType = file.ContentType
            //    };

            //    _dbContext.Files.Add(entity);

            //    await _dbContext.SaveChangesAsync();


            //    // save DB
            //    var fileEntity = new FileEntity
            //    {
            //        Id = Guid.NewGuid(),
            //        FileName = file.FileName,
            //        StoredFileName = storedFileName,
            //        FileUrl = fileUrl,
            //        FileSize = file.Length,
            //        ContentType = file.ContentType,
            //        IsGlobal = false,
            //        CreatedAt = DateTime.UtcNow
            //    };

            //    _dbContext.Files.Add(fileEntity);

            //    await _dbContext.SaveChangesAsync()
            //}
            //catch (Exception ex)
            //{
            //    _logger.LogError(ex, "Failed to get documents");
            //    return null;
            //}
        }


    }
}
