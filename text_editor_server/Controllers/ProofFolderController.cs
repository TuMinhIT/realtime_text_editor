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
            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return BadRequest(new { message = "Folder name is required" });
            }

            var result = await _proofFileService.CreateFolderAsync(request.Name);

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

        // get all global folders
        [Authorize]
        [HttpGet("folders/global")]
        public async Task<IActionResult> GetAllFolderGlobal()
        {
            var result = await _proofFileService.GetAllFolderGlobalAsync();

            if (!result.Success)
            {
                return BadRequest(new { message = result.Message });
            }

            return Ok(result.Data);
        }

        // get all folders by document
        [Authorize]
        [HttpGet("folders/document/{documentId:guid}")]
        public async Task<IActionResult> GetAllFolderDocument(Guid documentId)
        {
            var result = await _proofFileService.GetAllFolderDocumentAsync(documentId);

            if (!result.Success)
            {
                return BadRequest(new { message = result.Message });
            }

            return Ok(result.Data);
        }

        // download folder (zip)
        [HttpGet("folders/{folderId:guid}/download")]
        public async Task<IActionResult> DownloadFolder(Guid folderId)
        {
            var result = await _proofFileService.DownloadFolderAsync(folderId);

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
