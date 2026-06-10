using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using text_editor_server.Entities;

namespace text_editor_server.Tests.Helper
{
    public  class AuthServiceTestHelper
    {
        public static User CreateTestUser()
        {
            return new User
            {
                Id = Guid.NewGuid(),
                Email = "test@gmail.com",
                FullName = "Test User",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("123456"),
                IsActive = true,
                Role = "User",
                CreatedAt = DateTime.UtcNow
            };
        }
        //Test case: Tạo user inactive:
        public static User CreateInActiveUser()
        {
            return new User
            {
                Id = Guid.NewGuid(),
                Email = "inactive@gmail.com",
                FullName = "Test User",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("123456"),
                IsActive = false, // Không hoạt động.
                Role = "User",
                CreatedAt = DateTime.UtcNow
            };
        }


    }

    
}
