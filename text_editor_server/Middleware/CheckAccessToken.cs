namespace text_editor_server.Middleware
{
    public class CheckAccessToken
    {
        private readonly RequestDelegate _next;

        public CheckAccessToken(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            if (context.Items["UserId"] == null)
            {
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                await context.Response.WriteAsync("Unauthorized");
                return;
            }

            await _next(context);
        }

    }
}
