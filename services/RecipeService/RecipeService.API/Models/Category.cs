using System.ComponentModel.DataAnnotations;

namespace RecipeService.API.Models
{
    public class Category
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public string Name { get; set; } = null!;
    }
}
