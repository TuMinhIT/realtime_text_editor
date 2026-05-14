using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using text_editor_server.Services;

namespace text_editor_server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProofFileController : ControllerBase
    {
        private readonly ProofFileService _proofFileService;

        public ProofFileController(ProofFileService proofFileService)
        {
            _proofFileService = proofFileService;
        }

        //[Authorize]
        [HttpPost("upload")]
        [RequestSizeLimit(104_857_600)] // 100MB
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> Upload(IFormFile file, [FromForm] string? title)
        {
            //var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);

            //if (string.IsNullOrWhiteSpace(userIdClaim) ||
            //    !Guid.TryParse(userIdClaim, out var currentUserId))
            //{
            //    return Unauthorized("Invalid token payload");
            //}
            var currentUserId = Guid.Parse("A0B986A7-FEEF-4F52-9AE6-7C2DEE6FC867");

            var result = await _proofFileService
                .UploadProofFileAsync(file, title, currentUserId);

            if (!result.Success)
            {
                return BadRequest(new { message = result.Message });
            }

            return Ok(result.Data);
        }
    }
}
