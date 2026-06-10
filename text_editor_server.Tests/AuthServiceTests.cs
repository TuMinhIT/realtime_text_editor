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
                AuthServiceTestHelper.CreateInActiveUser());

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


    }
}