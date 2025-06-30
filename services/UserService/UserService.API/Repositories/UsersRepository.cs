using Microsoft.Extensions.Options;
using MongoDB.Driver;
using UserService.API.Models;
using Serilog;

namespace UserService.API.Repositories
{
    public class UserRepository
    {
        private readonly IMongoCollection<User> _usersCollection;
        private readonly Serilog.ILogger _logger;

        public UserRepository(IOptions<DatabaseSettings> dbSettings, IMongoClient mongoClient)
        {
            var db = mongoClient.GetDatabase(dbSettings.Value.DatabaseName);
            _usersCollection = db.GetCollection<User>(dbSettings.Value.UsersCollectionName);
            _logger = Log.ForContext<UserRepository>();
            
            _logger.Information("UserRepository initialized - Database: {Database}, Collection: {Collection}", 
                dbSettings.Value.DatabaseName, dbSettings.Value.UsersCollectionName);
        }

        public async Task<User?> GetUserByEmailAsync(string email)
        {
            _logger.Debug("Getting user by email - Email: {Email}", email);
            
            try
            {
                var user = await _usersCollection.Find(u => u.Email == email).FirstOrDefaultAsync();
                if (user == null)
                {
                    _logger.Debug("User not found by email - Email: {Email}", email);
                }
                else
                {
                    _logger.Debug("User found by email - Email: {Email}, UserId: {UserId}", email, user.Id);
                }
                return user;
            }
            catch (Exception ex)
            {
                _logger.Error(ex, "Error getting user by email - Email: {Email}", email);
                throw;
            }
        }

        public async Task<User?> GetUserByIdAsync(string id)
        {
            _logger.Debug("Getting user by ID - UserId: {UserId}", id);
            
            try
            {
                var user = await _usersCollection.Find(u => u.Id == id).FirstOrDefaultAsync();
                if (user == null)
                {
                    _logger.Debug("User not found by ID - UserId: {UserId}", id);
                }
                else
                {
                    _logger.Debug("User found by ID - UserId: {UserId}, Email: {Email}", id, user.Email);
                }
                return user;
            }
            catch (Exception ex)
            {
                _logger.Error(ex, "Error getting user by ID - UserId: {UserId}", id);
                throw;
            }
        }

        public async Task InsertAsync(User user)
        {
            _logger.Debug("Inserting new user - Email: {Email}", user.Email);
            
            try
            {
                await _usersCollection.InsertOneAsync(user);
                _logger.Information("User inserted successfully - UserId: {UserId}, Email: {Email}", user.Id, user.Email);
            }
            catch (Exception ex)
            {
                _logger.Error(ex, "Error inserting user - Email: {Email}", user.Email);
                throw;
            }
        }

        public async Task UpdateUserAsync(User user)
        {
            _logger.Debug("Updating user - UserId: {UserId}, Email: {Email}", user.Id, user.Email);
            
            try
            {
                var filter = Builders<User>.Filter.Eq(u => u.Id, user.Id);
                await _usersCollection.ReplaceOneAsync(filter, user);
                _logger.Information("User updated successfully - UserId: {UserId}, Email: {Email}", user.Id, user.Email);
            }
            catch (Exception ex)
            {
                _logger.Error(ex, "Error updating user - UserId: {UserId}, Email: {Email}", user.Id, user.Email);
                throw;
            }
        }

        public async Task<List<User>> GetAllAsync()
        {
            _logger.Debug("Getting all users");
            try
            {
                var users = await _usersCollection.Find(_ => true).ToListAsync();
                _logger.Debug("Retrieved {Count} users", users.Count);
                return users;
            }
            catch (Exception ex)
            {
                _logger.Error(ex, "Error getting all users");
                throw;
            }
        }

        public async Task DeleteUserAsync(string id)
        {
            _logger.Debug("Deleting user - UserId: {UserId}", id);
            try
            {
                var result = await _usersCollection.DeleteOneAsync(u => u.Id == id);
                if (result.DeletedCount == 0)
                {
                    _logger.Warning("No user deleted - UserId: {UserId}", id);
                }
                else
                {
                    _logger.Information("User deleted successfully - UserId: {UserId}", id);
                }
            }
            catch (Exception ex)
            {
                _logger.Error(ex, "Error deleting user - UserId: {UserId}", id);
                throw;
            }
        }
    }
}
