using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json.Linq;
using System.Security.Claims;
using text_editor_server.DTOs.res;
using text_editor_server.Entities;
using text_editor_server.Services;

using Newtonsoft.Json.Linq;
using System.Text.Json;

namespace text_editor_server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProofFileController : ControllerBase
    {
        private readonly ProofFileService _proofFileService;
        private readonly HyperlinkEngine _engine;

        public ProofFileController(ProofFileService proofFileService, HyperlinkEngine engine)
        {
            _proofFileService = proofFileService;
            _engine = engine;
        }

        [Authorize]
        [HttpPost("upload")]
        [RequestSizeLimit(104_857_600)] // 100MB
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> Upload(IFormFile file,
           [FromForm] bool isGlobal)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrWhiteSpace(userIdClaim) ||
                !Guid.TryParse(userIdClaim, out var currentUserId))
            {
                return Unauthorized("Invalid token payload");
            }

            var result = await _proofFileService
                .UploadProofFileAsync(file, currentUserId, isGlobal);

            if (!result.Success)
            {
                return BadRequest(new { message = result.Message });
            }

            return Ok(result.Data);
        }


        [Authorize]
        [HttpPost("uploadByUser")]
        [RequestSizeLimit(104_857_600)] // 100MB
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UploadByUser(IFormFile file, [FromForm] Guid documentId)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrWhiteSpace(userIdClaim) ||
                !Guid.TryParse(userIdClaim, out var currentUserId))
            {
                return Unauthorized("Invalid token payload");
            }

            var result = await _proofFileService
                .UploadProofFileAsync(file, currentUserId, false);

            if (!result.Success)
            {
                return BadRequest(new { message = result.Message });
            }

            var proofFileRes = result.Data;

            var r = await _proofFileService
                .CreateDocumentFileAsync(currentUserId, documentId, proofFileRes.Id);

            if (!r.Success)
            {
                return BadRequest(new { message = r.Message });
            }
          
           DocumentFile f = r.Data;

            return Ok(new
            {
                proofFile = proofFileRes,
                documentFile = f.Id
            });
        }


        [HttpGet("file/{id:guid}/")]
        public async Task<IActionResult> Download(Guid id)
        {
            var result = await _proofFileService
                .DownloadProofFileAsync(id);

            if (!result.Success || result.Data == null)
            {
                return NotFound(new { message = result.Message });
            }

            return File(
                result.Data.Data,
                result.Data.ContentType,
                result.Data.FileName
            );
        }

        [HttpDelete("{id:guid}")]
        [Authorize]
        public async Task<IActionResult> Delete(Guid id)
        {
            var result = await _proofFileService
                .DeleteProofFileAsync(id);

            if (!result.Success)
            {
                return NotFound(new { message = result.Message });
            }

            return Ok(new { success = true });
        }


        [HttpGet("getFiles")]
        [Authorize]
        public async Task<IActionResult> GetAllFileGlobal()
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrWhiteSpace(userIdClaim) || !Guid.TryParse(userIdClaim, out var currentUserId))
            {
                return Unauthorized("Invalid token payload");
            }

            var result = await _proofFileService.GetAllAsync();

            if (result == null)
            {
                return BadRequest(new { message = "Can't get all file" });
            }

            return Ok(result);
        }

        [HttpGet("getInternalFiles/{documentId:guid}")]
        [Authorize]
        public async Task<IActionResult> GetAllInternalFiles( Guid documentId)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrWhiteSpace(userIdClaim) || !Guid.TryParse(userIdClaim, out var currentUserId))
            {
                return Unauthorized("Invalid token payload");
            }

            var result = await _proofFileService.GetAllInternalAsync(documentId);

            if (result == null)
            {
                return BadRequest(new { message = "Can't get all file" });
            }

            return Ok(result);
        }

    }
}