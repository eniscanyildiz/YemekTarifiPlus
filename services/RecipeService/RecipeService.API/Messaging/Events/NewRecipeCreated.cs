namespace RecipeService.API.Messaging.Events
{
    public class NewRecipeCreated
    {
        public Guid RecipeId { get; set; }
        public string Title { get; set; } = null!;
        public string? AuthorId { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
