using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RecipeService.API.Data;
using RecipeService.API.Messaging;
using RecipeService.API.Messaging.Events;
using RecipeService.API.Models;
using RecipeService.API.Services;
using Serilog;
using Microsoft.Extensions.Configuration;

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
        private readonly HuggingFaceService _hfService;

        public RecipesController(RecipeDbContext context, IRabbitMQPublisher publisher, ICacheService cacheService, IConfiguration configuration)
        {
            _context = context;
            _publisher = publisher;
            _cacheService = cacheService;
            _logger = Log.ForContext<RecipesController>();
            var apiKey = configuration["DeepSeek:ApiKey"];
            _hfService = new HuggingFaceService(apiKey);
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            _logger.Information("Getting all recipes");
            
            var cacheKey = "recipes:all";
            var cachedRecipes = await _cacheService.GetAsync<List<Recipe>>(cacheKey);
            
            if (cachedRecipes != null)
            {
                _logger.Information("Retrieved {Count} recipes from cache", cachedRecipes.Count);
                return Ok(cachedRecipes);
            }

            var recipes = await _context.Recipes.ToListAsync();
            
            await _cacheService.SetAsync(cacheKey, recipes);
            
            _logger.Information("Retrieved {Count} recipes from database and cached", recipes.Count);
            return Ok(recipes);
        }

        [HttpGet("filter")]
        public async Task<IActionResult> Filter([FromQuery] Guid? categoryId, [FromQuery] int? maxDuration, [FromQuery] string? ingredient, [FromQuery] string? searchTerm)
        {
            _logger.Information("Filtering recipes - CategoryId: {CategoryId}, MaxDuration: {MaxDuration}, Ingredient: {Ingredient}, SearchTerm: {SearchTerm}", 
                categoryId, maxDuration, ingredient, searchTerm);
            
            var cacheKey = $"recipes:filter:cat_{categoryId}:dur_{maxDuration}:ing_{ingredient}:search_{searchTerm}";
            var cachedRecipes = await _cacheService.GetAsync<List<Recipe>>(cacheKey);
            if (cachedRecipes != null)
            {
                _logger.Information("Retrieved {Count} filtered recipes from cache", cachedRecipes.Count);
                return Ok(cachedRecipes);
            }

            var query = _context.Recipes
                .Include(r => r.Category)
                .AsQueryable();

            if (categoryId.HasValue)
                query = query.Where(r => r.CategoryId == categoryId.Value);

            if (maxDuration.HasValue)
                query = query.Where(r => r.Duration <= maxDuration.Value);

            if (!string.IsNullOrEmpty(ingredient))
                query = query.Where(r => r.Ingredients.Any(i => i.ToLower() == ingredient.ToLower()));

            if (!string.IsNullOrEmpty(searchTerm))
            {
                var searchLower = searchTerm.ToLower();
                query = query.Where(r =>
                    r.Title.ToLower().Contains(searchLower) ||
                    (r.Category != null && r.Category.Name.ToLower().Contains(searchLower))
                );
            }

            var filteredRecipes = await query.ToListAsync();

            if (!string.IsNullOrEmpty(searchTerm))
            {
                var searchLower = searchTerm.ToLower();
                filteredRecipes = filteredRecipes
                    .Where(r =>
                        r.Title.ToLower().Contains(searchLower) ||
                        (r.Category != null && r.Category.Name.ToLower().Contains(searchLower)) ||
                        r.Ingredients.Any(i => i != null && i.ToLower().Contains(searchLower))
                    )
                    .ToList();
            }

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
            
            var cacheKey = $"recipes:detail:{id}";
            var cachedRecipe = await _cacheService.GetAsync<Recipe>(cacheKey);
            
            if (cachedRecipe != null)
            {
                _logger.Information("Retrieved recipe from cache - RecipeId: {RecipeId}", id);
                return Ok(cachedRecipe);
            }

            var recipe = await _context.Recipes.FindAsync(id);
            if (recipe == null)
            {
                _logger.Warning("Recipe not found - RecipeId: {RecipeId}", id);
                return NotFound();
            }
            
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

        [HttpGet("trending")]
        public async Task<IActionResult> GetTrendingRecipes([FromQuery] int limit = 6)
        {
            _logger.Information("Getting trending recipes - Limit: {Limit}", limit);

            var cacheKey = $"recipes:trending:{limit}";
            var cachedRecipes = await _cacheService.GetAsync<List<Recipe>>(cacheKey);
            
            if (cachedRecipes != null)
            {
                _logger.Information("Retrieved {Count} trending recipes from cache", cachedRecipes.Count);
                return Ok(cachedRecipes);
            }

            var trendingRecipes = await _context.Recipes
                .OrderByDescending(r => r.PopularityScore)
                .ThenByDescending(r => r.CreatedAt)
                .Take(limit)
                .ToListAsync();
            
            await _cacheService.SetAsync(cacheKey, trendingRecipes, TimeSpan.FromMinutes(15));
            
            _logger.Information("Retrieved {Count} trending recipes from database and cached", trendingRecipes.Count);
            return Ok(trendingRecipes);
        }

        [HttpPost("{id}/view")]
        public async Task<IActionResult> IncrementViewCount(Guid id)
        {
            _logger.Information("Incrementing view count for recipe - RecipeId: {RecipeId}", id);
            var recipe = await _context.Recipes.FindAsync(id);
            if (recipe == null)
            {
                _logger.Warning("Recipe not found for view increment - RecipeId: {RecipeId}", id);
                return NotFound();
            }

            string? userId = null;
            string? anonId = null;

            if (User.Identity != null && User.Identity.IsAuthenticated)
            {
                userId = User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value;
            }   

            bool alreadyViewed = await _context.RecipeViews.AnyAsync(rv => rv.RecipeId == id && (rv.UserId == userId || rv.AnonId == anonId));
            if (alreadyViewed)
            {
                _logger.Information("View already counted for this user/anon - RecipeId: {RecipeId}, UserId: {UserId}, AnonId: {AnonId}", id, userId, anonId);
                return Ok(new { ViewCount = recipe.ViewCount, PopularityScore = recipe.PopularityScore });
            }

            var view = new RecipeView
            {
                RecipeId = id,
                UserId = userId,
                AnonId = anonId
            };
            _context.RecipeViews.Add(view);
            recipe.ViewCount++;
            await UpdatePopularityScore(recipe);
            await _context.SaveChangesAsync();

            await _cacheService.RemoveByPatternAsync("recipes:*");

            _logger.Information("View count incremented for recipe - RecipeId: {RecipeId}, New ViewCount: {ViewCount}", id, recipe.ViewCount);
            return Ok(new { ViewCount = recipe.ViewCount, PopularityScore = recipe.PopularityScore });
        }

        [HttpPost("{id}/like")]
        public async Task<IActionResult> IncrementLikeCount(Guid id)
        {
            _logger.Information("Incrementing like count for recipe - RecipeId: {RecipeId}", id);
            var recipe = await _context.Recipes.FindAsync(id);
            if (recipe == null)
            {
                _logger.Warning("Recipe not found for like increment - RecipeId: {RecipeId}", id);
                return NotFound();
            }

            if (User.Identity == null || !User.Identity.IsAuthenticated)
            {
                _logger.Warning("Like attempt without authentication - RecipeId: {RecipeId}", id);
                return Unauthorized("Giriş yapmanız gerekiyor.");
            }

            var userId = User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                _logger.Warning("User ID not found in token");
                return Unauthorized("Giriş yapmanız gerekiyor.");
            }

            bool alreadyLiked = await _context.RecipeLikes.AnyAsync(rl => rl.RecipeId == id && rl.UserId == userId);
            if (alreadyLiked)
            {
                _logger.Information("Like already counted for this user - RecipeId: {RecipeId}, UserId: {UserId}", id, userId);
                return Ok(new { LikeCount = recipe.LikeCount, PopularityScore = recipe.PopularityScore });
            }

            var like = new RecipeLike
            {
                RecipeId = id,
                UserId = userId
            };
            _context.RecipeLikes.Add(like);
            recipe.LikeCount++;
            await UpdatePopularityScore(recipe);
            await _context.SaveChangesAsync();

            await _cacheService.RemoveByPatternAsync("recipes:*");

            _logger.Information("Like count incremented for recipe - RecipeId: {RecipeId}, New LikeCount: {LikeCount}", id, recipe.LikeCount);
            return Ok(new { LikeCount = recipe.LikeCount, PopularityScore = recipe.PopularityScore });
        }

        [HttpPost("{id}/comment")]
        public async Task<IActionResult> IncrementCommentCount(Guid id)
        {
            _logger.Information("Incrementing comment count for recipe - RecipeId: {RecipeId}", id);
            
            var recipe = await _context.Recipes.FindAsync(id);
            if (recipe == null)
            {
                _logger.Warning("Recipe not found for comment increment - RecipeId: {RecipeId}", id);
                return NotFound();
            }

            recipe.CommentCount++;
            await UpdatePopularityScore(recipe);
            await _context.SaveChangesAsync();
            
            await _cacheService.RemoveByPatternAsync("recipes:*");
            
            _logger.Information("Comment count incremented for recipe - RecipeId: {RecipeId}, New CommentCount: {CommentCount}", id, recipe.CommentCount);
            return Ok(new { CommentCount = recipe.CommentCount, PopularityScore = recipe.PopularityScore });
        }

        [HttpPost("{id}/isliked")]
        public async Task<IActionResult> IsRecipeLiked(Guid id)
        {
            if (User.Identity == null || !User.Identity.IsAuthenticated)
                return Ok(new { liked = false });

            var userId = User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value;
            if (string.IsNullOrEmpty(userId))
                return Ok(new { liked = false });

            bool alreadyLiked = await _context.RecipeLikes.AnyAsync(rl => rl.RecipeId == id && rl.UserId == userId);
            return Ok(new { liked = alreadyLiked });
        }

        private async Task UpdatePopularityScore(Recipe recipe)
        {
            recipe.PopularityScore = (recipe.ViewCount * 0.1) + (recipe.LikeCount * 2) + (recipe.CommentCount * 3);
        }

        [HttpPost("suggest-title")]
        public async Task<IActionResult> SuggestTitle([FromBody] string description)
        {
            var prompt = $"Bir yemek tarifi açıklaması: {description}\nBuna uygun yaratıcı bir başlık öner: ";
            var suggestion = await _hfService.GenerateTextAsync(prompt);
            return Ok(new { title = suggestion });
        }
    }
}
