using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RecipeService.API.Data;
using RecipeService.API.Models;
using RecipeService.API.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;

namespace RecipeService.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AIController : ControllerBase
    {
        private readonly RecipeDbContext _context;
        private readonly HuggingFaceService _hfService;

        public AIController(RecipeDbContext context, IConfiguration configuration)
        {
            _context = context;
            var apiKey = configuration["DeepSeek:ApiKey"];
            _hfService = new HuggingFaceService(apiKey);
        }

        [HttpPost("ingredient-search")]
        public async Task<IActionResult> IngredientSearch([FromBody] IngredientSearchRequest request)
        {
            var ingredientsLower = request.Ingredients.Select(i => i.ToLower()).ToList();

            var allRecipes = await _context.Recipes
                .OrderByDescending(r => r.PopularityScore)
                .ToListAsync();

            var dbRecipes = allRecipes
                .Where(r =>
                    r.Ingredients.Any(i => ingredientsLower.Contains(i.ToLower())) ||
                    ingredientsLower.Any(ing => r.Title.ToLower().Contains(ing))
                )
                .Take(50)
                .ToList();

            var joinedIngredients = string.Join(", ", request.Ingredients);
            var aiPrompt = $"Elimde {joinedIngredients} var. Bu malzemelerle yapılabilecek 3 farklı yemek tarifi öner. Sadece JSON array döndür: [{{'title': 'Tarif adı', 'ingredients': 'Malzemeler', 'steps': 'Yapılış'}}]";
            var aiResponse = await _hfService.GenerateTextAsync(aiPrompt);
            
            Console.WriteLine($"AI Response: {aiResponse}");

            var aiRecipes = new List<AIRecipeDto>();
            try
            {
                aiRecipes = System.Text.Json.JsonSerializer.Deserialize<List<AIRecipeDto>>(aiResponse);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"AI yanıtı JSON parse hatası: {ex.Message}");
                
                try
                {
                    aiRecipes = ParseAIResponseManually(aiResponse);
                }
                catch (Exception parseEx)
                {
                    Console.WriteLine($"Manuel parse hatası: {parseEx.Message}");
                }
            }

            return Ok(new
            {
                dbRecipes,
                aiRecipes
            });
        }

        public class IngredientSearchRequest
        {
            public List<string> Ingredients { get; set; } = new();
        }

        public class AIRecipeDto
        {
            public string Title { get; set; }
            public string Ingredients { get; set; }
            public string Steps { get; set; }
        }

        private List<AIRecipeDto> ParseAIResponseManually(string response)
        {
            var recipes = new List<AIRecipeDto>();
            
            response = response.Replace("**", "").Replace("###", "").Replace("#", "");
            
            var recipeSections = response.Split(new[] { "\n\n", "\r\n\r\n" }, StringSplitOptions.RemoveEmptyEntries);
            
            foreach (var section in recipeSections)
            {
                if (string.IsNullOrWhiteSpace(section)) continue;
                
                var lines = section.Split('\n', StringSplitOptions.RemoveEmptyEntries);
                if (lines.Length < 3) continue;
                
                var recipe = new AIRecipeDto();
                var currentPart = "";
                var ingredients = new List<string>();
                var steps = new List<string>();
                
                foreach (var line in lines)
                {
                    var trimmedLine = line.Trim();
                    if (string.IsNullOrWhiteSpace(trimmedLine)) continue;
                    
                    if (trimmedLine.Contains(":") && !trimmedLine.Contains(".") && recipe.Title == null)
                    {
                        recipe.Title = trimmedLine.Split(':')[1].Trim();
                        continue;
                    }
                    
                    if (trimmedLine.ToLower().Contains("malzeme") || trimmedLine.ToLower().Contains("içindekiler"))
                    {
                        currentPart = "ingredients";
                        continue;
                    }
                    
                    if (trimmedLine.ToLower().Contains("yapılış") || trimmedLine.ToLower().Contains("hazırlanış") || trimmedLine.ToLower().Contains("adım"))
                    {
                        currentPart = "steps";
                        continue;
                    }

                    if (currentPart == "ingredients" && !trimmedLine.ToLower().Contains("yapılış"))
                    {
                        ingredients.Add(trimmedLine);
                    }
                    else if (currentPart == "steps")
                    {
                        steps.Add(trimmedLine);
                    }
                }
                
                if (recipe.Title == null && lines.Length > 0)
                {
                    recipe.Title = lines[0].Trim();
                }
                
                recipe.Ingredients = string.Join("\n", ingredients);
                recipe.Steps = string.Join("\n", steps);
                
                if (!string.IsNullOrWhiteSpace(recipe.Title) && 
                    (!string.IsNullOrWhiteSpace(recipe.Ingredients) || !string.IsNullOrWhiteSpace(recipe.Steps)))
                {
                    recipes.Add(recipe);
                }
            }
            
            return recipes;
        }
    }
} 