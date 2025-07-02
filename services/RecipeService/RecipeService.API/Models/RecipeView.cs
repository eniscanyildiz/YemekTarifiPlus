using System;

namespace RecipeService.API.Models
{
    public class RecipeView
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid RecipeId { get; set; }
        public string? UserId { get; set; }
        public string? AnonId { get; set; }
        public DateTime ViewedAt { get; set; } = DateTime.UtcNow;
    }
} 