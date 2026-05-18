using DocumentFormat.OpenXml.Office2010.Word;
using DocumentFormat.OpenXml.Spreadsheet;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

using text_editor_server.Data;
using text_editor_server.DTOs.res;
using text_editor_server.Entities;
namespace text_editor_server.Services
{
	public class DocumentService
	{
		private readonly AppDbContext _context;
	
		private readonly ILogger<DocumentService> _logger;
        private readonly SectionParser _sectionParser;

        public DocumentService(AppDbContext context, ILogger<DocumentService> logger, SectionParser sectionParser)
		{
			_context = context;
            _logger = logger;
			_sectionParser = sectionParser;
			
		}

        public async Task<List<DocumentRes>?> GetAllDocumentAsync()
        {
			try
			{
				var documents = await _context.Documents
					.AsNoTracking()
					.Select(d => new DocumentRes
					{
						Id = d.Id,
						Title = d.Title,					
						SourceFilePath = d.SourceFilePath,
						CreatedBy = d.CreatedBy,
						CreatedAt = d.CreatedAt,
						Creator = d.Creator == null
							? null
							: new UserRes
							{
								Id = d.Creator.Id,
								Email = d.Creator.Email,
								FullName = d.Creator.FullName,
								CreatedAt = d.Creator.CreatedAt,								
								Role = d.Creator.Role
							}
					})
					.ToListAsync();

				return documents;
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Failed to get documents");
				return null;
			}		
        }

        public async Task<bool> RemoveDocumentAsync(Guid id)
        {
            try
            {
                var document = await _context.Documents.FindAsync(id);

                if (document == null)
                    return false;

                _context.Documents.Remove(document);
                await _context.SaveChangesAsync();

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to remove document");
                return false;
            }
        }


        public async Task<bool> UpdateDocumentStatusAsync(Guid id, bool isActive)
        {
            try
            {
                var document = await _context.Documents.FindAsync(id);

                if (document == null)
                    return false;

                document.isActive = isActive;   
                await _context.SaveChangesAsync();

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to update document status");
                return false;
            }
        }


        public async Task<ServiceResult<DocumentUploadRes>> UploadDocumentAsync(
		   IFormFile? file,
		   string? title,
		   Guid currentUserId)
        {
            if (file == null || file.Length == 0)
                return ServiceResult<DocumentUploadRes>.Fail("File is required");

            if (!Path.GetExtension(file.FileName)
                .Equals(".docx", StringComparison.OrdinalIgnoreCase))
                return ServiceResult<DocumentUploadRes>.Fail("Only .docx files are supported");

            try
            {
                // ======================
                // Gọi helper convert DOCX -> SFDT JSON
                // ======================
                string sfdtJson = await SyncfusionHelper.ConvertSFDT(file);

                // ======================
                // Save DB
                // ======================
                var document = new Document
                {
                    Id = Guid.NewGuid(),
                    Title = string.IsNullOrWhiteSpace(title)
                        ? Path.GetFileNameWithoutExtension(file.FileName)
                        : title.Trim(),
                  
                    SourceFilePath = file.FileName,
                    CreatedBy = currentUserId,
                    CreatedAt = DateTime.UtcNow
                };
                
                var documentSnapshot = new DocumentSnapshot
                {
                    Id = Guid.NewGuid(),
                    Title = document.Title,
                    JsonContent = sfdtJson,
                    DocumentId = document.Id,
                    Version = 0,
                };


                _context.Documents.Add(document);
                await _context.SaveChangesAsync();
                _context.DocumentSnapshots.Add(documentSnapshot);
                await _context.SaveChangesAsync();


                return ServiceResult<DocumentUploadRes>.Ok(
                    new DocumentUploadRes
                    {
                        DocumentId = document.Id,
                        Title = document.Title,
                        
                    });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Upload failed");
                return ServiceResult<DocumentUploadRes>.Fail("Upload failed");
            }
        }

		public async Task<ServiceResult<List<BlockPermissionRes>>> GetBlockUsersAsync(Guid sectionId)
		{
			var sectionExists = await _context.Sections.AnyAsync(s => s.Id == sectionId);
			if (!sectionExists)
			{
				return ServiceResult<List<BlockPermissionRes>>.Fail("Block not found");
			}

			

			return ServiceResult<List<BlockPermissionRes>>.Ok(null);
		}

        //NoFillEmpty usege
        public async Task<ServiceResult<DocumentSnapshot>>
            GetDocumentContentAsyncNo(Guid documentId)
        {
            try
            {
                var snapshot = await _context.DocumentSnapshots
                    .AsNoTracking()
                    .FirstOrDefaultAsync(x => x.DocumentId == documentId);

                if (snapshot == null)
                {
                    return ServiceResult<DocumentSnapshot>
                        .Fail("Document snapshot not found");
                }

                // check đã parse section chưa
                var hasSections = await _context.Sections
                    .AsNoTracking()
                    .AnyAsync(x => x.DocumentId == documentId);

                // ==========================
                // CASE 1: upload lần đầu
                // chưa có section
                // => dùng snapshot gốc
                // ==========================
                if (!hasSections)
                {
                    return ServiceResult<DocumentSnapshot>
                        .Ok(snapshot);
                }

                // ==========================
                // CASE 2: đã parse section
                // => merge từ sections
                // ==========================
                var mergedSfdt =
                    await MergeAllSectionsAsync(documentId);

                snapshot.JsonContent = mergedSfdt;

                return ServiceResult<DocumentSnapshot>
                    .Ok(snapshot);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Failed to get document content");

                return ServiceResult<DocumentSnapshot>
                    .Fail("Failed to get document");
            }
        }


        public async Task<ServiceResult<DocumentRes>>
        GetDocumentDetailAsync(Guid documentId)
        {
            try
            {
                Document document = await _context.Documents
                   .AsNoTracking()
                   .FirstOrDefaultAsync(x => x.Id == documentId);
                if (document == null)
                {
                    return ServiceResult<DocumentRes>
                        .Fail("Document not found");
                }

                //kiểm tra nếu có thay đổi thì merger
                if (document.hasChanges)
                {
                    // => merge từ sections tạo thành jsonContent mới
                    // không cần hứng,
                    await MergeAllSectionsAsync(documentId);                     
                }
              

                var snapshot = await _context.DocumentSnapshots
                    .AsNoTracking()
                    .FirstOrDefaultAsync(x => x.DocumentId == documentId);

                if (snapshot == null)
                {
                    return ServiceResult<DocumentRes>
                        .Fail("Document snapshot not found");
                }

                var result = new DocumentRes
                {
                    Id = document.Id,
                    Title = document.Title,
                    isActive= document.isActive,
                    hasChanges= document.hasChanges,
                    JsonContent = snapshot.JsonContent,
                    CreatedAt = document.CreatedAt,
                    SourceFilePath = document.SourceFilePath,
                    Version = snapshot.Version,
                };
                return ServiceResult<DocumentRes>
                    .Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Failed to get document content");

                return ServiceResult<DocumentRes>
                    .Fail("Failed to get document content");
            }
        }

        // update title document
        public async Task<bool> updateTitleAsync(Guid documentId, string title)
        {
            try
            {
                // Tìm Document chính
                var document = await _context.Documents
                    .FirstOrDefaultAsync(d => d.Id == documentId);

                if (document == null)
                    return false;

                // Cập nhật title cho Document
                document.Title = title;

                // Tìm DocumentSnapshot tương ứng
                var documentSnapshot = await _context.DocumentSnapshots
                    .FirstOrDefaultAsync(ds => ds.DocumentId == documentId);

                // Cập nhật title cho Snapshot nếu tồn tại
                if (documentSnapshot != null)
                {
                    documentSnapshot.Title = title;
                }

                // Lưu thay đổi vào DB
                await _context.SaveChangesAsync();

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to update title for document {documentId}");
                return false;
            }
        }


        // update json content
        public async Task<ServiceResult<DocumentSnapshot>> updateContentAsync(Guid documentId, string newContent)
        {
            try
            {                            
                Document document = await _context.Documents
                    .FirstOrDefaultAsync(d => d.Id == documentId);
        
                if (document == null || document.isActive ) {

                    return ServiceResult<DocumentSnapshot>.Fail("Document is active, you must block user edit ");
                } 

               DocumentSnapshot documentSnapshot = await _context.DocumentSnapshots
              .FirstOrDefaultAsync(ds => ds.DocumentId == documentId);


                if (documentSnapshot == null || document == null)
                    return ServiceResult<DocumentSnapshot>.Fail("Document or snapshot not found");

                //  update snapshot
                documentSnapshot.JsonContent = newContent;
       
          
                await _sectionParser.ParseNow(documentId);
                _logger.LogInformation($"Parsed sections for document {documentId} after first upload");
               
                documentSnapshot.Version += 1;

                await _context.SaveChangesAsync();

                return ServiceResult<DocumentSnapshot>.Ok(documentSnapshot);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to update content for document {documentId}");
                return ServiceResult<DocumentSnapshot>.Fail("Failed to update content");
            }
        }

        // func merger section thành 1 jsonContent hoàn chỉnh
        private async Task<string> MergeAllSectionsAsync(Guid documentId)
        {
            var snapshot = await _context.DocumentSnapshots

                .FirstOrDefaultAsync(x => x.DocumentId == documentId);

            if (snapshot == null ||
                string.IsNullOrWhiteSpace(snapshot.JsonContent))
            {
                return "";
            }

            JObject originalSfdt;

            try
            {
                originalSfdt =
                    JObject.Parse(snapshot.JsonContent);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Invalid snapshot SFDT for document {DocumentId}",
                    documentId);

                return "";
            }

            // sec array
            var secArray =
                originalSfdt["sec"] as JArray;

            if (secArray == null ||
                secArray.Count == 0)
            {
                return originalSfdt.ToString(
                    Formatting.None);
            }

            // collect all blocks
            var allBlocks = new JArray();

            // collect merged images
            var mergedImgs = new JObject();

            var sections = await _context.Sections
                .AsNoTracking()
                .Where(x => x.DocumentId == documentId)
                .OrderBy(x => x.OrderIndex)
                .ToListAsync();

            foreach (var section in sections)
            {
                if (string.IsNullOrWhiteSpace(section.Content))
                    continue;

                JObject sectionObj;

                try
                {
                    sectionObj =
                        JObject.Parse(section.Content);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(
                        ex,
                        "Invalid section content {SectionId}",
                        section.Id);

                    continue;
                }

                // =====================
                // Merge blocks
                // =====================
                if (sectionObj["b"] is JArray blocks)
                {
                    foreach (var block in blocks)
                    {
                        allBlocks.Add(
                            block.DeepClone());
                    }
                }

                // =====================
                // Merge imgs
                // =====================
                if (sectionObj["imgs"] is JObject imgs)
                {
                    foreach (var prop in imgs.Properties())
                    {
                        // overwrite-safe
                        mergedImgs[prop.Name] =
                            prop.Value.DeepClone();
                    }
                }
            }

            // =====================
            // Replace first section
            // =====================
            if (secArray[0] is JObject firstSec)
            {
                firstSec["b"] = allBlocks;
            }

            // =====================
            // Clear remaining sections
            // tránh duplicate content
            // =====================
            for (int i = 1; i < secArray.Count; i++)
            {
                if (secArray[i] is JObject sec)
                {
                    sec["b"] = new JArray();
                }
            }

            // =====================
            // IMPORTANT FIX
            // replace imgs
            // =====================
            originalSfdt["imgs"] = mergedImgs;

            //Thêm merge
            var mergedSfdt = originalSfdt.ToString(
                Formatting.None);
            //Final Merger SFDT:
            snapshot.JsonContent = mergedSfdt;
            snapshot.Timestamp = DateTime.UtcNow;
            snapshot.Version += 1;

            await _context.SaveChangesAsync();

            return mergedSfdt;
        }
    }
}
