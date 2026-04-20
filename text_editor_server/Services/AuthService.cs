using System.IdentityModel.Tokens.Jwt;
using System.Security.Cryptography;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using text_editor_server.Entities;
using System.Security.Claims;

namespace text_editor_server.Services
{
    public interface IAuthService
    {
        string HashPassword(string password);
        bool VerifyPassword(string password, string hash);
        string GenerateJwtToken(User user, string jwtSecret, string jwtIssuer, string jwtAudience);
        string GenerateRefreshToken(); // thêm REFRESH TOKEN
        string HashToken(string token);
        Guid? ValidateToken(string token, string jwtSecret);
    }

    public class AuthService : IAuthService
    {
        public string HashPassword(string password)
        {
            using var sha256 = SHA256.Create();
            var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
            return Convert.ToBase64String(hashedBytes);
        }

        public bool VerifyPassword(string password, string hash)
        {
            return HashPassword(password) == hash;
        }
        
        // JWT
        public string GenerateJwtToken(User user, string jwtSecret, string jwtIssuer, string jwtAudience)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim(ClaimTypes.Name, user.FullName),

                // FIX QUAN TRỌNG
                new Claim(ClaimTypes.Role, user.Role)
            };

            var token = new JwtSecurityToken(
                issuer: jwtIssuer,
                audience: jwtAudience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(15), // giảm xuống
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        // Refresh token
        public string GenerateRefreshToken()
        {
            var randomBytes = new byte[64];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomBytes);
            return Convert.ToBase64String(randomBytes);
        }

        public string HashToken(string token)
        {
            using var sha256 = SHA256.Create();
            var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(token));
            return Convert.ToBase64String(hashedBytes);
        }

        public Guid? ValidateToken(string token, string jwtSecret)
        {
            try
            {
                var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret));
                var handler = new JwtSecurityTokenHandler();

                var principal = handler.ValidateToken(token, new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = key,
                    ValidateIssuer = false,
                    ValidateAudience = false,
                    ClockSkew = TimeSpan.Zero
                }, out _);

                var userIdClaim = principal.FindFirst(JwtRegisteredClaimNames.Sub);

                return Guid.TryParse(userIdClaim?.Value, out var userId)
                    ? userId
                    : null;
            }
            catch
            {
                return null;
            }
        }
    }
}