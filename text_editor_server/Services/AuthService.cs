using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Org.BouncyCastle.Crypto.Generators;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using text_editor_server.Controllers;
using text_editor_server.Data;
using text_editor_server.DTOs.req;
using text_editor_server.DTOs.res;
using text_editor_server.DTOs.res.text_editor_server.DTOs.res;
using text_editor_server.Entities;


namespace text_editor_server.Services
{          
    public class AuthService 
    {
        private readonly AppDbContext _context;

        private readonly IConfiguration _configuration;
        private readonly ILogger<UsersController> _logger;

        // Thêm IConfiguration vào tham số của constructor
        public  AuthService(AppDbContext context, IConfiguration configuration, ILogger<UsersController> logger)
        { 
            _context = context;
            _configuration = configuration; // Khởi tạo _configuration
            _logger = logger;
        }


        public async Task<UserRes?> RegisterUser(string email, string password, string fullName)
        {
            var existingUser = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == email);

            if (existingUser != null)
                return null;

            if (string.IsNullOrEmpty(password))
            {
                throw new ArgumentException("Password cannot be null or empty.");
            }

            // Hash password đúng cách
            string pass = BCrypt.Net.BCrypt.HashPassword(password);

            var user = new User
            {
                Email = email,
                FullName = fullName,
                PasswordHash = pass,
                CreatedAt = DateTime.UtcNow,
                IsActive = true
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return new UserRes
            {
                Id = user.Id,
                Email =user.Email,
                FullName = user.FullName,
                CreatedAt = user.CreatedAt,
                IsActive = user.IsActive,
            };
        }
       
        
        
        public bool VerifyPassword(string password, string hash)
        {
            return BCrypt.Net.BCrypt.Verify(password, hash);
        }


        public async Task<LoginRes> Login(string email, string password)
        {
            var user = await  _context.Users.FirstOrDefaultAsync(x => x.Email == email );

            if (user == null) return null;
            if (!user.IsActive) return null;


            // verify password
            bool isValid = BCrypt.Net.BCrypt.Verify(password, user.PasswordHash);
            if (!isValid) return null;

           
            var accessToken = GenerateAccessToken(user);
            var refreshToken = GenerateRefreshToken();

            var token = new RefreshToken
            {
                Token = refreshToken,
                ExpiresAt = DateTime.UtcNow.AddDays(7),
                UserId = user.Id,
            };

            _context.RefreshTokens.Add(token);
            await _context.SaveChangesAsync();


            return new LoginRes
            {
                User =  new UserRes
                {
                    Id = user.Id,
                    Email = user.Email,
                    FullName = user.FullName,
                    Role = user.Role
                },          
                
                AccessToken = accessToken,
                RefreshToken = refreshToken
            };
        }

        private string GenerateAccessToken(User user)
        {
            var claims = new[]
            {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim("fullName", user.FullName),
            new Claim("role", user.FullName)
        };

            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!)
            );

            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(
                    int.Parse(_configuration["Jwt:AccessTokenExpiryMinutes"]!)
                ),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private string GenerateRefreshToken()
        {
            return Convert.ToBase64String(Guid.NewGuid().ToByteArray());
        }

        public async Task<Object> RefreshTokenAsync(string refreshToken)
        {
            var token = await _context.RefreshTokens
                .Include(x => x.User)
                .FirstOrDefaultAsync(x => x.Token == refreshToken);

            if (token == null || token.IsRevoked || token.ExpiresAt < DateTime.UtcNow)
                return null;

           
            token.IsRevoked = true;
            var newRefreshToken = new RefreshToken
            {
                Token = GenerateRefreshToken(),
                ExpiresAt = DateTime.UtcNow.AddDays(7),
                UserId = token.UserId
            };

            _context.RefreshTokens.Add(newRefreshToken);

            var newAccessToken = GenerateAccessToken(token.User);

            await _context.SaveChangesAsync();

            return new 
            {
                AccessToken = newAccessToken,
                RefreshToken = newRefreshToken.Token
            };
        }

    }
}