using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using text_editor_server.Services;

namespace text_editor_server.Controllers
{

    [ApiController]
    [Route("api/[controller]")]
    public class DocumentController : ControllerBase
    {
        private readonly DocumentService _documentService;

        public DocumentController(DocumentService documentService)
        {
            _documentService = documentService;
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


        [HttpGet("{documentId:guid}/sections")]
        public async Task<IActionResult> GetDocumentBlocks(Guid documentId)
        {
            var blocks = await _documentService.GetDocumentBlocksAsync(documentId);
            if (blocks == null)
            {
                return NotFound(new { message = "Document not found" });
            }

            return Ok(blocks);
        }


        //Lấy nội dung một tài liệu:
        [HttpGet("{documentId:guid}/content")]
        public async Task<IActionResult> GetDocumentContent(Guid documentId)
        {
            var sfdt = await _documentService.GetDocumentContentAsync(documentId);

            if (sfdt == null)
                return NotFound();

            return Content(sfdt, "application/json"); // 👈 chuẩn
        }
    }
}
