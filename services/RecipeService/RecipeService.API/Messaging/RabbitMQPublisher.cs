using RabbitMQ.Client;
using RecipeService.API.Messaging.Events;
using System.Text.Json;
using System.Text;
using Serilog;

namespace RecipeService.API.Messaging
{
    public class RabbitMQPublisher : IRabbitMQPublisher
    {
        private readonly IConfiguration _config;
        private readonly IConnection _connection;
        private readonly IModel _channel;
        private readonly Serilog.ILogger _logger;

        public RabbitMQPublisher(IConfiguration config)
        {
            _config = config;
            _logger = Log.ForContext<RabbitMQPublisher>();

            var factory = new ConnectionFactory()
            {
                HostName = _config["RabbitMQ:Host"] ?? "localhost"
            };

            _connection = factory.CreateConnection();
            _channel = _connection.CreateModel();

            _channel.ExchangeDeclare(exchange: "recipe_events", type: ExchangeType.Fanout);
            
            _logger.Information("RabbitMQPublisher initialized - Host: {Host}", _config["RabbitMQ:Host"] ?? "localhost");
        }

        public void PublishNewRecipe(NewRecipeCreated newRecipe)
        {
            _logger.Debug("Publishing new recipe event - RecipeId: {RecipeId}, Title: {Title}", newRecipe.RecipeId, newRecipe.Title);
            
            try
            {
                var json = JsonSerializer.Serialize(newRecipe);
                var body = Encoding.UTF8.GetBytes(json);

                _channel.BasicPublish(exchange: "recipe_events", routingKey: "", basicProperties: null, body: body);
                
                _logger.Information("NewRecipeCreated event published successfully - RecipeId: {RecipeId}, Title: {Title}", 
                    newRecipe.RecipeId, newRecipe.Title);
            }
            catch (Exception ex)
            {
                _logger.Error(ex, "Error publishing NewRecipeCreated event - RecipeId: {RecipeId}, Title: {Title}", 
                    newRecipe.RecipeId, newRecipe.Title);
                throw;
            }
        }
    }
}
