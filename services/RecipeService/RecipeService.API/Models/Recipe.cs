using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;

namespace RecipeService.API.Models
{
    public class Recipe
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public string Title { get; set; } = null!;

        public List<string> Ingredients { get; set; } = new();
        public List<string> Steps { get; set; } = new();
        public int Duration { get; set; }

        public Guid CategoryId { get; set; }
        public Category? Category { get; set; }

        public string? AuthorId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public List<RecipeMedia>? Media { get; set; }
    }

    public class RecipeMedia
    {
        public string Url { get; set; } = null!;
        public string Type { get; set; } = null!; // "image" veya "video"
    }
}
