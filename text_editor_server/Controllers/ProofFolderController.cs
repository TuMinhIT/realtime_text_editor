using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using text_editor_server.DTOs.req;
using text_editor_server.Services;


namespace text_editor_server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProofFolderController: ControllerBase
    {    
        private readonly FolderService _folderService;
        private readonly ProofFileService _proofFileService;
        public ProofFolderController( FolderService folderService, ProofFileService proofFileService)
        {
            _folderService = folderService;
            _proofFileService = proofFileService;
        }

        // tạo mới 1 folder
        [Authorize]
        [HttpPost]
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

            var result = await  _folderService.CreateFolderAsync(
                request.Name,
                request.IsGlobal,
                request.DocumentId,
                currentUserId);

            if (!result.Success)
            {
                return BadRequest(new { message = result.Message });
            }

            return Ok(result);
        }

        // delete folder
        [Authorize]
        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> DeleteFolder(Guid id)
        {
            var result = await  _folderService.DeleteFolderAsync(id);

            if (!result.Success)
            {
                return NotFound(new { message = result.Message });
            }

            return Ok(new { success = true });
        }


        // thêm file vào folders
        [Authorize]
        [HttpPost("{folderId:guid}/upload")]
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

            var result = await  _folderService
                .UploadProofFileToFolderAsync(file, currentUserId, folderId);
                
            if (!result.Success)
            {
                return BadRequest(new { message = result.Message });
            }

            return Ok(result.Data);
        }
        // load all file in folder
        [HttpGet("{folderId:guid}/files")]
        [Authorize]
        public async Task<IActionResult> GetAllFileInFolder(Guid folderId)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrWhiteSpace(userIdClaim) || !Guid.TryParse(userIdClaim, out var currentUserId))
            {
                return Unauthorized("Invalid token payload");
            }

            var result = await _folderService.GetAllFileInFolderAsync(folderId);

            if (result == null)
            {
                return BadRequest(new { message = "Can't get all folder" });
            }

            return Ok(result);
        }

        [HttpGet()]
        [Authorize]
        public async Task<IActionResult> GetAllFolderGlobal()
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrWhiteSpace(userIdClaim) || !Guid.TryParse(userIdClaim, out var currentUserId))
            {
                return Unauthorized("Invalid token payload");
            }

            var result = await  _folderService.GetAllFolderAsync();

            if (result == null)
            {
                return BadRequest(new { message = "Can't get all folder" });
            }

            return Ok(result);
        }

        // tải xuống 1 folder
        [HttpGet("{id:guid}/")]
        public async Task<IActionResult> Download(Guid id)
        {
            var result = await  _folderService
                .DownloadProofFolderAsync(id);

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

        // upload hàng loạt file
        [Authorize]
        [HttpPost("{folderId:guid}/upload-multi")]
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

            var result = await  _folderService
                .UploadProofFilesToFolderAsync((IFormFileCollection)files, currentUserId, folderId);

            if (!result.Success)
            {
                return BadRequest(new { message = result.Message });
            }

            return Ok(result.Data);
        }


        // load  1 folder + and all file
        [HttpGet("{folderId:guid}/public")]
        [Authorize]
        public async Task<IActionResult> GetFolder(Guid folderId)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrWhiteSpace(userIdClaim) || !Guid.TryParse(userIdClaim, out var currentUserId))
            {
                return Unauthorized("Invalid token payload");
            }

            var result = await _folderService.GetFolderAsync(folderId);

            if (result == null)
            {
                return BadRequest(new { message = "Can't get folder" });
            }

            return Ok(result);
        }

    }

}
