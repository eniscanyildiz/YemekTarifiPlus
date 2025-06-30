using CommentService.API.Models;
using CommentService.API.Settings;
using MongoDB.Driver;
using Serilog;

namespace CommentService.API.Repositories
{
    public class CommentRepository
    {
        private readonly IMongoCollection<Comment> _comments;
        private readonly Serilog.ILogger _logger;

        public CommentRepository(MongoSettings settings)
        {
            var client = new MongoClient(settings.ConnectionString);
            var database = client.GetDatabase(settings.DatabaseName);
            _comments = database.GetCollection<Comment>(settings.CommentsCollectionName);
            _logger = Log.ForContext<CommentRepository>();
            
            _logger.Information("CommentRepository initialized - Database: {Database}, Collection: {Collection}", 
                settings.DatabaseName, settings.CommentsCollectionName);
        }

        public async Task<List<Comment>> GetByRecipeIdAsync(string recipeId)
        {
            _logger.Debug("Getting comments by recipe ID - RecipeId: {RecipeId}", recipeId);
            
            try
            {
                var comments = await _comments.Find(c => c.RecipeId == recipeId).ToListAsync();
                _logger.Debug("Retrieved {Count} comments for recipe - RecipeId: {RecipeId}", comments.Count, recipeId);
                return comments;
            }
            catch (Exception ex)
            {
                _logger.Error(ex, "Error getting comments by recipe ID - RecipeId: {RecipeId}", recipeId);
                throw;
            }
        }
        
        public async Task<Comment> GetByIdAsync(string commentId)
        {
            _logger.Debug("Getting comment by ID - CommentId: {CommentId}", commentId);
            
            try
            {
                var comment = await _comments.Find(c => c.Id == commentId).FirstOrDefaultAsync();
                if (comment == null)
                {
                    _logger.Debug("Comment not found - CommentId: {CommentId}", commentId);
                }
                else
                {
                    _logger.Debug("Comment found - CommentId: {CommentId}, RecipeId: {RecipeId}", commentId, comment.RecipeId);
                }
                return comment;
            }
            catch (Exception ex)
            {
                _logger.Error(ex, "Error getting comment by ID - CommentId: {CommentId}", commentId);
                throw;
            }
        }

        public async Task AddCommentAsync(Comment comment)
        {
            _logger.Debug("Adding new comment - RecipeId: {RecipeId}, UserId: {UserId}", comment.RecipeId, comment.UserId);
            
            try
            {
                await _comments.InsertOneAsync(comment);
                _logger.Information("Comment added successfully - CommentId: {CommentId}, RecipeId: {RecipeId}, UserId: {UserId}", 
                    comment.Id, comment.RecipeId, comment.UserId);
            }
            catch (Exception ex)
            {
                _logger.Error(ex, "Error adding comment - RecipeId: {RecipeId}, UserId: {UserId}", comment.RecipeId, comment.UserId);
                throw;
            }
        }

        public async Task DeleteCommentAsync(string commentId)
        {
            _logger.Debug("Deleting comment - CommentId: {CommentId}", commentId);
            try
            {
                var result = await _comments.DeleteOneAsync(c => c.Id == commentId);
                if (result.DeletedCount == 0)
                {
                    _logger.Warning("No comment deleted - CommentId: {CommentId}", commentId);
                }
                else
                {
                    _logger.Information("Comment deleted successfully - CommentId: {CommentId}", commentId);
                }
            }
            catch (Exception ex)
            {
                _logger.Error(ex, "Error deleting comment - CommentId: {CommentId}", commentId);
                throw;
            }
        }
    }
}
