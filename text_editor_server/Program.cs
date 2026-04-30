using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
//using System.Diagnostics.Eventing.Reader;
using System.Text;
using text_editor_server.Data;
using text_editor_server.Entities;
//using text_editor_server.Hubs;
using text_editor_server.Services;

namespace text_editor_server
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);


            // Add database
            var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
               
            
            builder.Services.AddDbContext<AppDbContext>(options =>
                options.UseSqlServer(connectionString));

            // Add services
            builder.Services.AddScoped< AuthService>();
            builder.Services.AddScoped<DocumentService>();
            builder.Services.AddHttpContextAccessor();

            builder.Services.AddScoped<IDocxParsingService, DocxParsingService>();
            builder.Services.AddScoped<IOperationalTransformService, OperationalTransformService>();

            // Add controllers
            builder.Services.AddControllers();

            // Add CORS
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowReact", policy =>
                {
                    policy.WithOrigins("http://localhost:3000", "http://localhost:5173")
                        .AllowAnyMethod()
                        .AllowAnyHeader()
                        .AllowCredentials();
                });
            });

            // Add SignalR
            builder.Services.AddSignalR();

            // Add JWT authentication
            builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(options =>
                {
                    var config = builder.Configuration;
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuer = true,
                        ValidateAudience = true,
                        ValidateLifetime = true,
                        ValidateIssuerSigningKey = true,
                        ValidIssuer = config["Jwt:Issuer"],
                        ValidAudience = config["Jwt:Audience"],
                        IssuerSigningKey = new SymmetricSecurityKey(
                            Encoding.UTF8.GetBytes(config["Jwt:Key"])
                        ),
                        ClockSkew = TimeSpan.Zero
                    };
                });

            builder.Services.AddAuthorization();
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen(c =>
            {
                c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
                {
                    Title = "Text Editor API",
                    Version = "v1"
                });

                c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
                {
                    Name = "Authorization",
                    Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
                    Scheme = "bearer",
                    BearerFormat = "JWT",
                    In = Microsoft.OpenApi.Models.ParameterLocation.Header,
                    Description = "Enter: Bearer {your JWT token}"
                });

                c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
                    {
                        {
                            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
                            {
                                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                                {
                                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                                    Id = "Bearer"
                                }
                            },
                            new string[] {}
                        }
                    });
            });

            var app = builder.Build();
            //app.UseMiddleware<JwtMiddleware>();

            // Migrate database
            using (var scope = app.Services.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                try
                {
                    Console.WriteLine("Database migrated successfully");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($" Database migration failed: {ex.Message}");
                }
            }
            //fake data seeding:

            // Migrate database và Seed dữ liệu khởi tạo
            using (var scope = app.Services.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                try
                {
                    dbContext.Database.Migrate();
                    Console.WriteLine(" Database migrated successfully");

                    // Kiểm tra xem đã có user nào trong database chưa
                    if (!dbContext.Users.Any())
                    {
                        var defaultUsers = new List<User>
                        {
                            new User
                            {
                                Id = Guid.NewGuid(),
                                Email = "admin@gmail.com",
                                PasswordHash = BCrypt.Net.BCrypt.HashPassword("123456"),
                                FullName = "Admin User",
                                CreatedAt = DateTime.UtcNow,
                                IsActive = true,
                                Role = "Admin" // Đảm bảo role này tương thích với Entity của bạn
                            },
                            new User
                            {
                                Id = Guid.NewGuid(),
                                Email = "test1@gmail.com",
                                PasswordHash = BCrypt.Net.BCrypt.HashPassword("123456"),
                                FullName = "Test User 1",
                                CreatedAt = DateTime.UtcNow,
                                IsActive = true,
                                Role = "User"
                            },
                            new User
                            {
                                Id = Guid.NewGuid(),
                                Email = "test2@gmail.com",
                                PasswordHash = BCrypt.Net.BCrypt.HashPassword("123456"),
                                FullName = "Test User 2",
                                CreatedAt = DateTime.UtcNow,
                                IsActive = true,
                                Role = "User"
                            }
                        };

                        dbContext.Users.AddRange(defaultUsers);
                        dbContext.SaveChanges();
                        Console.WriteLine("✓ 3 default users seeded successfully");
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"✗ Database migration or seeding failed: {ex.Message}");
                }
            }
            // Configure middleware

            app.UseSwagger();
            app.UseSwaggerUI();

            app.UseRouting();
            app.UseHttpsRedirection();

            app.UseCors("AllowReact");

            app.UseAuthentication();
            app.UseAuthorization();

            app.MapControllers();

            // Map SignalR hub
           // app.MapHub<DocumentHub>("/hubs/document");

            // Health check
            app.MapGet("/health", () => Results.Ok("Server is running"));

            app.Run();
        }
    }
}


