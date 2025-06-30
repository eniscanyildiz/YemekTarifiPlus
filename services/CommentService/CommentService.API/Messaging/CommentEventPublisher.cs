using CommentService.API.Models;
using RabbitMQ.Client;
using System.Text.Json;
using System.Text;
using Serilog;

namespace CommentService.API.Messaging
{
    public class CommentEventPublisher : IDisposable
    {
        private readonly IConnection _connection;
        private readonly IModel _channel;
        private readonly Serilog.ILogger _logger;

        public CommentEventPublisher(IConfiguration config)
        {
            var factory = new ConnectionFactory() { HostName = config["RabbitMQ:Host"] ?? "localhost" };
            _connection = factory.CreateConnection();
            _channel = _connection.CreateModel();
            _logger = Log.ForContext<CommentEventPublisher>();

            _channel.ExchangeDeclare("recipe_events", ExchangeType.Fanout);
            
            _logger.Information("CommentEventPublisher initialized - RabbitMQ Host: {Host}", config["RabbitMQ:Host"] ?? "localhost");
        }

        public void PublishNewComment(Comment comment)
        {
            _logger.Debug("Publishing new comment event - CommentId: {CommentId}, RecipeId: {RecipeId}, UserId: {UserId}", 
                comment.Id, comment.RecipeId, comment.UserId);
            
            try
            {
                var message = JsonSerializer.Serialize(new
                {
                    commentId = comment.Id,
                    recipeId = comment.RecipeId,
                    userId = comment.UserId
                });

                var body = Encoding.UTF8.GetBytes(message);
                _channel.BasicPublish(exchange: "recipe_events", routingKey: "", body: body);
                
                _logger.Information("New comment event published successfully - CommentId: {CommentId}, RecipeId: {RecipeId}", 
                    comment.Id, comment.RecipeId);
            }
            catch (Exception ex)
            {
                _logger.Error(ex, "Error publishing new comment event - CommentId: {CommentId}, RecipeId: {RecipeId}", 
                    comment.Id, comment.RecipeId);
                throw;
            }
        }

        public void Dispose()
        {
            _logger.Information("Disposing CommentEventPublisher");
            _channel?.Close();
            _connection?.Close();
        }
    }
}
