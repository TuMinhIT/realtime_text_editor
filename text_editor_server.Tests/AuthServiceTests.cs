using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using text_editor_server.Data;
using text_editor_server.DTOs.res;
using text_editor_server.Entities;
using text_editor_server.Services;
using text_editor_server.Tests.Helper;

namespace text_editor_server.Tests
{
    public class AuthServiceTests
    {
        private AppDbContext CreateDbContext()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            return new AppDbContext(options);
        }

        private IConfiguration CreateConfiguration()
        {
            var settings =
                new Dictionary<string, string?>
                {
                    ["Jwt:Key"] =
                        "Je02Uo78iITWRJWo5icx5wj2gc+8T9vb7zlN/jBDxNw=",

                    ["Jwt:Issuer"] =
                        "TestIssuer",

                    ["Jwt:Audience"] =
                        "TestAudience",

                    ["Jwt:AccessTokenExpiryMinutes"] =
                        "15"
                };

            return new ConfigurationBuilder()
                .AddInMemoryCollection(settings)
                .Build();
        }

        private AuthService CreateAuthService(
    AppDbContext context)
        {
            var logger =
                Mock.Of<ILogger<AuthService>>();

            var accessor =
                Mock.Of<IHttpContextAccessor>();

            return new AuthService(
                context,
                CreateConfiguration(),
                logger,
                accessor);
        }

        //Test case: Successful login
        [Fact]
        public async Task Login_Success()
        {
            var context = CreateDbContext();

            context.Users.Add(AuthServiceTestHelper.CreateTestUser());

            await context.SaveChangesAsync();

            var service =
                CreateAuthService(context);

            var result =
                await service.Login(
                    "test@gmail.com",
                    "123456");

            Assert.NotNull(result);

            Assert.NotNull(result.AccessToken);
        }

        //Test case: Login with wrong password
        [Fact]
        public async Task Login_WrongPassword()
        {
            var context = CreateDbContext();

            context.Users.Add(AuthServiceTestHelper.CreateTestUser());

            await context.SaveChangesAsync();

            var service =
                CreateAuthService(context);

            var result =
                await service.Login(
                    "test@gmail.com",
                    "wrongpassword");

            Assert.Null(result);
        }

        //Test case: Login with non-existing email:
        [Fact]
        public async Task Login_UserNotFound()
        {
            var context = CreateDbContext();

            var service = CreateAuthService(context);

            var result = await service.Login(
                "notfound@gmail.com",
                "123456");

            Assert.Null(result);
        }

        //Test case: Login with inactive user
        [Fact]
        public async Task Login_InactiveUser()
        {
            var context = CreateDbContext();

            context.Users.Add(
                AuthServiceTestHelper.CreateInactiveUser());

            await context.SaveChangesAsync();

            var service = CreateAuthService(context);

            var result = await service.Login(
                "inactive@gmail.com",
                "123456");

            Assert.Null(result);
        }

        // Test case: Login with empty email and password
        [Fact]
        public async Task Login_EmptyEmailAndPassword()
        {
            var context = CreateDbContext();
            var service = CreateAuthService(context);
            var result = await service.Login(
                "",
                "");
            Assert.Null(result);
        }


        // Test case: Register Success:
        [Fact]
        public async Task Register_Success()
        {
            var context = CreateDbContext();
            var service = CreateAuthService(context);

            var result = await service.RegisterUser(
                "new@gmail.com",
                "123456",
                "New User");

            Assert.NotNull(result);
            Assert.Equal("new@gmail.com", result.Email);

            var userInDb = await context.Users.FirstOrDefaultAsync(x => x.Email == "new@gmail.com");
            Assert.NotNull(userInDb);
            Assert.True(BCrypt.Net.BCrypt.Verify("123456", userInDb.PasswordHash));
        }

        //Test case: Register with existing email
        [Fact]
        public async Task Register_DuplicateEmail_ShouldReturnNull()
        {
            var context = CreateDbContext();

            context.Users.Add(AuthServiceTestHelper.CreateTestUser());
            await context.SaveChangesAsync();

            var service = CreateAuthService(context);

            var result = await service.RegisterUser(
                "test@gmail.com",
                "123456",
                "Another User"
            );

            Assert.Null(result);
        }

        //Test case: Register with empty email, password, and full name
        [Fact]
        public async Task Register_EmptyFields_ShouldReturnNull()
        {
            var context = CreateDbContext();
            var service = CreateAuthService(context);
            var result = await service.RegisterUser(
                "",
                "",
                ""
            );
            Assert.Null(result);
        }


        //Test case: Login - Check refresh token generation
        [Fact]
        public async Task Login_ShouldCreateRefreshToken()
        {
            var context = CreateDbContext();

            context.Users.Add(AuthServiceTestHelper.CreateTestUser());
            await context.SaveChangesAsync();

            var service = CreateAuthService(context);

            var result = await service.Login("test@gmail.com", "123456");

            Assert.NotNull(result);

            var refreshTokens = await context.RefreshTokens.ToListAsync();

            Assert.Single(refreshTokens);
            Assert.Equal(result.User.Id, refreshTokens[0].UserId);
            Assert.False(string.IsNullOrEmpty(refreshTokens[0].TokenHash));
        }

        // Test case: Refresh token - Wrong token
        [Fact]
        public async Task RefreshToken_NotFound_ShouldReturnNull()
        {
            var context = CreateDbContext();
            var service = CreateAuthService(context);

            var fakeToken = "11111111-1111-1111-1111-111111111111.randomstring";

            var result = await service.RefreshTokenAsync(fakeToken);

            Assert.Null(result);
        }

        // Test case: Refresh token - Expired token

        [Fact]
        public async Task RefreshToken_Expired_ShouldReturnNull()
        {
            var context = CreateDbContext();

            var user = AuthServiceTestHelper.CreateTestUser();
            context.Users.Add(user);

            var token = new RefreshToken
            {
                TokenId = Guid.NewGuid().ToString(),
                TokenHash = BCrypt.Net.BCrypt.HashPassword("test"),
                UserId = user.Id,
                ExpiresAt = DateTime.UtcNow.AddMinutes(-10),
                IsRevoked = false
            };

            context.RefreshTokens.Add(token);
            await context.SaveChangesAsync();

            var service = CreateAuthService(context);

            var result = await service.RefreshTokenAsync("fake.fake");

            Assert.Null(result);
        }

        //Test case: Logout Success case
        [Fact]
        public async Task Logout_Success()
        {
            var context = CreateDbContext();

            context.Users.Add(AuthServiceTestHelper.CreateTestUser());
            await context.SaveChangesAsync();

            var service = CreateAuthService(context);

            var login = await service.Login("test@gmail.com", "123456");

            Assert.NotNull(login);

            var result = await service.Logout(login.RefreshToken);

            Assert.True(result);

            var tokenInDb = await context.RefreshTokens.FirstAsync();

            Assert.True(tokenInDb.IsRevoked);
        }
        //Test case: Logout with invalid token

        [Fact]
        public async Task Logout_InvalidToken_ShouldReturnFalse()
        {
            var context = CreateDbContext();
            var service = CreateAuthService(context);

            var result = await service.Logout("invalid.token");

            Assert.False(result);
        }

    }
}