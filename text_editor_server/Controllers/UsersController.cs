using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using text_editor_server.Data;
using text_editor_server.Entities;
using text_editor_server.Services;

namespace text_editor_server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IAuthService _authService;
        private readonly IConfiguration _configuration;
        private readonly ILogger<UsersController> _logger;

        public UsersController(AppDbContext context, IAuthService authService, IConfiguration configuration, ILogger<UsersController> logger)
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
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
                    return BadRequest("Email and password are required");

                // Check if user exists
                var existingUser = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email == request.Email);

                if (existingUser != null)
                    return BadRequest("User with this email already exists");

                // Create user
                var user = new User
                {
                    Id = Guid.NewGuid(),
                    Email = request.Email,
                    FullName = request.FullName ?? request.Email.Split('@')[0],
                    PasswordHash = _authService.HashPassword(request.Password),
                    CreatedAt = DateTime.UtcNow,
                    IsActive = true
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                return Ok(new { userId = user.Id, email = user.Email, message = "User registered successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error registering user: {ex.Message}");
                return StatusCode(500, "Failed to register user");
            }
        }

        /// <summary>
        /// Login user
        /// </summary>
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
                    return BadRequest("Email and password are required");

                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email == request.Email);

                if (user == null || !_authService.VerifyPassword(request.Password, user.PasswordHash))
                    return Unauthorized("Invalid email or password");

                if (!user.IsActive)
                    return Unauthorized("User account is not active");

                // Generate JWT token
                var jwtSecret = _configuration["Jwt:Secret"];
                var jwtIssuer = _configuration["Jwt:Issuer"];
                var jwtAudience = _configuration["Jwt:Audience"];
                var token = _authService.GenerateJwtToken(user, jwtSecret, jwtIssuer, jwtAudience);


                //Them oldToken de kiem tra refreshtoken cu:
                var oldTokens = await _context.RefreshTokens
                    .Where(x => x.UserId == user.Id && !x.IsRevoked && !x.IsUsed)
                    .ToListAsync();
                foreach (var t in oldTokens)
                {
                    t.IsRevoked = true;
                }
                // Generate refresh token
                var refreshToken = _authService.GenerateRefreshToken();
                var refreshTokenHash = _authService.HashToken(refreshToken);

                var newRefreshToken = new RefreshToken
                {
                    TokenHash = refreshTokenHash,
                    ExpiryTime = DateTime.UtcNow.AddDays(7),
                    UserId = user.Id,
                    CreatedByIp = HttpContext.Connection.RemoteIpAddress?.ToString(),
                    UserAgent = Request.Headers["User-Agent"].ToString()
                };
                _context.RefreshTokens.Add(newRefreshToken);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    userId = user.Id,
                    email = user.Email,
                    fullName = user.FullName,
                    token,
                    expiresIn = 900, // 15 phút
                    refreshToken, // chỉ trả về plain text 1 lần
                    refreshTokenExpiry = newRefreshToken.ExpiryTime
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error logging in user");
                return StatusCode(500, "Failed to login");
            }
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

        /// <summary>
        /// Search users by email
        /// </summary>
        [HttpGet("search")]
        public async Task<IActionResult> SearchUsers([FromQuery] string query)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(query) || query.Length < 2)
                    return BadRequest("Search query must be at least 2 characters");

                var users = await _context.Users
                    .Where(u => u.Email.Contains(query) || u.FullName.Contains(query))
                    .Take(10)
                    .Select(u => new { u.Id, u.Email, u.FullName })
                    .ToListAsync();

                return Ok(users);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error searching users: {ex.Message}");
                return StatusCode(500, "Failed to search users");
            }
        }

        /// <summary>
        /// Refresh JWT token
        /// </summary>
        [HttpPost("refresh-token")]
        public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.RefreshToken))
                return BadRequest("Refresh token is required");

            var refreshTokenHash = _authService.HashToken(request.RefreshToken);
            var storedToken = await _context.RefreshTokens
                .Include(rt => rt.User)
                .FirstOrDefaultAsync(rt => rt.TokenHash == refreshTokenHash);

            if (storedToken == null || storedToken.IsUsed || storedToken.IsRevoked || storedToken.ExpiryTime < DateTime.UtcNow)
                return Unauthorized("Invalid or expired refresh token");
            
            // Đánh dấu token đã dùng và đã thu hồi
            storedToken.IsUsed = true;
            storedToken.IsRevoked = true;
            _context.RefreshTokens.Update(storedToken);

            // Sinh access token mới
            var jwtSecret = _configuration["Jwt:Secret"];
            var jwtIssuer = _configuration["Jwt:Issuer"];
            var jwtAudience = _configuration["Jwt:Audience"];
            var newAccessToken = _authService.GenerateJwtToken(storedToken.User, jwtSecret, jwtIssuer, jwtAudience);

            // (Tùy chọn) Sinh refresh token mới
            var newRefreshToken = _authService.GenerateRefreshToken();
            var newRefreshTokenHash = _authService.HashToken(newRefreshToken);
            var refreshTokenEntity = new RefreshToken
            {
                TokenHash = newRefreshTokenHash,
                ExpiryTime = DateTime.UtcNow.AddDays(7),
                UserId = storedToken.UserId,
                CreatedByIp = HttpContext.Connection.RemoteIpAddress?.ToString(),
                UserAgent = Request.Headers["User-Agent"].ToString()
            };
            _context.RefreshTokens.Add(refreshTokenEntity);

            await _context.SaveChangesAsync();

            // Kiểm tra tái sử dụng token
            if (storedToken.IsUsed)
            {
                var tokens = _context.RefreshTokens
                    .Where(x => x.UserId == storedToken.UserId);
                foreach (var t in tokens)
                {
                    t.IsRevoked = true;
                }
                await _context.SaveChangesAsync();
                return Unauthorized("Token reuse detected");
            }

            return Ok(new
            {
                token = newAccessToken,
                expiresIn = 900,
                refreshToken = newRefreshToken,
                refreshTokenExpiry = refreshTokenEntity.ExpiryTime
            });
        }

        public class RefreshTokenRequest
        {
            public string RefreshToken { get; set; }
        }
    }

    // Request DTOs
    public class RegisterRequest
    {
        public string Email { get; set; }
        public string Password { get; set; }
        public string? FullName { get; set; }
    }       

    public class LoginRequest
    {
        public string Email { get; set; }
        public string Password { get; set; }
    }
}
