using System;

namespace RecipeService.API.Models
{
    public class RecipeLike
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid RecipeId { get; set; }
        public string? UserId { get; set; }
        public string? AnonId { get; set; }
        public DateTime LikedAt { get; set; } = DateTime.UtcNow;
    }
} 