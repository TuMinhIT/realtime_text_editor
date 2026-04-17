
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using text_editor_server.Data;
using text_editor_server.Hubs;
using text_editor_server.Services;

namespace text_editor_server
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Get JWT configuration
            var jwtSecret = builder.Configuration["Jwt:Secret"] ?? "your-super-secret-key-that-should-be-at-least-32-characters-long";
            var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "text-editor-server";
            var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "text-editor-client";

            // Add database
            var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
                ?? "Source=THOCODE\\SQLEXPRESS;Initial Catalog=KyNang;Integrated Security=True;Persist Security Info=False;Pooling=False;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=True;";
            
            builder.Services.AddDbContext<AppDbContext>(options =>
                options.UseSqlServer(connectionString));

            // Add services
            builder.Services.AddScoped<IAuthService, AuthService>();
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
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuerSigningKey = true,
                        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
                        ValidateIssuer = false,
                        ValidateAudience = false,
                        ClockSkew = TimeSpan.Zero
                    };

                    // SignalR token from query string
                    options.Events = new JwtBearerEvents
                    {
                        OnMessageReceived = context =>
                        {
                            var accessToken = context.Request.Query["access_token"];
                            if (!string.IsNullOrEmpty(accessToken) && context.HttpContext.WebSockets.IsWebSocketRequest)
                            {
                                context.Token = accessToken;
                            }
                            return Task.CompletedTask;
                        }
                    };
                });

            builder.Services.AddAuthorization();
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();

            var app = builder.Build();

            // Migrate database
            using (var scope = app.Services.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                try
                {
                    dbContext.Database.Migrate();
                    Console.WriteLine("✓ Database migrated successfully");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"✗ Database migration failed: {ex.Message}");
                }
            }

            // Configure middleware
          
                app.UseSwagger();
                app.UseSwaggerUI();
       

            app.UseHttpsRedirection();

            app.UseCors("AllowReact");

            app.UseAuthentication();
            app.UseAuthorization();

            app.MapControllers();

            // Map SignalR hub
            app.MapHub<DocumentHub>("/hubs/document");

            // Health check
            app.MapGet("/health", () => Results.Ok("Server is running"));

            app.Run();
        }
    }
}
