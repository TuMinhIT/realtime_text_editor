using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using text_editor_server.Data;
using text_editor_server.DTOs.res;
using text_editor_server.DTOs.res.text_editor_server.DTOs.res;
using text_editor_server.Entities;

namespace text_editor_server.Services
{
    public class AuthService
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AuthService> _logger;
        private readonly IHttpContextAccessor _httpContextAccessor; //Lấy IP + device info

        public AuthService(
            AppDbContext context,
            IConfiguration configuration,
            ILogger<AuthService> logger,
            IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _configuration = configuration;
            _logger = logger;
            _httpContextAccessor = httpContextAccessor;
        }

        //REGISTER
        public async Task<UserRes?> RegisterUser(string email, string password, string fullName)
        {
            if (await _context.Users.AnyAsync(x => x.Email == email))
                return null;

            var user = new User
            {
                Email = email,
                FullName = fullName,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
                CreatedAt = DateTime.UtcNow,
                IsActive = true
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return new UserRes
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.FullName,
                CreatedAt = user.CreatedAt,
                IsActive = user.IsActive
            };
        }

        // LOGIN 
        public async Task<LoginRes?> Login(string email, string password)
        {
            var user = await _context.Users.FirstOrDefaultAsync(x => x.Email == email);

            if (user == null || !user.IsActive)
            {
                _logger.LogWarning("Login failed for {Email}", email);
                return null;
            }

            if (!BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
            {
                _logger.LogWarning("Login failed for {Email}", email);
                return null;
            }

            var accessToken = GenerateAccessToken(user);

            // Generate refresh token with TokenId
            var tokenId = Guid.NewGuid().ToString();
            var random = GenerateRefreshToken();
            var rawRefreshToken = $"{tokenId}.{random}";

            // lấy device + ip
            var http = _httpContextAccessor.HttpContext;
            var ip = http?.Connection.RemoteIpAddress?.ToString();
            var device = http?.Request.Headers["User-Agent"].ToString();

            var refreshToken = new RefreshToken
            {
                TokenId = tokenId,
                TokenHash = BCrypt.Net.BCrypt.HashPassword(rawRefreshToken),
                ExpiresAt = DateTime.UtcNow.AddDays(7),
                UserId = user.Id,
                CreatedByIp = ip,
                Device = device
            };

            _context.RefreshTokens.Add(refreshToken);
            await _context.SaveChangesAsync();

            _logger.LogInformation("User {UserId} logged in", user.Id);

            return new LoginRes
            {
                User = new UserRes
                {
                    Id = user.Id,
                    Email = user.Email,
                    FullName = user.FullName,
                    Role = user.Role
                },
                AccessToken = accessToken,
                RefreshToken = rawRefreshToken // trả raw cho cookie
            };
        }

        // REFRESH
        public async Task<RefreshTokenRes?> RefreshTokenAsync(string refreshToken)
        {
            var parts = refreshToken.Split('.'); //Tách TokenId và phần random của refresh token
            if (parts.Length != 2)
            {
                _logger.LogWarning("Invalid refresh token format");
                return null;
            }
            var tokenId = parts[0];

            var token = await _context.RefreshTokens
                .Include(x => x.User)
                .FirstOrDefaultAsync(x => x.TokenId == tokenId && !x.IsRevoked && x.ExpiresAt > DateTime.UtcNow);

            if (token == null)
            {
                _logger.LogWarning("Invalid refresh token attempt");
                return null;
            }

            // verify hash
            bool isValid = BCrypt.Net.BCrypt.Verify(refreshToken, token.TokenHash);
            if (!isValid)
            {
                _logger.LogWarning("Invalid refresh token attempt");
                return null;
            }

            // rotate
            token.IsRevoked = true;

            // Generate new refresh token
            var newTokenId = Guid.NewGuid().ToString();
            var newRandom = GenerateRefreshToken();
            var newRawToken = $"{newTokenId}.{newRandom}";

            var http = _httpContextAccessor.HttpContext;
            var ip = http?.Connection.RemoteIpAddress?.ToString();
            var device = http?.Request.Headers["User-Agent"].ToString();

            var newToken = new RefreshToken
            {
                TokenId = newTokenId,
                TokenHash = BCrypt.Net.BCrypt.HashPassword(newRawToken),
                ExpiresAt = DateTime.UtcNow.AddDays(7),
                UserId = token.UserId,
                CreatedByIp = ip,
                Device = device
            };

            token.ReplacedByToken = newRawToken;

            _context.RefreshTokens.Add(newToken);

            var accessToken = GenerateAccessToken(token.User);

            await _context.SaveChangesAsync();

            return new RefreshTokenRes
            {
                AccessToken = accessToken,
                RefreshToken = newRawToken
            };
        }

        //  LOGOUT
        public async Task<bool> Logout(string refreshToken)
        {
            var parts = refreshToken.Split('.');
            if (parts.Length != 2)
                return false;
            var tokenId = parts[0];

            var token = await _context.RefreshTokens.FirstOrDefaultAsync(x => x.TokenId == tokenId && !x.IsRevoked);

            if (token == null)
                return false;

            bool isValid = BCrypt.Net.BCrypt.Verify(refreshToken, token.TokenHash);
            if (!isValid)
                return false;

            token.IsRevoked = true;
            token.RevokedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return true;
        }

        // JWT 
        private string GenerateAccessToken(User user)
        {
            var keyStr = _configuration["Jwt:Key"];
            if (string.IsNullOrEmpty(keyStr))
                throw new Exception("JWT Key missing");

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim("fullName", user.FullName),
                new Claim(ClaimTypes.Role, user.Role ?? "User"),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(keyStr)
            );

            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var expiryMinutesStr = _configuration["Jwt:AccessTokenExpiryMinutes"];
            if (string.IsNullOrEmpty(expiryMinutesStr))
                throw new Exception("JWT AccessTokenExpiryMinutes missing");

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(
                    int.Parse(expiryMinutesStr)
                ),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private string GenerateRefreshToken()
        {
            var bytes = new byte[64];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(bytes);
            return Convert.ToBase64String(bytes);
        }
    }
}