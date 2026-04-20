using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using text_editor_server.Data;
using text_editor_server.Entities;
using text_editor_server.Services;

namespace text_editor_server.Controllers
{
    [ApiController]
    [Route("api/[controller]")] 
    public class SectionsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IDocxParsingService _docxService;
        private readonly ILogger<SectionsController> _logger;

        public SectionsController(AppDbContext context, IDocxParsingService docxService, ILogger<SectionsController> logger)
        {
            _context = context;
            _docxService = docxService;
            _logger = logger;
        }

        /// <summary>
        /// Upload .docx file and create document with sections
        /// </summary>
        [HttpPost("upload")]
        public async Task<IActionResult> UploadDocument(IFormFile file, [FromForm] string documentName)
        {
            try
            {
                if (file == null || file.Length == 0)
                    return BadRequest("File is required");

                if (!file.FileName.EndsWith(".docx", StringComparison.OrdinalIgnoreCase))
                    return BadRequest("Only .docx files are supported");

                // Parse .docx file
                using (var stream = file.OpenReadStream())
                {
                    var (sections, plainText) = await _docxService.ParseDocxAsync(stream);

                    if (sections.Count == 0)
                        return BadRequest("Document contains no sections");

                    // Get current user ID (in production, extract from JWT token)

                    //T mock test id ở đây Tú gray
                    var Test_user = await _context.Users.FirstOrDefaultAsync(); // Replace with actual user retrieval logic
                    if (Test_user == null)
                    {
                        return BadRequest("No users found in the database. Please seed users before uploading documents.");

                    }
                    var userId = Test_user.Id;

                    // Create document
                    var document = new Document
                    {
                        Id = Guid.NewGuid(),
                        Title = documentName ?? file.FileName,
                        CreatedBy = userId,
                        CreatedAt = DateTime.UtcNow,
                        SourceFilePath = file.FileName
                    };

                    // Set document ID for sections
                    foreach (var section in sections)
                    {
                        section.DocumentId = document.Id;
                    }

                    _context.Documents.Add(document);
                    _context.Sections.AddRange(sections);

                    await _context.SaveChangesAsync();

                    return Ok(new
                    {
                        documentId = document.Id,
                        documentTitle = document.Title,
                        sectionsCount = sections.Count,
                        sections = sections.Select(s => new { s.Id, s.Name })
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error uploading document: {ex.Message}");
                return StatusCode(500, "Failed to upload document");
            }
        }

        /// <summary>
        /// Get all sections for a document
        /// </summary>
        [HttpGet("{docId}/sections")]
        public async Task<IActionResult> GetSections(Guid docId)
        {
            try
            {
                var sections = await _context.Sections
                    .Where(x => x.DocumentId == docId)
                    .Select(s => new
                    {
                        s.Id,
                        s.Name,
                        s.Version,
                        ContentPreview = s.Content.Length > 100 ? s.Content.Substring(0, 100) + "..." : s.Content
                    })
                    .ToListAsync();

                return Ok(sections);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting sections: {ex.Message}");
                return StatusCode(500, "Failed to get sections");
            }
        }

        /// <summary>
        /// Get section details
        /// </summary>
        [HttpGet("section/{sectionId}")]
        public async Task<IActionResult> GetSection(Guid sectionId)
        {
            try
            {
                var section = await _context.Sections
                    .Include(s => s.Assignments)
                    .FirstOrDefaultAsync(s => s.Id == sectionId);

                if (section == null)
                    return NotFound();

                return Ok(new
                {
                    section.Id,
                    section.Name,
                    section.Content,
                    section.Version,
                    AssignedUsers = section.Assignments.Select(a => new { a.UserId, a.Permission })
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting section: {ex.Message}");
                return StatusCode(500, "Failed to get section");
            }
        }

        /// <summary>
        /// Update section content (used for non-real-time updates)
        /// </summary>
        [HttpPost("section/update")]
        public async Task<IActionResult> UpdateSection([FromBody] UpdateSectionRequest dto)
        {
            try
            {
                var section = await _context.Sections.FindAsync(dto.SectionId);

                if (section == null)
                    return NotFound();

                section.Content = dto.Content;
                section.Version++;

                await _context.SaveChangesAsync();

                return Ok(new { section.Id, section.Version, section.Content });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating section: {ex.Message}");
                return StatusCode(500, "Failed to update section");
            }
        }

        /// <summary>
        /// Assign user to section with permission level
        /// </summary>
        [HttpPost("assign-user")]
        public async Task<IActionResult> AssignUserToSection([FromBody] AssignUserRequest dto)
        {
            try
            {
                var existingAssignment = await _context.SectionUsers
                    .FirstOrDefaultAsync(su => su.SectionId == dto.SectionId && su.UserId == dto.UserId);

                if (existingAssignment != null)
                {
                    existingAssignment.Permission = dto.Permission;
                }
                else
                {
                    var assignment = new SectionUser
                    {
                        Id = Guid.NewGuid(),
                        SectionId = dto.SectionId,
                        UserId = dto.UserId,
                        Permission = dto.Permission,
                        AssignedAt = DateTime.UtcNow
                    };

                    _context.SectionUsers.Add(assignment);
                }

                await _context.SaveChangesAsync();
                return Ok("User assigned to section");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error assigning user: {ex.Message}");
                return StatusCode(500, "Failed to assign user");
            }
        }

        /// <summary>
        /// Get users assigned to a section
        /// </summary>
        [HttpGet("section/{sectionId}/users")]
        public async Task<IActionResult> GetSectionUsers(Guid sectionId)
        {
            try
            {
                var users = await _context.SectionUsers
                    .Where(su => su.SectionId == sectionId)
                    .Include(su => su.User)
                    .Select(su => new
                    {
                        su.UserId,
                        su.User.FullName,
                        su.User.Email,
                        su.Permission,
                        su.AssignedAt
                    })
                    .ToListAsync();

                return Ok(users);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting section users: {ex.Message}");
                return StatusCode(500, "Failed to get section users");
            }
        }

        /// <summary>
        /// Remove user from section
        /// </summary>
        [HttpDelete("section/{sectionId}/user/{userId}")]
        public async Task<IActionResult> RemoveUserFromSection(Guid sectionId, Guid userId)
        {
            try
            {
                var assignment = await _context.SectionUsers
                    .FirstOrDefaultAsync(su => su.SectionId == sectionId && su.UserId == userId);

                if (assignment == null)
                    return NotFound();

                _context.SectionUsers.Remove(assignment);
                await _context.SaveChangesAsync();

                return Ok("User removed from section");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error removing user: {ex.Message}");
                return StatusCode(500, "Failed to remove user");
            }
        }
    }

    // Request DTOs
    public class UpdateSectionRequest
    {
        public Guid SectionId { get; set; }
        public string Content { get; set; }
    }

    public class AssignUserRequest
    {
        public Guid SectionId { get; set; }
        public Guid UserId { get; set; }
        public PermissionLevel Permission { get; set; }
    }
}

