using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Bson;

namespace CommentService.API.Models
{
    public class Comment
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("recipeId")]
        public string RecipeId { get; set; } = null!;

        [BsonElement("userId")]
        public string UserId { get; set; } = null!;

        [BsonElement("content")]
        public string Content { get; set; } = null!;

        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("userName")]
        public string UserName { get; set; } = string.Empty;
    }
}
