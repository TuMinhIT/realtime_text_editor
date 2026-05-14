using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace text_editor_server.Controllers
{
    public class ProofFileController
    {

        //[HttpPost("upload")]
        //public async Task<IActionResult> Upload(IFormFile file)
        //{
            //if (file == null || file.Length == 0)
            //    return BadRequest("File không hợp lệ");

            //// tên file unique
            //var storedFileName =
            //    $"{Guid.NewGuid()}_{file.FileName}";

            //var uploadPath = Path.Combine(
            //    Directory.GetCurrentDirectory(),
            //    "wwwroot",
            //    "uploads"
            //);

            //if (!Directory.Exists(uploadPath))
            //    Directory.CreateDirectory(uploadPath);

            //var filePath = Path.Combine(uploadPath, storedFileName);


            //using var memoryStream = new MemoryStream();

            //await file.CopyToAsync(memoryStream);

            //var entity = new FileEntity
            //{
            //    Id = Guid.NewGuid(),
            //    FileName = file.FileName,
            //    Data = memoryStream.ToArray(),
            //    ContentType = file.ContentType
            //};

            //_dbContext.Files.Add(entity);

            //await _dbContext.SaveChangesAsync();


            //// save DB
            //var fileEntity = new FileEntity
            //{
            //    Id = Guid.NewGuid(),
            //    FileName = file.FileName,
            //    StoredFileName = storedFileName,
            //    FileUrl = fileUrl,
            //    FileSize = file.Length,
            //    ContentType = file.ContentType,
            //    IsGlobal = false,
            //    CreatedAt = DateTime.UtcNow
            //};

            //_dbContext.Files.Add(fileEntity);

            //await _dbContext.SaveChangesAsync();

            //return Ok(fileEntity);
        //}


        //[HttpGet("{id}")]
        //public async Task<IActionResult> Download(Guid id)
        //{
        //    var file = await _dbContext.Files.FindAsync(id);

        //    if (file == null)
        //        return NotFound();

        //    return File(
        //        file.Data,
        //        file.ContentType,
        //        file.FileName
        //    );
        //}
    }
}
