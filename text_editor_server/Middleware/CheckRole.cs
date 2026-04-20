using System.IdentityModel.Tokens.Jwt;

namespace text_editor_server.Middleware
{
    public class CheckRole
    {
    }
}


public class JwtMiddleware
{
    private readonly RequestDelegate _next;

    public JwtMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task Invoke(HttpContext context)
    {
        var token = context.Request.Headers["Authorization"]
            .FirstOrDefault()?.Split(" ").Last();

        if (token != null)
        {
            try
            {
                var handler = new JwtSecurityTokenHandler();
                var jwtToken = handler.ReadJwtToken(token);

                var userId = jwtToken.Claims
                    .First(x => x.Type == "sub").Value;

                context.Items["UserId"] = userId;
            }
            catch
            {
                // ignore nếu token lỗi
            }
        }

        await _next(context);
    }
}