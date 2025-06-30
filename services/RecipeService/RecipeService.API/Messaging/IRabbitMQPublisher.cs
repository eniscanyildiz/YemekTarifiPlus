using RecipeService.API.Messaging.Events;

namespace RecipeService.API.Messaging
{
    public interface IRabbitMQPublisher
    {
        void PublishNewRecipe(NewRecipeCreated newRecipe);
    }
}
