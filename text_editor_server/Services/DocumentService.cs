using DocumentFormat.OpenXml.Spreadsheet;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
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

		public DocumentService(AppDbContext context, DocxParsingService docxParsingService, ILogger<DocumentService> logger)
		{
			_context = context;
			_docxParsingService = docxParsingService;
			_logger = logger;
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



                // ======================
                // CẦN CHUYỂN ĐỔI CHẠY BACKGROUND
                // Parse sections
                // ======================
                //stream.Position = 0;
                //var (sections, plainText) =
                //    await _docxParsingService.ParseDocxAsync(stream);

                //var sectionsList = sections ?? new List<Section>();

                //// ======================
                //// Default section
                //// ======================
                //if (!sectionsList.Any())
                //{
                //    sectionsList.Add(new Section
                //    {
                //        Id = Guid.NewGuid(),
                //        Title = "1", // Mặc định là cấp 1
                //        JsonContent = plainText ?? "",
                //        DocumentId = document.Id,
                //        Version = 0,
                //        Timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
                //    });
                //}

                //foreach (var section in sectionsList)
                //{
                //    if (section.Id == Guid.Empty)
                //        section.Id = Guid.NewGuid();

                //    section.DocumentId = document.Id;
                //    section.Version = 0;
                //    section.Timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
                //}

                //// Lưu các section (tất cả các cấp để hiển thị UI)
                //_context.Sections.AddRange(sectionsList);

                //// ======================
                //// Phân quyền: CHỈ ÁP DỤNG MẶC ĐỊNH CHO HEADING CẤP 2
                //// (Cấp 2 có Title dạng "1.1", "2.1" -> Sẽ bị cắt bởi dấu '.' thành mảng 2 phần tử)
                //// ======================
                //var permissions = sectionsList
                //    .Where(s => s.Title.Split('.').Length == 2)
                //    .Select(s => new SectionPermission
                //    {
                //        Id = Guid.NewGuid(),
                //        SectionId = s.Id,
                //        UserId = currentUserId,
                //        Permission = PermissionLevel.Admin,
                //        AssignedAt = DateTime.UtcNow
                //    });

                //_context.SectionPermissions.AddRange(permissions);
                
                //// Commit tất cả xuống database
                //await _context.SaveChangesAsync();



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
                // Tìm DocumentSnapshot tương ứng
                var documentSnapshot = await _context.DocumentSnapshots
                    .FirstOrDefaultAsync(ds => ds.DocumentId == documentId);

                if (documentSnapshot != null)
                {
                    documentSnapshot.JsonContent= newContent;
                    documentSnapshot.Version += 1; // Tăng version khi có cập nhật nội dung
                    documentSnapshot.Timestamp = DateTime.UtcNow; 
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

    }



}
