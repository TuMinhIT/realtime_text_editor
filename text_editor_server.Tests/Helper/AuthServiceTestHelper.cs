using System;
using text_editor_server.Entities;

namespace text_editor_server.Tests.Helper
{
    public static class AuthServiceTestHelper
    {
        public static User CreateUser(
            string email = "test@gmail.com",
            string password = "123456",
            string fullName = "Test User",
            bool isActive = true,
            string role = "User")
        {
            return new User
            {
                Id = Guid.NewGuid(),
                Email = email,
                FullName = fullName,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
                IsActive = isActive,
                Role = role,
                CreatedAt = DateTime.UtcNow
            };
        }

        public static User CreateTestUser()
        {
            return CreateUser();
        }

        public static User CreateInactiveUser()
        {
            return CreateUser(
                email: "inactive@gmail.com",
                isActive: false
            );
        }

        public static User CreateAdminUser()
        {
            return CreateUser(
                email: "admin@gmail.com",
                role: "Admin"
            );
        }
    }
}