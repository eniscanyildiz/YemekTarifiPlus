using System;
using System.Text.Json;
using System.Threading.Tasks;
using StackExchange.Redis;
using Serilog;

namespace RecipeService.API.Services
{
    public class RedisCacheService : ICacheService
    {
        private readonly IConnectionMultiplexer _redis;
        private readonly IDatabase _database;
        private readonly TimeSpan _defaultExpiry = TimeSpan.FromMinutes(30);
        private readonly Serilog.ILogger _logger;

        public RedisCacheService(IConnectionMultiplexer redis)
        {
            _redis = redis;
            _database = redis.GetDatabase();
            _logger = Log.ForContext<RedisCacheService>();
            
            _logger.Information("RedisCacheService initialized");
        }

        public async Task<T?> GetAsync<T>(string key)
        {
            _logger.Debug("Getting from cache - Key: {Key}, Type: {Type}", key, typeof(T).Name);
            
            try
            {
                var value = await _database.StringGetAsync(key);
                if (value.IsNull)
                {
                    _logger.Debug("Cache miss - Key: {Key}", key);
                    return default(T);
                }

                var result = JsonSerializer.Deserialize<T>(value!);
                _logger.Debug("Cache hit - Key: {Key}, Type: {Type}", key, typeof(T).Name);
                return result;
            }
            catch (Exception ex)
            {
                // Log error but don't throw - cache failure shouldn't break the app
                _logger.Warning(ex, "Cache get error - Key: {Key}, Type: {Type}", key, typeof(T).Name);
                return default(T);
            }
        }

        public async Task SetAsync<T>(string key, T value, TimeSpan? expiry = null)
        {
            var expiration = expiry ?? _defaultExpiry;
            _logger.Debug("Setting cache - Key: {Key}, Type: {Type}, Expiry: {Expiry}", key, typeof(T).Name, expiration);
            
            try
            {
                var serializedValue = JsonSerializer.Serialize(value);
                await _database.StringSetAsync(key, serializedValue, expiration);
                _logger.Debug("Cache set successfully - Key: {Key}, Type: {Type}", key, typeof(T).Name);
            }
            catch (Exception ex)
            {
                // Log error but don't throw - cache failure shouldn't break the app
                _logger.Warning(ex, "Cache set error - Key: {Key}, Type: {Type}", key, typeof(T).Name);
            }
        }

        public async Task RemoveAsync(string key)
        {
            _logger.Debug("Removing from cache - Key: {Key}", key);
            
            try
            {
                await _database.KeyDeleteAsync(key);
                _logger.Debug("Cache removed successfully - Key: {Key}", key);
            }
            catch (Exception ex)
            {
                _logger.Warning(ex, "Cache remove error - Key: {Key}", key);
            }
        }

        public async Task RemoveByPatternAsync(string pattern)
        {
            _logger.Debug("Removing from cache by pattern - Pattern: {Pattern}", pattern);
            
            try
            {
                var server = _redis.GetServer(_redis.GetEndPoints()[0]);
                var keys = server.Keys(pattern: pattern);
                var keyCount = 0;
                
                foreach (var key in keys)
                {
                    await _database.KeyDeleteAsync(key);
                    keyCount++;
                }
                
                _logger.Debug("Cache pattern removal completed - Pattern: {Pattern}, KeysRemoved: {KeyCount}", pattern, keyCount);
            }
            catch (Exception ex)
            {
                _logger.Warning(ex, "Cache remove pattern error - Pattern: {Pattern}", pattern);
            }
        }

        public async Task<bool> ExistsAsync(string key)
        {
            _logger.Debug("Checking cache existence - Key: {Key}", key);
            
            try
            {
                var exists = await _database.KeyExistsAsync(key);
                _logger.Debug("Cache existence check - Key: {Key}, Exists: {Exists}", key, exists);
                return exists;
            }
            catch (Exception ex)
            {
                _logger.Warning(ex, "Cache exists error - Key: {Key}", key);
                return false;
            }
        }
    }
} 