using DocumentFormat.OpenXml.Bibliography;
using Microsoft.EntityFrameworkCore;
using text_editor_server.Data;
using text_editor_server.DTOs.res;
using text_editor_server.Entities;
using System.Security.Cryptography;
using System.Text;

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

        public async Task<ServiceResult<ProofFileRes>> UploadProofFileAsync(
            IFormFile file,
            string? title,
            Guid currentUserId)
        {
            try
            {
                if (file == null || file.Length == 0)
                    return ServiceResult<ProofFileRes>.Fail("File không hợp lệ");

                byte[] fileBytes;

                using (var memoryStream = new MemoryStream())
                {
                    await file.CopyToAsync(memoryStream);
                    fileBytes = memoryStream.ToArray();
                }

                // Mã hóa file
                var encryptedData = EncryptFile(fileBytes);

                var entity = new ProofFile
                {
                    Id = Guid.NewGuid(),
                    FileName = file.FileName,
                    StoredFileName = $"{Guid.NewGuid()}_{file.FileName}",
                    FileSize = file.Length,
                    ContentType = file.ContentType,
                    Data = encryptedData,
                    CreatedAt = DateTime.UtcNow,
                    IsGlobal = false
                };

                _context.ProofFiles.Add(entity);
                await _context.SaveChangesAsync();

                return ServiceResult<ProofFileRes>.Ok(new ProofFileRes
                {
                    Id = entity.Id,
                    FileName = entity.FileName,
                    StoredFileName = entity.StoredFileName,
                    FileSize = entity.FileSize,
                    ContentType = entity.ContentType,
                    CreatedAt = entity.CreatedAt
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to upload proof file");
                return ServiceResult<ProofFileRes>.Fail("Đã xảy ra lỗi khi tải tệp: " + ex.Message);
            }
        }

        public async Task<ServiceResult<ProofFileDownloadRes>> DownloadProofFileAsync(Guid fileId)
        {
            try
            {
                var entity = await _context.ProofFiles
                    .AsNoTracking()
                    .FirstOrDefaultAsync(x => x.Id == fileId);

                if (entity == null)
                {
                    return ServiceResult<ProofFileDownloadRes>
                        .Fail("File not found");
                }

                byte[] decryptedData;

                try
                {
                    decryptedData = DecryptFile(entity.Data);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to decrypt proof file {FileId}", fileId);
                    return ServiceResult<ProofFileDownloadRes>
                        .Fail("Failed to decrypt file");
                }

                return ServiceResult<ProofFileDownloadRes>.Ok(new ProofFileDownloadRes
                {
                    FileName = entity.FileName,
                    ContentType = entity.ContentType,
                    Data = decryptedData
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to download proof file {FileId}", fileId);
                return ServiceResult<ProofFileDownloadRes>
                    .Fail("Failed to download file");
            }
        }

        public async Task<ServiceResult<bool>> DeleteProofFileAsync(Guid fileId)
        {
            try
            {
                var entity = await _context.ProofFiles
                    .FirstOrDefaultAsync(x => x.Id == fileId);

                if (entity == null)
                {
                    return ServiceResult<bool>.Fail("File not found");
                }

                _context.ProofFiles.Remove(entity);
                await _context.SaveChangesAsync();

                return ServiceResult<bool>.Ok(true);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to delete proof file {FileId}", fileId);
                return ServiceResult<bool>.Fail("Failed to delete file");
            }
        }

        private byte[] EncryptFile(byte[] data)
        {
            var key = Encoding.UTF8.GetBytes("12345678901234561234567890123456"); // 32 bytes
            var iv = Encoding.UTF8.GetBytes("1234567890123456"); // 16 bytes

            using var aes = Aes.Create();

            aes.Key = key;
            aes.IV = iv;

            using var encryptor = aes.CreateEncryptor();
            using var ms = new MemoryStream();

            using (var cryptoStream = new CryptoStream(ms, encryptor, CryptoStreamMode.Write))
            {
                cryptoStream.Write(data, 0, data.Length);
            }

            return ms.ToArray();
        }

        private byte[] DecryptFile(byte[] encryptedData)
        {
            var key = Encoding.UTF8.GetBytes("12345678901234561234567890123456"); // 32 bytes
            var iv = Encoding.UTF8.GetBytes("1234567890123456"); // 16 bytes

            using var aes = Aes.Create();

            aes.Key = key;
            aes.IV = iv;

            using var decryptor = aes.CreateDecryptor();
            using var ms = new MemoryStream(encryptedData);

            using var cryptoStream = new CryptoStream(ms, decryptor, CryptoStreamMode.Read);
            using var resultStream = new MemoryStream();

            cryptoStream.CopyTo(resultStream);

            return resultStream.ToArray();
        }


        public async Task<ServiceResult<List< ProofFileRes>>> GetAllAsync()
        {

            var files = await _context.ProofFiles
                .AsNoTracking().Select(f => new ProofFileRes
                {
                    Id = f.Id,
                    FileName = f.FileName,
                    StoredFileName = f.StoredFileName,
                    FileUrl = f.StoredFileName,
                    FileSize = f.FileSize,
                    ContentType = f.ContentType,
                    IsGlobal = f.IsGlobal,    
                    CreatedAt = f.CreatedAt
                 })
                    .ToListAsync();


            return ServiceResult<List<ProofFileRes>>.Ok(files);
            
            
        }

    }
}