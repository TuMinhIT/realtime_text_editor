using DocumentFormat.OpenXml.Office2010.Word;
using DocumentFormat.OpenXml.Spreadsheet;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Syncfusion.EJ2.DocumentEditor;
using text_editor_server.Data;
using text_editor_server.DTOs.res;
using text_editor_server.Entities;
namespace text_editor_server.Services
{
	public class DocumentService
	{
		private readonly AppDbContext _context;
		private readonly DocxParsingService _docxParsingService;
		private readonly ILogger<DocumentService> _logger;
        private readonly SectionParser _sectionParser;

        public DocumentService(AppDbContext context, DocxParsingService docxParsingService, ILogger<DocumentService> logger, SectionParser sectionParser)
		{
			_context = context;
			_docxParsingService = docxParsingService;
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
                string sfdtJson = await HelperFunc.ConvertDocxToSfdtAsync(file);

                // ======================
                // Save DB
                // ======================
                var document = new Document
                {
                    Id = Guid.NewGuid(),
                    Title = string.IsNullOrWhiteSpace(title)
                        ? Path.GetFileNameWithoutExtension(file.FileName)
                        : title.Trim(),
                    JsonContent = "no content it saved in snapshot",
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


       

		public async Task<ServiceResult<BlockPermissionRes>> AssignUserToBlockAsync(Guid sectionId, Guid userId, PermissionLevel permission)
		{
			//var sectionExists = await _context.Sections.AnyAsync(s => s.Id == sectionId);
			//if (!sectionExists)
			//{
			//	return ServiceResult<BlockPermissionRes>.Fail("Block not found");
			//}

			//var user = await _context.Users
			//	.AsNoTracking()
			//	.FirstOrDefaultAsync(u => u.Id == userId);

			//if (user == null)
			//{
			//	return ServiceResult<BlockPermissionRes>.Fail("User not found");
			//}

			//var assignment = await _context.SectionUsers
			//	.FirstOrDefaultAsync(su => su.SectionId == sectionId && su.UserId == userId);

			//if (assignment == null)
			//{
			//	assignment = new SectionPermission
			//	{
			//		Id = Guid.NewGuid(),
			//		SectionId = sectionId,
			//		UserId = userId,
			//		Permission = permission,
			//		AssignedAt = DateTime.UtcNow
			//	};
			//	_context.SectionUsers.Add(assignment);
			//}
			//else
			//{
			//	assignment.Permission = permission;
			//	assignment.AssignedAt = DateTime.UtcNow;
			//}

			//await _context.SaveChangesAsync();

			//return ServiceResult<BlockPermissionRes>.Ok(new BlockPermissionRes
			//{
			//	SectionId = sectionId,
			//	UserId = userId,
			//	UserEmail = user.Email,
			//	Permission = permission.ToString(),
			//	AssignedAt = assignment.AssignedAt
			//});
			return null;
		}

		public async Task<ServiceResult<bool>> RemoveUserFromBlockAsync(Guid sectionId, Guid userId)
		{
			//var assignment = await _context.SectionUsers
			//	.FirstOrDefaultAsync(su => su.SectionId == sectionId && su.UserId == userId);

			//if (assignment == null)
			//{
			//	return ServiceResult<bool>.Fail("Permission assignment not found");
			//}

			//_context.SectionUsers.Remove(assignment);
			//await _context.SaveChangesAsync();

			return ServiceResult<bool>.Ok(true);
		}

		public async Task<ServiceResult<List<BlockPermissionRes>>> GetBlockUsersAsync(Guid sectionId)
		{
			var sectionExists = await _context.Sections.AnyAsync(s => s.Id == sectionId);
			if (!sectionExists)
			{
				return ServiceResult<List<BlockPermissionRes>>.Fail("Block not found");
			}

			//var users = await _context.SectionUsers
			//	.Where(su => su.SectionId == sectionId)
			//	.Join(
			//		_context.Users,
			//		su => su.UserId,
			//		u => u.Id,
			//		(su, u) => new BlockPermissionRes
			//		{
			//			SectionId = su.SectionId,
			//			UserId = su.UserId,
			//			UserEmail = u.Email,
			//			Permission = su.Permission.ToString(),
			//			AssignedAt = su.AssignedAt
			//		})
			//	.ToListAsync();

			return ServiceResult<List<BlockPermissionRes>>.Ok(null);
		}


        public async Task<ServiceResult<DocumentSnapshot>>
            GetDocumentContentAsync(Guid documentId)
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
        public async Task<bool> updateContentAsync(Guid documentId, string newContent)
        {
            try
            {             
                var documentSnapshot = await _context.DocumentSnapshots
                    .FirstOrDefaultAsync(ds => ds.DocumentId == documentId);

                if (documentSnapshot != null)
                {
                    documentSnapshot.JsonContent= newContent;


                }
                await _context.SaveChangesAsync();
				
				await _sectionParser.ParseNow(documentId);


                //Thêm cập nhật đã sửa ban đầu:
                var document = await _context.Documents
    .FirstOrDefaultAsync(d => d.Id == documentId);

                if (document != null)
                {
                    document.HasParsedSections = true;
                }

                await _context.SaveChangesAsync();

                //END TEST
                return true;

            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to update content for document {documentId}");
                return false;
            }
        }


        //Update JSONCONTENT khi cập nhật section:
        public async Task<string> MergeAllSectionsAsync(Guid documentId)
        {
            var snapshot = await _context.DocumentSnapshots
                .FirstOrDefaultAsync(x => x.DocumentId == documentId);

            if (snapshot == null)
                return "";

            var originalSfdt =
                JObject.Parse(snapshot.JsonContent);

            var secArray =
                originalSfdt["sec"] as JArray;

            if (secArray == null || secArray.Count == 0)
                return "";

            var allBlocks = new JArray();

            var sections = await _context.Sections
                .Where(x => x.DocumentId == documentId)
                .OrderBy(x => x.OrderIndex)
                .ToListAsync();

            foreach (var section in sections)
            {
                if (string.IsNullOrWhiteSpace(section.Content))
                    continue;

                var obj = JObject.Parse(section.Content);

                var blocks = obj["b"] as JArray;

                if (blocks == null)
                    continue;

                foreach (var b in blocks)
                {
                    allBlocks.Add(b.DeepClone());
                }
            }

            var firstSec = secArray[0] as JObject;

            if (firstSec != null)
            {
                firstSec["b"] = allBlocks;
            }

            // clear remaining sec
            for (int i = 1; i < secArray.Count; i++)
            {
                if (secArray[i] is JObject s)
                {
                    s["b"] = new JArray();
                }
            }

            return originalSfdt.ToString(Formatting.None);
        }
    }
}
