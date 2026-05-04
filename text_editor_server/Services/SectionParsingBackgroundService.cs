using System.Threading.Channels;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace text_editor_server.Services
{
    public class SectionParsingBackgroundService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly Channel<Guid> _channel = Channel.CreateUnbounded<Guid>();

        public SectionParsingBackgroundService(IServiceProvider serviceProvider)
        {
            _serviceProvider = serviceProvider;
        }

        public void Enqueue(Guid documentId)
        {
            _channel.Writer.TryWrite(documentId);
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            await foreach (var documentId in _channel.Reader.ReadAllAsync(stoppingToken))
            {
                using var scope = _serviceProvider.CreateScope();
                var parser = scope.ServiceProvider.GetRequiredService<SectionParser>();

                await parser.ParseNow(documentId);
            }
        }
    }
}