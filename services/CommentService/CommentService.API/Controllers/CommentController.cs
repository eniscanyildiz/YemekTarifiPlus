using CommentService.API.Messaging;
using CommentService.API.Models;
using CommentService.API.Repositories;
using CommentService.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Serilog;
using System.Net.Http;
using System.Text.Json;

namespace CommentService.API.Controllers
{
    [ApiController]
    [Route("api/comments")]
    public class CommentController : ControllerBase
    {
        private readonly CommentRepository _repository;
        private readonly CommentEventPublisher _publisher;
        private readonly ICacheService _cacheService;
        private readonly Serilog.ILogger _logger;
        private readonly HttpClient _httpClient;

        public CommentController(CommentRepository repository, CommentEventPublisher publisher, ICacheService cacheService)
        {
            _repository = repository;
            _publisher = publisher;
            _cacheService = cacheService;
            _logger = Log.ForContext<CommentController>();
            _httpClient = new HttpClient();
        }

        [HttpGet("{recipeId}")]
        public async Task<IActionResult> GetComments(string recipeId)
        {
            _logger.Information("Getting comments for recipe - RecipeId: {RecipeId}", recipeId);
            
            if (string.IsNullOrEmpty(recipeId))
            {
                _logger.Warning("GetComments failed - RecipeId is empty");
                return BadRequest("RecipeId is required.");
            }

            // Try to get from cache first
            var cacheKey = $"comments:recipe:{recipeId}";
            var cachedComments = await _cacheService.GetAsync<List<Comment>>(cacheKey);
            
            if (cachedComments != null)
            {
                _logger.Information("Retrieved comments from cache - RecipeId: {RecipeId}, Count: {Count}", recipeId, cachedComments.Count);
                return Ok(cachedComments);
            }

            // If not in cache, get from database
            var comments = await _repository.GetByRecipeIdAsync(recipeId);
            
            // Fill UserName for each comment
            foreach (var comment in comments)
            {
                if (string.IsNullOrEmpty(comment.UserName))
                {
                    try
                    {
                        var userServiceUrl = $"http://localhost:7071/api/Users/{comment.UserId}";
                        var response = await _httpClient.GetAsync(userServiceUrl);
                        if (response.IsSuccessStatusCode)
                        {
                            var json = await response.Content.ReadAsStringAsync();
                            using var doc = JsonDocument.Parse(json);
                            var root = doc.RootElement;
                            var firstName = root.GetProperty("firstName").GetString();
                            var lastName = root.GetProperty("lastName").GetString();
                            comment.UserName = $"{firstName} {lastName}";
                        }
                    }
                    catch
                    {
                        comment.UserName = "Kullanıcı";
                    }
                }
            }
            
            // Store in cache for 30 minutes
            await _cacheService.SetAsync(cacheKey, comments);
            
            _logger.Information("Retrieved comments from database and cached - RecipeId: {RecipeId}, Count: {Count}", recipeId, comments.Count);
            return Ok(comments);
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> AddComment([FromBody] Comment comment)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            
            _logger.Information("Adding comment - RecipeId: {RecipeId}, UserId: {UserId}, ContentLength: {ContentLength}", 
                comment.RecipeId, userId, comment.Content?.Length ?? 0);
            
            if (string.IsNullOrWhiteSpace(comment.Content))
            {
                _logger.Warning("AddComment failed - Content is empty");
                return BadRequest("Content cannot be empty.");
            }

            if (userId == null)
            {
                _logger.Warning("AddComment failed - User ID not found in token");
                return Unauthorized();
            }

            var userCommentCount = (await _repository.GetByRecipeIdAsync(comment.RecipeId)).Count(c => c.UserId == userId);
            if (userCommentCount >= 5)
            {
                _logger.Warning("AddComment failed - User has already added 5 comments to this recipe. RecipeId: {RecipeId}, UserId: {UserId}", comment.RecipeId, userId);
                return BadRequest("Bir tarife en fazla 5 yorum ekleyebilirsiniz.");
            }

            try
            {
                comment.UserId = userId;
                comment.CreatedAt = DateTime.UtcNow;

                try
                {
                    var userServiceUrl = $"http://localhost:7071/api/Users/{userId}";
                    var response = await _httpClient.GetAsync(userServiceUrl);
                    if (response.IsSuccessStatusCode)
                    {
                        var json = await response.Content.ReadAsStringAsync();
                        using var doc = JsonDocument.Parse(json);
                        var root = doc.RootElement;
                        var firstName = root.GetProperty("firstName").GetString();
                        var lastName = root.GetProperty("lastName").GetString();
                        comment.UserName = $"{firstName} {lastName}";
                    }
                    else
                    {
                        comment.UserName = string.Empty;
                    }
                }
                catch
                {
                    comment.UserName = string.Empty;
                }

                await _repository.AddCommentAsync(comment);

                await _cacheService.RemoveByPatternAsync($"comments:recipe:{comment.RecipeId}");
                await _cacheService.RemoveByPatternAsync($"comments:count:{comment.RecipeId}");
                await _cacheService.RemoveByPatternAsync($"comments:user:{userId}");
                await _cacheService.RemoveByPatternAsync("comments:popular");

                try
                {
                    var recipeServiceUrl = $"http://localhost:7241/api/Recipes/{comment.RecipeId}/comment";
                    var response = await _httpClient.PostAsync(recipeServiceUrl, null);
                    if (response.IsSuccessStatusCode)
                    {
                        _logger.Information("Comment count incremented in RecipeService - RecipeId: {RecipeId}", comment.RecipeId);
                    }
                    else
                    {
                        _logger.Warning("Failed to increment comment count in RecipeService - RecipeId: {RecipeId}, Status: {Status}", 
                            comment.RecipeId, response.StatusCode);
                    }
                }
                catch (Exception ex)
                {
                    _logger.Error(ex, "Error incrementing comment count in RecipeService - RecipeId: {RecipeId}", comment.RecipeId);
                }

                _publisher.PublishNewComment(comment);

                _logger.Information("Comment added successfully - CommentId: {CommentId}, RecipeId: {RecipeId}, UserId: {UserId}", 
                    comment.Id, comment.RecipeId, userId);
                return CreatedAtAction(nameof(GetComments), new { recipeId = comment.RecipeId }, comment);
            }
            catch (Exception ex)
            {
                _logger.Error(ex, "Error adding comment - RecipeId: {RecipeId}, UserId: {UserId}", comment.RecipeId, userId);
                throw;
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteComment(string id)
        {
            _logger.Information("Deleting comment - CommentId: {CommentId}", id);
            
            var comment = await _repository.GetByIdAsync(id);
            if (comment == null)
            {
                _logger.Warning("Comment not found for deletion - CommentId: {CommentId}", id);
                return NotFound();
            }

            try
            {
                await _repository.DeleteCommentAsync(id);
                await _cacheService.RemoveByPatternAsync($"comments:recipe:{comment.RecipeId}");
                await _cacheService.RemoveByPatternAsync($"comments:count:{comment.RecipeId}");
                await _cacheService.RemoveByPatternAsync($"comments:user:{comment.UserId}");
                await _cacheService.RemoveByPatternAsync("comments:popular");

                _logger.Information("Comment deleted successfully - CommentId: {CommentId}, RecipeId: {RecipeId}, UserId: {UserId}", 
                    id, comment.RecipeId, comment.UserId);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.Error(ex, "Error deleting comment - CommentId: {CommentId}", id);
                throw;
            }
        }
    }
}
