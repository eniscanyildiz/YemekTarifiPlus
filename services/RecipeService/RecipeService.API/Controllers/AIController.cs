using Microsoft.AspNetCore.Mvc;
using RecipeService.API.Models;
using RecipeService.API.Data;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Net.Http;
using System.Text.Json;

namespace RecipeService.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AIController : ControllerBase
    {
        private readonly RecipeDbContext _context;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly string _spoonacularBaseUrl = "http://localhost:5177/api/Spoonacular/search";

        public AIController(RecipeDbContext context, IHttpClientFactory httpClientFactory)
        {
            _context = context;
            _httpClientFactory = httpClientFactory;
        }

        // Sitedeki tariflerle kıyaslama ve AI önerisi burada olacak
        [HttpPost("suggest")]
        public async Task<IActionResult> Suggest([FromBody] SuggestRequest request)
        {
            // 1. Kullanıcı prompt'unu malzeme listesine çevir
            var userIngredients = request.Prompt
                .Split(new[] { ',', '\n', ';' }, System.StringSplitOptions.RemoveEmptyEntries)
                .Select(i => i.Trim().ToLower())
                .Where(i => !string.IsNullOrWhiteSpace(i))
                .ToList();

            // 2. Tüm tarifleri çek
            var allRecipes = _context.Recipes.ToList();

            // 3. Eşleşme skoruna göre sırala (en çok ortak malzeme)
            var matchedRecipes = allRecipes
                .Select(r => new {
                    Recipe = r,
                    MatchCount = r.Ingredients.Count(ing => userIngredients.Contains(ing.ToLower()))
                })
                .Where(x => x.MatchCount > 0)
                .OrderByDescending(x => x.MatchCount)
                .ThenByDescending(x => x.Recipe.PopularityScore)
                .Take(5)
                .Select(x => x.Recipe)
                .ToList();

            // 4. Spoonacular'dan öneri çek
            var httpClient = _httpClientFactory.CreateClient();
            var query = string.Join(",", userIngredients);
            var response = await httpClient.GetAsync($"{_spoonacularBaseUrl}?query={Uri.EscapeDataString(query)}");
            response.EnsureSuccessStatusCode();
            var spoonacularJson = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(spoonacularJson);
            var results = doc.RootElement.GetProperty("results");
            var siteRecipeTitles = allRecipes.Select(r => r.Title.ToLower()).ToHashSet();
            var spoonacularSuggestions = new List<object>();
            foreach (var item in results.EnumerateArray())
            {
                var title = item.GetProperty("title").GetString()?.ToLower();
                if (title != null && !siteRecipeTitles.Contains(title))
                {
                    spoonacularSuggestions.Add(new {
                        title = item.GetProperty("title").GetString(),
                        image = item.TryGetProperty("image", out var img) ? img.GetString() : null,
                        id = item.TryGetProperty("id", out var idProp) ? idProp.GetInt32() : 0
                    });
                    if (spoonacularSuggestions.Count == 3) break;
                }
            }

            return Ok(new {
                matchedRecipes,
                spoonacularSuggestions,
                debug = new {
                    userIngredients,
                    allRecipeTitles = allRecipes.Select(r => r.Title).ToList(),
                    spoonacularRaw = results.ToString()
                }
            });
        }
    }

    public class SuggestRequest
    {
        public string Prompt { get; set; } = string.Empty;
    }
} 