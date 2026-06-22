using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using text_editor_server.Data;
using text_editor_server.DTOs.req;
using text_editor_server.Entities;
using text_editor_server.Services;
using text_editor_server.Services.Helper;


namespace text_editor_server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SectionController : ControllerBase
    {
        private readonly SectionService _sectionService;
        private readonly DocumentService _documentService;
        private readonly SectionParser _sectionParse;
        private readonly HyperlinkTableService _hyperlinkTableService;

        private readonly AppDbContext _context; // Để tạm để test

        public SectionController(SectionService sectionService,
            DocumentService documentService,
            SectionParser sectionParse,
            HyperlinkTableService hyperlinkTableService,
            AppDbContext context)
        {
            _sectionService = sectionService;
            _documentService = documentService;
            _sectionParse = sectionParse;

            _hyperlinkTableService = hyperlinkTableService;
            _context = context;
        }


        //Hàm get tất cả section của một document:
        [HttpGet("document/{documentId:guid}")]
        //[Authorize(Roles = "Admin")
        public async Task<IActionResult> GetAllSectionsByDocument(Guid documentId)
        {
            var result = await _sectionService.GetAllSectionsByDocumentAsync(documentId);
            if (!result.Success)
            {
                return BadRequest(new { message = result.Message });
            }
            return Ok(result.Data);
        }

        //Hàm get một section theo ID và kèm theo quyền chỉnh sửa
        [HttpGet("{sectionID:guid}/user/{userID:guid}")]
        [Authorize]
        public async Task<IActionResult> GetSectionAndPermission(Guid sectionId, Guid userID)
        {
            var result = await _sectionService.GetSectionAndPermissionAsync( userID, sectionId);
            if (!result.Success)
            {
                return BadRequest(new { message = result.Message });
            }
           
            return Ok(result.Data);
        }

        //Hàm get tất cả user có quyền trên một section:
        [HttpGet("{sectionId:guid}/users")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetSectionUsers(Guid sectionId)
        {
            var result = await _sectionService.GetBlockUsersAsync(sectionId);
            if (!result.Success)
            {
                return NotFound(new { message = result.Message });
            }

            return Ok(result.Data);
        }

        //Hàm assign quyền cho user trên một section:
        [HttpPost("assign-user")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AssignUserToSection([FromBody] AssignBlockPermissionReq request)
        {
            if (request == null)
            {
                return BadRequest(new { message = "Request body is required" });
            }

            if (!Enum.IsDefined(typeof(PermissionLevel), request.Permission))
            {
                return BadRequest(new { message = "Invalid permission value" });
            }

            var result = await _sectionService.AssignUserToSectionAsync(request.SectionId, request.UserId, request.Permission);
            if (!result.Success)
            {
                return BadRequest(new { message = result.Message });
            }

            return Ok(result.Data);
        }


        //Hàm remove quyền của user trên một section:
        [HttpDelete("permission/{sectionPermissionId:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> RemoveUserFromSection(Guid sectionPermissionId)
        {
            var result = await _sectionService.RemoveUserFromSectionAsync(sectionPermissionId);
            if (!result.Success)
            {
                return NotFound(new { message = result.Message });
            }

            return Ok(new { message = "User removed from section" });
        }


        //Hàm get section preview:
        [HttpPost("preview-section")]
        public async Task<IActionResult> PreviewSection([FromBody] PreviewSectionReq req)
        {
            if (req == null || req.DocumentId == Guid.Empty)
                return BadRequest("Invalid request");
        
            var result = await _sectionParse.BuildPreviewAsync(
                req.DocumentId,
                req.SectionContent  
            );
                
            if (result == null)
                    return NotFound("Snapshot not found");

            return Ok(new { sfdtContent = result }
            );
        }

        //Hàm get assignment trên 1 section 
        [HttpGet("assignments/{sectionId:guid}")]
        public async Task<IActionResult> GetSectionAssignments(Guid sectionId)
        {
            var assignment = await _sectionService.GetSectionPermissionsAsync(sectionId);
            return Ok(assignment);
            
        }

        //Hàm get assignment trên 1 section 
        [HttpGet("user/{userId:guid}/section/{sectionId:guid}")]
        [Authorize]
        public async Task<IActionResult> GetUserAssignmentOnSection(Guid userId, Guid sectionId)
        {
            var assignment = await _sectionService.GetUserPermissonAsync(userId,sectionId);
            if (assignment != null)
                return Ok(assignment);
            return Ok(null);
        }

        // cập nhật nội dung seciton
        [HttpPut("{sectionId}")]
        [Authorize]
        public async Task<IActionResult> UpdateSectionContent(
            Guid sectionId,
            [FromBody] UpdateSectionReq req)
        {
            if (req == null || string.IsNullOrEmpty(req.Content))
                return BadRequest("Invalid request");

            var result = await _sectionService
                .UpdateSectionContentAsync(sectionId, req.Content);

            if (!result.Success)
            {
                return NotFound(result.Message);
            }

            return Ok(result.Data);
        }

        //[HttpPost("insert-table")]
        //public async Task<IActionResult> InsertTable([FromBody] JObject sfdt, Guid sectionId)
        //{
        //    try
        //    {
        //        var updatedSfdt =
        //            _hyperlinkTableService.InsertEvidenceTable(sfdt);

        //        Console.WriteLine("Updated SFDT: " + updatedSfdt.ToString(Formatting.None));


        //        var section = await _context.Sections.FindAsync(sectionId);

        //        if (section == null)
        //            return NotFound();

        //        section.Content =
        //            updatedSfdt.ToString(Formatting.None);

        //        await _context.SaveChangesAsync();

        //        return Ok(updatedSfdt);
        //    }
        //    catch (Exception ex)
        //    {
        //        return BadRequest(ex.Message);
        //    }
        //}

        [HttpPost("insert-table")]
        public async Task<IActionResult> InsertTable(
    [FromQuery] Guid documentSnapshotId)
        {
            try
            {
                var document =
                    await _context.DocumentSnapshots.FindAsync(documentSnapshotId);

                if (document == null)
                    return NotFound();

                var sfdt =
                    JObject.Parse(document.JsonContent);
                    
                var updated =
                    _hyperlinkTableService.InsertTableAtEnd(sfdt);

                Console.WriteLine(updated.ToString());

                document.JsonContent =
                    updated.ToString(Formatting.None);

                await _context.SaveChangesAsync();

                return Ok(updated);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
