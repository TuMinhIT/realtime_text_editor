using Microsoft.EntityFrameworkCore;
using System.IO.Compression;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using text_editor_server.Data;
using text_editor_server.DTOs.res;
using text_editor_server.Entities;

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
            Guid currentUserId, bool isGlobal, Guid? folderId = null)
        {
            try
            {
                if (file == null || file.Length == 0)
                    return ServiceResult<ProofFileRes>.Fail("File không hợp lệ");

                if (folderId.HasValue)
                {
                    var folderExists = await _context.Folders
                        .AsNoTracking()
                        .AnyAsync(x => x.Id == folderId.Value);

                    if (!folderExists)
                    {
                        return ServiceResult<ProofFileRes>.Fail("Folder not found");
                    }
                }

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
                    IsGlobal = isGlobal,
                    FolderId = folderId
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
                    CreatedAt = entity.CreatedAt,
                    IsGlobal = entity.IsGlobal,
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to upload proof file");
                return ServiceResult<ProofFileRes>.Fail("Đã xảy ra lỗi khi tải tệp: " + ex.Message);
            }
        }


        public async Task<ServiceResult<DocumentFile>> CreateDocumentFileAsync(
            Guid userId,
            Guid documentId, Guid fileId)
        {
            try
            {
                var documentExists = await _context.Documents
                    .AsNoTracking()
                    .AnyAsync(x => x.Id == documentId);

                if (!documentExists)
                {
                    return ServiceResult<DocumentFile>.Fail("Document not found");
                }

                var fileExists = await _context.ProofFiles
                    .AsNoTracking()
                    .AnyAsync(x => x.Id == fileId);

                if (!fileExists)
                {
                    return ServiceResult<DocumentFile>.Fail("File not found");
                }

                var existed = await _context.DocumentFiles
                    .AsNoTracking()
                    .FirstOrDefaultAsync(x => x.DocumentId == documentId && x.FileId == fileId);

                if (existed != null)
                {
                    return ServiceResult<DocumentFile>.Fail("File already attached");
                }

                var documentFile = new DocumentFile
                {
                    Id = Guid.NewGuid(),
                    DocumentId = documentId,
                    FileId = fileId,
                    AttachedBy = userId,
                    AttachedAt = DateTime.UtcNow
                };

                    _context.DocumentFiles.Add(documentFile);
                await _context.SaveChangesAsync();

                return ServiceResult<DocumentFile>.Ok(documentFile);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create document file");
                return ServiceResult<DocumentFile>.Fail("Đã xảy ra lỗi khi tải tệp: " + ex.Message);
            }
        }

        public async Task<ServiceResult<DocumentFile>> CreateDocumentFolderAsync(
            Guid userId,
            Guid documentId,
            Guid folderId)
        {
            try
            {
                var documentExists = await _context.Documents
                    .AsNoTracking()
                    .AnyAsync(x => x.Id == documentId);

                if (!documentExists)
                {
                    return ServiceResult<DocumentFile>.Fail("Document not found");
                }

                var folderExists = await _context.Folders
                    .AsNoTracking()
                    .AnyAsync(x => x.Id == folderId);

                if (!folderExists)
                {
                    return ServiceResult<DocumentFile>.Fail("Folder not found");
                }

                var existed = await _context.DocumentFiles
                    .AsNoTracking()
                    .FirstOrDefaultAsync(x => x.DocumentId == documentId && x.FolderId == folderId);

                if (existed != null)
                {
                    return ServiceResult<DocumentFile>.Fail("Folder already attached");
                }

                var documentFolder = new DocumentFile
                {
                    Id = Guid.NewGuid(),
                    DocumentId = documentId,
                    FolderId = folderId,
                    AttachedBy = userId,
                    AttachedAt = DateTime.UtcNow
                };

                _context.DocumentFiles.Add(documentFolder);
                await _context.SaveChangesAsync();

                return ServiceResult<DocumentFile>.Ok(documentFolder);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create document folder");
                return ServiceResult<DocumentFile>.Fail("Failed to create document folder");
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

        public async Task<ServiceResult<List<ProofFileRes>>> GetAllInternalAsync(Guid documentId)
        {
            var files = await _context.DocumentFiles
            .AsNoTracking()
            .Where(d => d.DocumentId == documentId && d.FileId != null)
            .Select(d => new ProofFileRes
            {
                Id = d.File!.Id,
                FileName = d.File.FileName,
                StoredFileName = d.File.StoredFileName,
                FileUrl = d.File.StoredFileName,
                FileSize = d.File.FileSize,
                ContentType = d.File.ContentType,
                IsGlobal = d.File.IsGlobal,
                CreatedAt = d.File.CreatedAt
            })
            .ToListAsync();

            return ServiceResult<List<ProofFileRes>>.Ok(files);
        }

        public async Task<ServiceResult<List< ProofFileRes>>> GetAllAsync()
        {

            var files = await _context.ProofFiles
                .AsNoTracking()
                .Where(f => f.IsGlobal) // Chỉ lấy các file có IsGlobal = true
                .Select(f =>
                
                new ProofFileRes
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

        public async Task<ServiceResult<FolderRes>> CreateFolderAsync(
            string name,
            bool isGlobal,
            Guid? documentId,
            Guid currentUserId)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(name))
                {
                    return ServiceResult<FolderRes>.Fail("Folder name is required");
                }

                if (isGlobal && documentId.HasValue)
                {
                    return ServiceResult<FolderRes>.Fail("Global folder cannot attach to document");
                }

                if (!isGlobal && !documentId.HasValue)
                {
                    return ServiceResult<FolderRes>.Fail("DocumentId is required");
                }

                var folder = new Folder
                {
                    Id = Guid.NewGuid(),
                    Name = name.Trim(),
                    IsGlobal = isGlobal,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Folders.Add(folder);
                await _context.SaveChangesAsync();

                if (!isGlobal)
                {
                    var linkResult = await CreateDocumentFolderAsync(
                        currentUserId,
                        documentId!.Value,
                        folder.Id);

                    if (!linkResult.Success)
                    {
                        return ServiceResult<FolderRes>.Fail(linkResult.Message);
                    }
                }

                return ServiceResult<FolderRes>.Ok(new FolderRes
                {
                    Id = folder.Id,
                    Name = folder.Name,
                    CreatedAt = folder.CreatedAt,
                    IsGlobal = folder.IsGlobal
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create folder");
                return ServiceResult<FolderRes>.Fail("Failed to create folder");
            }
        }

        public async Task<ServiceResult<bool>> DeleteFolderAsync(Guid folderId)
        {
            try
            {
                var folder = await _context.Folders
                    .Include(x => x.Files)
                    .FirstOrDefaultAsync(x => x.Id == folderId);

                if (folder == null)
                {
                    return ServiceResult<bool>.Fail("Folder not found");
                }

                foreach (var file in folder.Files)
                {
                    file.FolderId = null;
                }

                var folderLinks = await _context.DocumentFiles
                    .Where(x => x.FolderId == folderId)
                    .ToListAsync();

                _context.DocumentFiles.RemoveRange(folderLinks);
                _context.Folders.Remove(folder);
                await _context.SaveChangesAsync();

                return ServiceResult<bool>.Ok(true);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to delete folder");
                return ServiceResult<bool>.Fail("Failed to delete folder");
            }
        }

        public async Task<ServiceResult<ProofFileRes>> UploadProofFileToFolderAsync(
            IFormFile file,
            Guid currentUserId,
            Guid folderId)
        {
            var folder = await _context.Folders
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == folderId);

            if (folder == null)
            {
                return ServiceResult<ProofFileRes>.Fail("Folder not found");
            }

            var uploadResult = await UploadProofFileAsync(file, currentUserId, folder.IsGlobal, folderId);

            if (!uploadResult.Success || uploadResult.Data == null)
            {
                return uploadResult;
            }

            if (!folder.IsGlobal)
            {
                var folderLink = await _context.DocumentFiles
                    .AsNoTracking()
                    .FirstOrDefaultAsync(x => x.FolderId == folderId);

                if (folderLink == null)
                {
                    return ServiceResult<ProofFileRes>.Fail("Folder not attached to document");
                }

                var linkResult = await CreateDocumentFileAsync(
                    currentUserId,
                    folderLink.DocumentId,
                    uploadResult.Data.Id);

                if (!linkResult.Success)
                {
                    return ServiceResult<ProofFileRes>.Fail(linkResult.Message);
                }
            }

            return uploadResult;
        }

        public async Task<ServiceResult<List<ProofFileRes>>> UploadProofFilesToFolderAsync(
            IFormFileCollection files,
            Guid currentUserId,
            Guid folderId)
        {
            if (files == null || files.Count == 0)
            {
                return ServiceResult<List<ProofFileRes>>.Fail("File không hợp lệ");
            }

            var results = new List<ProofFileRes>();

            foreach (var file in files)
            {
                var uploadResult = await UploadProofFileToFolderAsync(file, currentUserId, folderId);

                if (!uploadResult.Success || uploadResult.Data == null)
                {
                    return ServiceResult<List<ProofFileRes>>.Fail(uploadResult.Message);
                }

                results.Add(uploadResult.Data);
            }

            return ServiceResult<List<ProofFileRes>>.Ok(results);
        }

        public async Task<ServiceResult<List<FolderRes>>> GetAllFolderGlobalAsync()
        {
            try
            {
                var folders = await _context.Folders
                    .AsNoTracking()
                    .Where(f => f.IsGlobal)
                    .Select(f => new FolderRes
                    {
                        Id = f.Id,
                        Name = f.Name,
                        CreatedAt = f.CreatedAt,
                        IsGlobal = f.IsGlobal
                    })
                    .ToListAsync();

                return ServiceResult<List<FolderRes>>.Ok(folders);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get global folders");
                return ServiceResult<List<FolderRes>>.Fail("Failed to get folders");
            }
        }

        public async Task<ServiceResult<List<FolderRes>>> GetAllFolderDocumentAsync(Guid documentId)
        {
            try
            {
                var folders = await _context.DocumentFiles
                    .AsNoTracking()
                    .Where(df => df.DocumentId == documentId && df.FolderId != null)
                    .Select(df => df.Folder!)
                    .GroupBy(f => new { f.Id, f.Name, f.CreatedAt, f.IsGlobal })
                    .Select(g => new FolderRes
                    {
                        Id = g.Key.Id,
                        Name = g.Key.Name,
                        CreatedAt = g.Key.CreatedAt,
                        IsGlobal = g.Key.IsGlobal
                    })
                    .ToListAsync();

                return ServiceResult<List<FolderRes>>.Ok(folders);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get document folders");
                return ServiceResult<List<FolderRes>>.Fail("Failed to get folders");
            }
        }

        public async Task<ServiceResult<FolderDownloadRes>> DownloadFolderAsync(Guid folderId)
        {
            try
            {
                var folder = await _context.Folders
                    .AsNoTracking()
                    .FirstOrDefaultAsync(x => x.Id == folderId);

                if (folder == null)
                {
                    return ServiceResult<FolderDownloadRes>.Fail("Folder not found");
                }

                var files = await _context.ProofFiles
                    .AsNoTracking()
                    .Where(x => x.FolderId == folderId)
                    .ToListAsync();

                if (files.Count == 0)
                {
                    return ServiceResult<FolderDownloadRes>.Fail("Folder is empty");
                }

                using var zipStream = new MemoryStream();

                using (var archive = new ZipArchive(zipStream, ZipArchiveMode.Create, true))
                {
                    foreach (var file in files)
                    {
                        byte[] decryptedData;

                        try
                        {
                            decryptedData = DecryptFile(file.Data);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Failed to decrypt proof file {FileId}", file.Id);
                            return ServiceResult<FolderDownloadRes>.Fail("Failed to decrypt file");
                        }

                        var entry = archive.CreateEntry(file.FileName, CompressionLevel.Fastest);

                        await using var entryStream = entry.Open();
                        await entryStream.WriteAsync(decryptedData);
                    }
                }

                return ServiceResult<FolderDownloadRes>.Ok(new FolderDownloadRes
                {
                    FileName = $"{folder.Name}.zip",
                    ContentType = "application/zip",
                    Data = zipStream.ToArray()
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to download folder {FolderId}", folderId);
                return ServiceResult<FolderDownloadRes>.Fail("Failed to download folder");
            }
        }
    }
}