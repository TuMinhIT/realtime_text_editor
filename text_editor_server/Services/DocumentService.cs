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

		//lấy snapshot của document
		public async Task<ServiceResult<DocumentSnapshot>> GetDocumentSnapshotAsync(Guid documentId)
		{
			var content = await _context.DocumentSnapshots
				.AsNoTracking()
				.Where(d => d.DocumentId == documentId)
				.FirstOrDefaultAsync();

			return ServiceResult<DocumentSnapshot>.Ok(content);
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

				//Kiểm thử ghép section:
			////	var sections = await _context.Sections
			//		.Where(s => s.DocumentId == documentId)
			//		.OrderBy(s => s.OrderIndex)
			//		.ToListAsync();

				//Sfdt gốc ban đầu:
			//	var originalSfdt = JObject.Parse(newContent);

				//Gọi hàm rebuild lại:
				//var rebuiltSfdt = _sectionParser.RebuildSfdt(sections, originalSfdt);


				//log thử kq để so sánh kết quả sơ bộ:
			//	_logger.LogInformation("Rebuilt SFDT: {RebuiltSfdt}", rebuiltSfdt);

				
     //           //So sánh JSON:
     //           var isEqual = JToken.DeepEquals(
					//JObject.Parse(newContent),
					//JObject.Parse(rebuiltSfdt)
     //           );

				// logger.LogInformation("Is original SFDT equal to rebuilt SFDT? {IsEqual}", isEqual);

				//Xuất file để kiểm thử thủ công:
				//await _sectionParser.ExportDebugFiles(documentId, newContent);
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



        public async Task RebuildFromSectionAsync(Guid sectionId)
        {
            // =========================
            // 1. LOAD SECTION
            // =========================
            var section = await _context.Sections
                .FirstOrDefaultAsync(s => s.Id == sectionId);

            if (section == null)
                return;

            // =========================
            // 2. LOAD SNAPSHOT
            // =========================
            var snapshot = await _context.DocumentSnapshots
                .FirstOrDefaultAsync(x => x.DocumentId == section.DocumentId);

            if (snapshot == null)
                return;

            // =========================
            // 3. PARSE SFDT
            // =========================
            var sfdt = JObject.Parse(snapshot.JsonContent);

            var secArray = sfdt["sec"] as JArray;

            if (secArray == null)
                return;

            // =========================
            // 4. LOAD SECTION BLOCKS
            // =========================
            var sectionObj =
                JObject.Parse(section.Content);

            var sectionBlocks =
                sectionObj["b"] as JArray;

            if (sectionBlocks == null)
                return;

            // =========================
            // 5. RANGE VALIDATION
            // =========================
            int expectedLength =
                section.EndIndex - section.StartIndex + 1;

            if (expectedLength != sectionBlocks.Count)
            {
                throw new Exception(
                    $"Section range mismatch. " +
                    $"Expected: {expectedLength}, " +
                    $"Actual: {sectionBlocks.Count}");
            }

            // =========================
            // 6. INJECT BLOCKS
            // =========================
            int globalIndex = 0;

            foreach (var sec in secArray)
            {
                var blocks = sec?["b"] as JArray;

                if (blocks == null)
                    continue;

                for (int i = 0; i < blocks.Count; i++)
                {
                    if (globalIndex >= section.StartIndex &&
                        globalIndex <= section.EndIndex)
                    {
                        int localIndex =
                            globalIndex - section.StartIndex;

                        blocks[i] =
                            sectionBlocks[localIndex]
                                .DeepClone();
                    }

                    globalIndex++;
                }
            }

            // =========================
            // 7. SAVE SNAPSHOT
            // =========================
            snapshot.JsonContent =
                sfdt.ToString(Formatting.None);

            await _context.SaveChangesAsync();
        }
       
    }
}
