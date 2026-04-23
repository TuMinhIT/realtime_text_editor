using Microsoft.EntityFrameworkCore;
using text_editor_server.Data;
using text_editor_server.DTOs.res;
using text_editor_server.Entities;

namespace text_editor_server.Services
{


	public class DocumentService
	{
		private readonly AppDbContext _context;
		private readonly IDocxParsingService _docxParsingService;
		private readonly ILogger<DocumentService> _logger;

		public DocumentService(AppDbContext context, IDocxParsingService docxParsingService, ILogger<DocumentService> logger)
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
						Content = d.Content,
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
								IsActive = d.Creator.IsActive,
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

        public async Task<ServiceResult<DocumentUploadRes>> UploadDocumentAsync(IFormFile? file, string? title, Guid currentUserId)
		{
			if (file == null || file.Length == 0)
			{
				return ServiceResult<DocumentUploadRes>.Fail("File is required");
			}

			if (!Path.GetExtension(file.FileName).Equals(".docx", StringComparison.OrdinalIgnoreCase))
			{
				return ServiceResult<DocumentUploadRes>.Fail("Only .docx files are supported");
			}

			try
			{
				await using var stream = new MemoryStream();
				await file.CopyToAsync(stream);
				stream.Position = 0;

				var parseResult = await _docxParsingService.ParseDocxAsync(stream);

				var document = new Document
				{
					Id = Guid.NewGuid(),
					Title = string.IsNullOrWhiteSpace(title) ? Path.GetFileNameWithoutExtension(file.FileName) : title.Trim(),
					Content = parseResult.plainText,
					SourceFilePath = file.FileName,
					CreatedBy = currentUserId,
					CreatedAt = DateTime.UtcNow
				};

				_context.Documents.Add(document);

				var sections = parseResult.sections;
				if (sections.Count == 0)
				{
					sections.Add(new Section
					{
						Id = Guid.NewGuid(),
						Name = "1",
						Content = parseResult.plainText,
						DocumentId = document.Id,
						Version = 0,
						Timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
					});
				}

				for (var i = 0; i < sections.Count; i++)
				{
					sections[i].Id = sections[i].Id == Guid.Empty ? Guid.NewGuid() : sections[i].Id;
					sections[i].DocumentId = document.Id;
					sections[i].Timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
					sections[i].Version = 0;
				}

				_context.Sections.AddRange(sections);

				var ownerAssignments = sections.Select(s => new SectionUser
				{
					Id = Guid.NewGuid(),
					SectionId = s.Id,
					UserId = currentUserId,
					Permission = PermissionLevel.Admin,
					AssignedAt = DateTime.UtcNow
				});

				_context.SectionUsers.AddRange(ownerAssignments);

				await _context.SaveChangesAsync();

				var response = new DocumentUploadRes
				{
					DocumentId = document.Id,
					Title = document.Title,
					Blocks = sections.Select((s, index) => new DocumentBlockItemRes
					{
						SectionId = s.Id,
						Name = s.Name,
						Order = index + 1,
						Preview = s.Content.Length > 200 ? s.Content[..200] : s.Content
					}).ToList()
				};

				return ServiceResult<DocumentUploadRes>.Ok(response);
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Failed to upload docx for user {UserId}", currentUserId);
				return ServiceResult<DocumentUploadRes>.Fail("Failed to parse and save document");
			}
		}

		public async Task<DocumentBlocksRes?> GetDocumentBlocksAsync(Guid documentId)
		{
			var document = await _context.Documents
				.AsNoTracking()
				.Where(d => d.Id == documentId)
				.Select(d => new DocumentBlocksRes
				{
					DocumentId = d.Id,
					Title = d.Title,
					Blocks = d.Sections
						.OrderBy(s => s.Name)
						.Select((s, index) => new DocumentBlockItemRes
						{
							SectionId = s.Id,
							Name = s.Name,
							Order = index + 1,
							//mở này ra
							//Preview = s.Content.Length > 200 ? s.Content[..200] : s.Content
						}).ToList()
				})
				.FirstOrDefaultAsync();

			return document;
		}

		public async Task<ServiceResult<BlockPermissionRes>> AssignUserToBlockAsync(Guid sectionId, Guid userId, PermissionLevel permission)
		{
			var sectionExists = await _context.Sections.AnyAsync(s => s.Id == sectionId);
			if (!sectionExists)
			{
				return ServiceResult<BlockPermissionRes>.Fail("Block not found");
			}

			var user = await _context.Users
				.AsNoTracking()
				.FirstOrDefaultAsync(u => u.Id == userId);

			if (user == null)
			{
				return ServiceResult<BlockPermissionRes>.Fail("User not found");
			}

			var assignment = await _context.SectionUsers
				.FirstOrDefaultAsync(su => su.SectionId == sectionId && su.UserId == userId);

			if (assignment == null)
			{
				assignment = new SectionUser
				{
					Id = Guid.NewGuid(),
					SectionId = sectionId,
					UserId = userId,
					Permission = permission,
					AssignedAt = DateTime.UtcNow
				};
				_context.SectionUsers.Add(assignment);
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

		public async Task<ServiceResult<bool>> RemoveUserFromBlockAsync(Guid sectionId, Guid userId)
		{
			var assignment = await _context.SectionUsers
				.FirstOrDefaultAsync(su => su.SectionId == sectionId && su.UserId == userId);

			if (assignment == null)
			{
				return ServiceResult<bool>.Fail("Permission assignment not found");
			}

			_context.SectionUsers.Remove(assignment);
			await _context.SaveChangesAsync();

			return ServiceResult<bool>.Ok(true);
		}

		public async Task<ServiceResult<List<BlockPermissionRes>>> GetBlockUsersAsync(Guid sectionId)
		{
			var sectionExists = await _context.Sections.AnyAsync(s => s.Id == sectionId);
			if (!sectionExists)
			{
				return ServiceResult<List<BlockPermissionRes>>.Fail("Block not found");
			}

			var users = await _context.SectionUsers
				.Where(su => su.SectionId == sectionId)
				.Join(
					_context.Users,
					su => su.UserId,
					u => u.Id,
					(su, u) => new BlockPermissionRes
					{
						SectionId = su.SectionId,
						UserId = su.UserId,
						UserEmail = u.Email,
						Permission = su.Permission.ToString(),
						AssignedAt = su.AssignedAt
					})
				.ToListAsync();

			return ServiceResult<List<BlockPermissionRes>>.Ok(users);
		}
	}



}
