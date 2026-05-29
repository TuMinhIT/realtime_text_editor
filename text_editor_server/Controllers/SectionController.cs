using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json.Linq;
using text_editor_server.DTOs.req;
using text_editor_server.Entities;
using text_editor_server.Services;

namespace text_editor_server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SectionController : ControllerBase
    {
        private readonly SectionService _sectionService;
        private readonly DocumentService _documentService;
        private readonly SectionParser _sectionParse;

        public SectionController(SectionService sectionService, DocumentService documentService, SectionParser sectionParse)
        {
            _sectionService = sectionService;
            _documentService = documentService;
            _sectionParse = sectionParse;
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
            var assignment = await _sectionService.GetSectionPermissonAsync(sectionId);
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
            if (!result)
                return NotFound("Section not found or update failed");
            return Ok(new
            {
                message = "Section updated successfully"
            });
        }


    }


}
