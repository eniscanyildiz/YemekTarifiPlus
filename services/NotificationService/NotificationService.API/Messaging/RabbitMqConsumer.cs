using RabbitMQ.Client.Events;
using RabbitMQ.Client;
using System.Text.Json;
using System.Text;
using Serilog;

namespace NotificationService.API.Messaging
{
    public class RabbitMqConsumer : BackgroundService
    {
        private readonly IConnection _connection;
        private readonly IModel _channel;
        private readonly IServiceProvider _serviceProvider;
        private readonly Serilog.ILogger _logger;

        public RabbitMqConsumer(IConfiguration config, IServiceProvider serviceProvider)
        {
            _serviceProvider = serviceProvider;
            _logger = Log.ForContext<RabbitMqConsumer>();

            try
            {
                var factory = new ConnectionFactory() { HostName = config["RabbitMQ:Host"] ?? "localhost" };
                _connection = factory.CreateConnection();
                _channel = _connection.CreateModel();

                _channel.ExchangeDeclare("recipe_events", ExchangeType.Fanout);
                var queueName = _channel.QueueDeclare().QueueName;
                _channel.QueueBind(queue: queueName, exchange: "recipe_events", routingKey: "");
                
                _logger.Information("RabbitMqConsumer initialized - Host: {Host}, Queue: {QueueName}", 
                    config["RabbitMQ:Host"] ?? "localhost", queueName);
            }
            catch (Exception ex)
            {
                _logger.Error(ex, "Error initializing RabbitMqConsumer");
                throw;
            }
        }

        protected override Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.Information("Starting RabbitMQ consumer...");
            
            var consumer = new AsyncEventingBasicConsumer(_channel);

            consumer.Received += async (model, ea) =>
            {
                _logger.Debug("Message received - DeliveryTag: {DeliveryTag}", ea.DeliveryTag);
                
                try
                {
                    var body = ea.Body.ToArray();
                    var message = Encoding.UTF8.GetString(body);

                    _logger.Debug("Processing message - Body: {Message}", message);

                    // Mesajı ayrıştır, türüne göre işlem yap
                    await HandleMessage(message);

                    _channel.BasicAck(ea.DeliveryTag, false);
                    _logger.Debug("Message acknowledged - DeliveryTag: {DeliveryTag}", ea.DeliveryTag);
                }
                catch (Exception ex)
                {
                    _logger.Error(ex, "Error processing message - DeliveryTag: {DeliveryTag}", ea.DeliveryTag);
                    _channel.BasicNack(ea.DeliveryTag, false, true);
                }
            };

            _channel.BasicConsume(queue: _channel.QueueDeclare().QueueName, autoAck: false, consumer: consumer);
            _logger.Information("RabbitMQ consumer started successfully");

            return Task.CompletedTask;
        }

        private async Task HandleMessage(string message)
        {
            _logger.Debug("Handling message - Message: {Message}", message);
            
            try
            {
                // Örnek mesaj ayrıştırma (geliştirilebilir)
                using var doc = JsonDocument.Parse(message);
                var root = doc.RootElement;

                if (root.TryGetProperty("commentId", out var commentId))
                {
                    // Yeni yorum bildirimi
                    _logger.Information("New comment notification - CommentId: {CommentId}", commentId.GetString());
                    await SendNotificationAsync("Yeni yorum eklendi!");
                }
                else if (root.TryGetProperty("recipeId", out var recipeId))
                {
                    // Yeni tarif bildirimi
                    _logger.Information("New recipe notification - RecipeId: {RecipeId}", recipeId.GetString());
                    await SendNotificationAsync("Yeni tarif eklendi!");
                }
                else
                {
                    _logger.Warning("Unknown message format - Message: {Message}", message);
                }
            }
            catch (Exception ex)
            {
                _logger.Error(ex, "Error handling message - Message: {Message}", message);
                throw;
            }
        }

        private Task SendNotificationAsync(string text)
        {
            _logger.Information("Sending notification - Text: {Text}", text);
            
            try
            {
                // Burada gerçek email, SMS, push notification gönderimi yapılacak
                _logger.Information("Notification sent successfully - Text: {Text}", text);
                return Task.CompletedTask;
            }
            catch (Exception ex)
            {
                _logger.Error(ex, "Error sending notification - Text: {Text}", text);
                throw;
            }
        }

        public override void Dispose()
        {
            _logger.Information("Disposing RabbitMqConsumer");
            _channel?.Close();
            _connection?.Close();
            base.Dispose();
        }
    }
}
