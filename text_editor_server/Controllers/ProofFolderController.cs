using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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
        private readonly FolderService _folderService;
      
        public ProofFolderController( FolderService folderService)
        {
            _folderService = folderService;
           
        }

        // tạo mới 1 folder
        [Authorize]
        [HttpPost]
        public async Task<IActionResult> UploadFolder(
            [FromForm] string folderName,
              [FromForm] bool global,
              [FromForm] Guid? documentId,
            [FromForm] List<IFormFile> files)
             {

            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrWhiteSpace(userIdClaim) ||
                !Guid.TryParse(userIdClaim, out var currentUserId))
            {
                return Unauthorized("Invalid token payload");
            }
            var result = await _folderService.CreateFolderAsync(
                folderName, files, global, documentId , currentUserId);
            if (result.Success)
            {
                return Ok(result.Data);

            }
            return NotFound(new { message = result.Message });
            
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
        //[Authorize]
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


        // ;lấy tất cã folder global
        [HttpGet()]
        [Authorize]
        public async Task<IActionResult> GetAllFolderGlobal()
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrWhiteSpace(userIdClaim) || !Guid.TryParse(userIdClaim, out var currentUserId))
            {
                return Unauthorized("Invalid token payload");
            }

            var result = await _folderService.GetAllFolderAsync();

            if (result == null)
            {
                return BadRequest(new { message = "Can't get all folder" });
            }

            return Ok(result);
        }

         // lấy tất cã folder trong 1 tài liệu
        [HttpGet("getInternalFolder/{documentId:guid}")]
        [Authorize]
        public async Task<IActionResult> GetAllInternalFolder(Guid documentId)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrWhiteSpace(userIdClaim) || !Guid.TryParse(userIdClaim, out var currentUserId))
            {
                return Unauthorized("Invalid token payload");
            }

            var result = await _folderService.GetAllInternalAsync(documentId);

            if (result == null)
            {
                return BadRequest(new { message = "Can't get all file" });
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
                .UploadProofFilesToFolderAsync(files, currentUserId, folderId);

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
