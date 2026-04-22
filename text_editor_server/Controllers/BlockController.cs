using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using text_editor_server.Entities;
using text_editor_server.Services;

namespace text_editor_server.Controllers
{

    [ApiController]
    [Route("api/[controller]")]
    public class BlockController : ControllerBase
    {
        private readonly DocumentService _documentService;

        public BlockController(DocumentService documentService)
        {
            _documentService = documentService;
        }

        [HttpGet("{sectionId:guid}/users")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetBlockUsers(Guid sectionId)
        {
            var result = await _documentService.GetBlockUsersAsync(sectionId);
            if (!result.Success)
            {
                return NotFound(new { message = result.Message });
            }

            return Ok(result.Data);
        }

        //[HttpPost("assign-user")]
        //[Authorize(Roles = "Admin")]
        //public async Task<IActionResult> AssignUserToBlock([FromBody] AssignBlockPermissionReq request)
        //{
        //    if (request == null)
        //    {
        //        return BadRequest(new { message = "Request body is required" });
        //    }

        //    if (!Enum.IsDefined(typeof(PermissionLevel), request.Permission))
        //    {
        //        return BadRequest(new { message = "Invalid permission value" });
        //    }

        //    var result = await _documentService.AssignUserToBlockAsync(request.SectionId, request.UserId, request.Permission);
        //    if (!result.Success)
        //    {
        //        return BadRequest(new { message = result.Message });
        //    }

        //    return Ok(result.Data);
        //}

        //[HttpDelete("{sectionId:guid}/users/{userId:guid}")]
        //[Authorize(Roles = "Admin")]
        //public async Task<IActionResult> RemoveUserFromBlock(Guid sectionId, Guid userId)
        //{
        //    var result = await _documentService.RemoveUserFromBlockAsync(sectionId, userId);
        //    if (!result.Success)
        //    {
        //        return NotFound(new { message = result.Message });
        //    }

        //    return Ok(new { message = "User removed from block" });
        //}
    }

    public class AssignBlockPermissionReq
    {
        public Guid SectionId { get; set; }
        public Guid UserId { get; set; }
        public PermissionLevel Permission { get; set; }
    }
}
