//using System.Security.Claims;
//using Microsoft.AspNetCore.Authorization;
//using Microsoft.AspNetCore.Mvc;
//using text_editor_server.Services;

//namespace text_editor_server.Controllers
//{

//    [ApiController]
//    [Route("api/[controller]")]
//    public class DocumentController : ControllerBase
//    {
//        private readonly IDocumentService _documentService;

//        public DocumentController(IDocumentService documentService)
//        {
//            _documentService = documentService;
//        }

//        [HttpPost("upload")]
//        [RequestSizeLimit(104_857_600)] // 100MB
//        public async Task<IActionResult> UploadDocument([FromForm] IFormFile file, [FromForm] string? title)
//        {
//            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
//            if (string.IsNullOrWhiteSpace(userIdClaim) || !Guid.TryParse(userIdClaim, out var currentUserId))
//            {
//                return Unauthorized("Invalid token payload");
//            }

//            var result = await _documentService.UploadDocumentAsync(file, title, currentUserId);

//            if (!result.Success)
//            {
//                return BadRequest(new { message = result.Message });
//            }

//            return Ok(result.Data);
//        }

//        [HttpGet("{documentId:guid}/blocks")]
//        public async Task<IActionResult> GetDocumentBlocks(Guid documentId)
//        {
//            var blocks = await _documentService.GetDocumentBlocksAsync(documentId);
//            if (blocks == null)
//            {
//                return NotFound(new { message = "Document not found" });
//            }

//            return Ok(blocks);
//        }
//    }
//}
