using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using text_editor_server.Data;
using text_editor_server.DTOs.req;
using text_editor_server.Services;

namespace text_editor_server.Controllers
{
    
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;
      private readonly AuthService _authService;
      
        private readonly ILogger<UsersController> _logger;

        public UsersController(AppDbContext context, AuthService authService,ILogger<UsersController> logger)
        {
            _context = context;
            _authService = authService;
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
            {
                return Unauthorized("Refresh token is missing");
            }

            var newTokens = await _authService.RefreshTokenAsync(refreshToken);

            if (newTokens == null)
            {
                // xóa cookie cũ
                Response.Cookies.Delete("refreshToken");

                return Unauthorized("Invalid refresh token");
            }

            // set cookie mới
            Response.Cookies.Append("refreshToken", newTokens.RefreshToken, new CookieOptions
            {
                HttpOnly = true,
                Secure = false,
                SameSite = SameSiteMode.Lax, //  FIX QUAN TRỌNG
                Expires = DateTime.UtcNow.AddDays(7)
            });

            return Ok(new
            {
                AccessToken = newTokens.AccessToken
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
                Secure = false,       
                SameSite = SameSiteMode.Lax,
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
      
        [HttpGet("me")]
        public async Task<IActionResult> GetMe()
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            if (!Guid.TryParse(userId, out var guid))
                return Unauthorized("Invalid user id");

            var user = await _context.Users
                .FirstOrDefaultAsync(x => x.Id == guid);

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

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAll()
        {
            var result = await _authService.GetListUser();
            return Ok(result);

        }

        
        /// <summary>
        /// Logout
        /// </summary>
        /// <returns></returns>
        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            var refreshToken = Request.Cookies["refreshToken"];

            if (string.IsNullOrEmpty(refreshToken))
                return BadRequest("No refresh token");

            var result = await _authService.Logout(refreshToken);

            if (!result)
                return BadRequest("Invalid token");

            Response.Cookies.Delete("refreshToken");

            return Ok(new { message = "Logged out" });
        }


    }




}
