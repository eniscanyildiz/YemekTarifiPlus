using Moq;
using RecipeService.API.Controllers;
using RecipeService.API.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RecipeService.Tests.Services
{
    public class RecipeServiceTests
    {
        private readonly Mock<Recipe> _mockRepo;
        private readonly RecipesController _recipeController;

        public RecipeServiceTests()
        {
            _mockRepo = new Mock<Recipe>();
            _recipeController = new RecipesController(_mockRepo.Object);
        }

        [Fact]
        public async Task CreateRecipe_ShouldReturnRecipeId()
        {
            // Arrange
            var newRecipe = new Recipe { Title = "Test", Ingredients = new[] { "Yumurta" } };

            _mockRepo.Setup(r => r.CreateAsync(It.IsAny<Recipe>()))
                     .ReturnsAsync(newRecipe);

            // Act
            var result = await _recipeService.CreateRecipe(newRecipe);

            // Assert
            result.Title.Should().Be("Test");
            _mockRepo.Verify(r => r.CreateAsync(It.IsAny<Recipe>()), Times.Once);
        }
    }
}
