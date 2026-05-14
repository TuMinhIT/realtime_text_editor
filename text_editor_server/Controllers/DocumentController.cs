using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using text_editor_server.DTOs.req;
using text_editor_server.Services;

namespace text_editor_server.Controllers
{

    [ApiController]
    [Route("api/[controller]")]
    public class DocumentController : ControllerBase
    {
        private readonly DocumentService _documentService;
        private readonly SectionService _sectionService;

        public DocumentController(DocumentService documentService, SectionService sectionService)
        {
            _documentService = documentService;
            _sectionService = sectionService;
        }

        [Authorize]
        [HttpPost("upload")]
        [RequestSizeLimit(104_857_600)] // 100MB
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UploadDocument(IFormFile file, [FromForm] string? title)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);


            if (string.IsNullOrWhiteSpace(userIdClaim) || !Guid.TryParse(userIdClaim, out var currentUserId))
            {
                return Unauthorized("Invalid token payload");
            }

            var result = await _documentService.UploadDocumentAsync(file, title, currentUserId);

            if (!result.Success)
            {
                return BadRequest(new { message = result.Message });
            }

            return Ok(result.Data);
        }


        [Authorize]
        [HttpGet("getAll")]
        public async Task<IActionResult> GetAllDocument()
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrWhiteSpace(userIdClaim) || !Guid.TryParse(userIdClaim, out var currentUserId))
            {
                return Unauthorized("Invalid token payload");
            }

            var result = await _documentService.GetAllDocumentAsync();

            if (result == null)
            {
                return BadRequest(new { message = "Can't get all document"});
            }

            return Ok(result);
        }

        // delete document
        [Authorize]
        [HttpPost("remove/{documentId:guid}")]
        public async Task<IActionResult> RemoveDocument(Guid documentId)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrWhiteSpace(userIdClaim) || !Guid.TryParse(userIdClaim, out var currentUserId))
            {
                return Unauthorized("Invalid token payload");
            }

            var result = await _documentService.RemoveDocumentAsync(documentId);

            return Ok(result);
        }

        // update status document
   
       
        [Authorize(Roles = "Admin")]
        [HttpPost("{documentId}/status")]
    
        public async Task<IActionResult> UpdateDocumentStatus(Guid documentId, bool isActive)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrWhiteSpace(userIdClaim) || !Guid.TryParse(userIdClaim, out var currentUserId))
            {
                return Unauthorized("Invalid token payload");
            }


            var result = await _documentService.UpdateDocumentStatusAsync(documentId, isActive);

            return Ok(result);
        }


        [HttpGet("{documentId:guid}/content")]
        public async Task<IActionResult>
        GetDocumentContent(Guid documentId)
        {
            //var result =
            //    await _documentService
            //        .GetDocumentContentAsync(documentId);

            return Ok("Xóa r m");
        }

        [HttpGet("{documentId:guid}/detail")]
        public async Task<IActionResult>
        GetDocumentDetail(Guid documentId)
        {
            var result =
                await _documentService
                    .GetDocumentDetailAsync(documentId);

            if (!result.Success)
            {
                return NotFound(new { message = result.Message });
            }

            return Ok(result.Data);
        }

        // lưu title
        [HttpPost("{documentId:guid}/title")]
        public async Task<IActionResult> UpdateTitle(Guid documentId, string title)
        {
            var res = await _documentService.updateTitleAsync(documentId, title);
            if (!res)
            {
                return NotFound(new { message = "Document not found" });
            }

            return Ok("Update success!");

        }

        // update content
        [HttpPut("{documentId:guid}/content")]
        public async Task<IActionResult> UpdateContent(Guid documentId, [FromBody] UpdateJsonSfdtReq req)
        {
            var res = await _documentService.updateContentAsync(documentId, req.JsonContent);
            if (!res.Success)
            {
                return BadRequest(new { message = res.Message });
            }

            return Ok(res);

        }       
    }
}
