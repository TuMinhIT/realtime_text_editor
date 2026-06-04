using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using text_editor_server.DTOs.req;
using text_editor_server.Entities;
using text_editor_server.Services;


namespace text_editor_server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProofFolderController: ControllerBase
    {
        private readonly ProofFileService _proofFileService;
        public ProofFolderController(ProofFileService proofFileService)
        {
            _proofFileService = proofFileService;

        }

        // tạo mới 1 folder
        [Authorize]
        [HttpPost("folders")]
        public async Task<IActionResult> CreateFolder([FromBody] CreateFolderReq request)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrWhiteSpace(userIdClaim) ||
                !Guid.TryParse(userIdClaim, out var currentUserId))
            {
                return Unauthorized("Invalid token payload");
            }

            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return BadRequest(new { message = "Folder name is required" });
            }

            if (request.IsGlobal && request.DocumentId.HasValue)
            {
                return BadRequest(new { message = "Global folder cannot attach to document" });
            }

            if (!request.IsGlobal && !request.DocumentId.HasValue)
            {
                return BadRequest(new { message = "DocumentId is required" });
            }

            var result = await _proofFileService.CreateFolderAsync(
                request.Name,
                request.IsGlobal,
                request.DocumentId,
                currentUserId);

            if (!result.Success)
            {
                return BadRequest(new { message = result.Message });
            }

            return Ok(result.Data);
        }

        // delete folder
        [Authorize]
        [HttpDelete("folders/{id:guid}")]
        public async Task<IActionResult> DeleteFolder(Guid id)
        {
            var result = await _proofFileService.DeleteFolderAsync(id);

            if (!result.Success)
            {
                return NotFound(new { message = result.Message });
            }

            return Ok(new { success = true });
        }


        // thêm file vào folders
        [Authorize]
        [HttpPost("folders/{folderId:guid}/upload")]
        [RequestSizeLimit(104_857_600)] // 100MB
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UploadToFolder(Guid folderId, IFormFile file)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrWhiteSpace(userIdClaim) ||
                !Guid.TryParse(userIdClaim, out var currentUserId))
            {
                return Unauthorized("Invalid token payload");
            }

            var result = await _proofFileService
                .UploadProofFileToFolderAsync(file, currentUserId, folderId);

            if (!result.Success)
            {
                return BadRequest(new { message = result.Message });
            }

            return Ok(result.Data);
        }


        // upload hàng loạt file
        [Authorize]
        [HttpPost("folders/{folderId:guid}/upload-multi")]
        [RequestSizeLimit(104_857_600)] // 100MB
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UploadMultipleToFolder(
            Guid folderId,
            [FromForm] List<IFormFile> files)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrWhiteSpace(userIdClaim) ||
                !Guid.TryParse(userIdClaim, out var currentUserId))
            {
                return Unauthorized("Invalid token payload");
            }

            var result = await _proofFileService
                .UploadProofFilesToFolderAsync((IFormFileCollection)files, currentUserId, folderId);

            if (!result.Success)
            {
                return BadRequest(new { message = result.Message });
            }

            return Ok(result.Data);
        }


        // tải xuống 1 file trong folder
        [HttpGet("folders/{folderId:guid}/file/{id:guid}")]
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
    }

}
