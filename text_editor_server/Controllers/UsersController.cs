using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using text_editor_server.Data;
using text_editor_server.DTOs.req;
using text_editor_server.DTOs.res;
using text_editor_server.Services;

namespace text_editor_server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;
      private readonly AuthService _authService;
        private readonly IConfiguration _configuration;
        private readonly ILogger<UsersController> _logger;

        public UsersController(AppDbContext context, AuthService authService, IConfiguration configuration, ILogger<UsersController> logger)
        {
            _context = context;
            _authService = authService;
            _configuration = configuration;
            _logger = logger;
        }

        /// <summary>
        /// Register a new user
        /// </summary>
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterReq request)
        {
            try
            {
                if (request.Email == null || request.Password == null)
                    return BadRequest("Email and password are required");

                var user = await _authService.RegisterUser(request.Email, request.Password, request.FullName);
                if (user == null)
                    return BadRequest("User with this email already exists");

                return Ok(new { 
                    user,
                    message = "User registered successfully" 
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error registering user: {ex.Message}");
                return StatusCode(500, "Failed to register user");
            }
        }



        [HttpPost("refresh-token")]
        public async Task<IActionResult> RefreshToken()
        {

            var refreshToken = Request.Cookies["refreshToken"];
            if (string.IsNullOrEmpty(refreshToken))
           
                return Unauthorized("Refresh token is missing");
            RefreshTokenRes newTokens = await _authService.RefreshTokenAsync(refreshToken) as RefreshTokenRes;
            if (newTokens == null)
                return Unauthorized("Invalid refresh token");

            
                // set lại cookie mới (rotate)
                Response.Cookies.Append("refreshToken", newTokens.RefreshToken, new CookieOptions
                {
                    HttpOnly = true,
                    Secure = true,
                    SameSite = SameSiteMode.Strict,
                    Expires = DateTime.UtcNow.AddDays(7)
                });

            return Ok(new
            {
                AccessToken = newTokens.accessToken,
                message = "Token refreshed successfully"
            });   
        }
        /// <summary>
        /// Login user
        /// </summary>
        [HttpPost("login")]
      
        public async Task<IActionResult> Login([FromBody] LoginReq request)
        {
            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
                return BadRequest("Email and password are required");

            var result = await _authService.Login(request.Email, request.Password);
            if (result == null)
                return Unauthorized("Invalid email or password");

            // lấy refresh token từ result
            var refreshToken = result.RefreshToken;

            // set cookie
            Response.Cookies.Append("refreshToken", refreshToken!, new CookieOptions
            {
                HttpOnly = true,    
                Secure = true,       
                SameSite = SameSiteMode.Strict,
                Expires = DateTime.UtcNow.AddDays(7)
            });

       
            return Ok(new
            {
                User = result.User,
                AccessToken = result.AccessToken,
                message = "Login successful"
            });
        }


        /// <summary>
        /// Get current user profile
        /// </summary>
        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> GetProfile()
        {
            try
            {
                var userIdClaim = User.FindFirst("sub");
                if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
                    return Unauthorized();

                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                    return NotFound();

                return Ok(new
                {
                    user.Id,
                    user.Email,
                    user.FullName,
                    user.CreatedAt
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting profile: {ex.Message}");
                return StatusCode(500, "Failed to get profile");
            }
        }

        /// <summary>
        /// Get user documents
        /// </summary>
        [HttpGet("{userId}/documents")]
        public async Task<IActionResult> GetUserDocuments(Guid userId)
        {
            try
            {
                var documents = await _context.Documents
                    .Where(d => d.CreatedBy == userId)
                    .Select(d => new
                    {
                        d.Id,
                        d.Title,
                        d.CreatedAt,
                        SectionsCount = d.Sections.Count
                    })
                    .ToListAsync();

                return Ok(documents);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting user documents: {ex.Message}");
                return StatusCode(500, "Failed to get documents");
            }
        }

    

    }




}
