using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RecipeService.API.Data;
using RecipeService.API.Messaging;
using RecipeService.API.Messaging.Events;
using RecipeService.API.Models;
using RecipeService.API.Services;
using Serilog;

namespace RecipeService.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RecipesController : ControllerBase
    {
        private readonly RecipeDbContext _context;
        private readonly IRabbitMQPublisher _publisher;
        private readonly ICacheService _cacheService;
        private readonly Serilog.ILogger _logger;

        public RecipesController(RecipeDbContext context, IRabbitMQPublisher publisher, ICacheService cacheService)
        {
            _context = context;
            _publisher = publisher;
            _cacheService = cacheService;
            _logger = Log.ForContext<RecipesController>();
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            _logger.Information("Getting all recipes");
            
            // Try to get from cache first
            var cacheKey = "recipes:all";
            var cachedRecipes = await _cacheService.GetAsync<List<Recipe>>(cacheKey);
            
            if (cachedRecipes != null)
            {
                _logger.Information("Retrieved {Count} recipes from cache", cachedRecipes.Count);
                return Ok(cachedRecipes);
            }

            // If not in cache, get from database
            var recipes = await _context.Recipes.ToListAsync();
            
            // Store in cache for 30 minutes
            await _cacheService.SetAsync(cacheKey, recipes);
            
            _logger.Information("Retrieved {Count} recipes from database and cached", recipes.Count);
            return Ok(recipes);
        }

        [HttpGet("filter")]
        public async Task<IActionResult> Filter([FromQuery] Guid? categoryId, [FromQuery] int? maxDuration, [FromQuery] string? ingredient)
        {
            _logger.Information("Filtering recipes - CategoryId: {CategoryId}, MaxDuration: {MaxDuration}, Ingredient: {Ingredient}", 
                categoryId, maxDuration, ingredient);
            
            // Create cache key based on filter parameters
            var cacheKey = $"recipes:filter:cat_{categoryId}:dur_{maxDuration}:ing_{ingredient}";
            
            // Try to get from cache first
            var cachedRecipes = await _cacheService.GetAsync<List<Recipe>>(cacheKey);
            
            if (cachedRecipes != null)
            {
                _logger.Information("Retrieved {Count} filtered recipes from cache", cachedRecipes.Count);
                return Ok(cachedRecipes);
            }

            // If not in cache, get from database
            var query = _context.Recipes.AsQueryable();

            if (categoryId.HasValue)
                query = query.Where(r => r.CategoryId == categoryId.Value);

            if (maxDuration.HasValue)
                query = query.Where(r => r.Duration <= maxDuration.Value);

            if (!string.IsNullOrEmpty(ingredient))
                query = query.Where(r => r.Ingredients.Any(i => i.ToLower().Contains(ingredient.ToLower())));

            var filteredRecipes = await query.ToListAsync();
            
            // Store in cache for 30 minutes
            await _cacheService.SetAsync(cacheKey, filteredRecipes);
            
            _logger.Information("Retrieved {Count} filtered recipes from database and cached", filteredRecipes.Count);
            return Ok(filteredRecipes);
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Create([FromBody] Recipe recipe)
        {
            var userIdClaim = User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value;
            
            _logger.Information("Creating new recipe - Title: {Title}, AuthorId: {AuthorId}", recipe.Title, userIdClaim);
            
            var categoryExists = await _context.Categories.AnyAsync(c => c.Id == recipe.CategoryId);
            if (!categoryExists)
            {
                _logger.Warning("Category not found - CategoryId: {CategoryId}", recipe.CategoryId);
                return BadRequest("Kategori bulunamadı.");
            }

            if (string.IsNullOrEmpty(userIdClaim))
            {
                _logger.Warning("User ID not found in token");
                return Unauthorized("Token'da kullanıcı bilgisi yok.");
            }

            recipe.AuthorId = userIdClaim;

            try
            {
                _context.Recipes.Add(recipe);
                await _context.SaveChangesAsync();

                // Clear related caches
                await _cacheService.RemoveByPatternAsync("recipes:*");

                var newEvent = new NewRecipeCreated
                {
                    RecipeId = recipe.Id,
                    Title = recipe.Title,
                    AuthorId = recipe.AuthorId,
                    CreatedAt = recipe.CreatedAt
                };

                _publisher.PublishNewRecipe(newEvent);

                _logger.Information("Recipe created successfully - RecipeId: {RecipeId}, Title: {Title}", recipe.Id, recipe.Title);
                return CreatedAtAction(nameof(GetById), new { id = recipe.Id }, recipe);
            }
            catch (Exception ex)
            {
                _logger.Error(ex, "Error creating recipe - Title: {Title}", recipe.Title);
                throw;
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            _logger.Information("Getting recipe by ID: {RecipeId}", id);
            
            // Try to get from cache first
            var cacheKey = $"recipes:detail:{id}";
            var cachedRecipe = await _cacheService.GetAsync<Recipe>(cacheKey);
            
            if (cachedRecipe != null)
            {
                _logger.Information("Retrieved recipe from cache - RecipeId: {RecipeId}", id);
                return Ok(cachedRecipe);
            }

            // If not in cache, get from database
            var recipe = await _context.Recipes.FindAsync(id);
            if (recipe == null)
            {
                _logger.Warning("Recipe not found - RecipeId: {RecipeId}", id);
                return NotFound();
            }
            
            // Store in cache for 30 minutes
            await _cacheService.SetAsync(cacheKey, recipe);
            
            _logger.Information("Retrieved recipe from database and cached - RecipeId: {RecipeId}, Title: {Title}", id, recipe.Title);
            return Ok(recipe);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            _logger.Information("Deleting recipe - RecipeId: {RecipeId}", id);
            
            var recipe = await _context.Recipes.FindAsync(id);
            if (recipe == null)
            {
                _logger.Warning("Recipe not found for deletion - RecipeId: {RecipeId}", id);
                return NotFound();
            }

            try
            {
                _context.Recipes.Remove(recipe);
                await _context.SaveChangesAsync();
                
                // Clear related caches
                await _cacheService.RemoveByPatternAsync("recipes:*");
                
                _logger.Information("Recipe deleted successfully - RecipeId: {RecipeId}, Title: {Title}", id, recipe.Title);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.Error(ex, "Error deleting recipe - RecipeId: {RecipeId}", id);
                throw;
            }
        }
    }
}
