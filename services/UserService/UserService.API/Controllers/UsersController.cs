using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using System.Security.Claims;
using UserService.API.DTOs;
using UserService.API.Helpers;
using UserService.API.Models;
using UserService.API.Repositories;
using UserService.API.Services;
using Serilog;

namespace UserService.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly UserRepository _userRepository;
        private readonly IConfiguration _configuration;
        private readonly ICacheService _cacheService;
        private readonly Serilog.ILogger _logger;

        public UsersController(UserRepository userRepository, IConfiguration configuration, ICacheService cacheService)
        {
            _userRepository = userRepository;
            _configuration = configuration;
            _cacheService = cacheService;
            _logger = Log.ForContext<UsersController>();
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(UserRegisterDto dto)
        {
            _logger.Information("User registration attempt - Email: {Email}", dto.Email);
            
            var existing = await _userRepository.GetUserByEmailAsync(dto.Email);
            if (existing != null)
            {
                _logger.Warning("Registration failed - Email already exists: {Email}", dto.Email);
                return BadRequest("Email zaten kayıtlı.");
            }

            try
            {
                var hashedPw = BCrypt.Net.BCrypt.HashPassword(dto.Password);
                var user = new User
                {
                    Email = dto.Email,
                    PasswordHash = hashedPw,
                    FirstName = dto.FirstName,
                    LastName = dto.LastName
                };

                await _userRepository.InsertAsync(user);
                
                await _cacheService.RemoveByPatternAsync("users:*");
                
                _logger.Information("User registered successfully - UserId: {UserId}, Email: {Email}", user.Id, user.Email);
                return Ok("Kayıt başarılı.");
            }
            catch (Exception ex)
            {
                _logger.Error(ex, "Error during user registration - Email: {Email}", dto.Email);
                throw;
            }
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(UserLoginDto dto)
        {
            _logger.Information("User login attempt - Email: {Email}", dto.Email);
            
            var user = await _userRepository.GetUserByEmailAsync(dto.Email);
            if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            {
                _logger.Warning("Login failed - Invalid credentials for email: {Email}", dto.Email);
                return Unauthorized("Geçersiz giriş.");
            }

            try
            {
                var token = JwtHelper.GenerateJwtToken(user.Id, user.Email, _configuration["JwtSettings:Key"]!);
                
                var cacheKey = $"users:token:{user.Id}";
                await _cacheService.SetAsync(cacheKey, token, TimeSpan.FromMinutes(30));
                
                _logger.Information("User logged in successfully - UserId: {UserId}, Email: {Email}", user.Id, user.Email);
                return Ok(new { token });
            }
            catch (Exception ex)
            {
                _logger.Error(ex, "Error during user login - Email: {Email}", dto.Email);
                throw;
            }
        }

        [Authorize]
        [HttpGet("favorites")]
        public async Task<IActionResult> GetFavorites()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
            {
                _logger.Warning("GetFavorites failed - User ID not found in token");
                return Unauthorized();
            }

            _logger.Information("Getting favorites for user - UserId: {UserId}", userId);

            var cacheKey = $"users:favorites:{userId}";
            var cachedFavorites = await _cacheService.GetAsync<List<string>>(cacheKey);
            
            if (cachedFavorites != null)
            {
                _logger.Information("Retrieved favorites from cache - UserId: {UserId}, Count: {Count}", userId, cachedFavorites.Count);
                return Ok(cachedFavorites);
            }

            var user = await _userRepository.GetUserByIdAsync(userId);
            if (user == null)
            {
                _logger.Warning("User not found for favorites - UserId: {UserId}", userId);
                return NotFound();
            }

            user.Favorites ??= new List<string>();
            
            await _cacheService.SetAsync(cacheKey, user.Favorites);
            
            _logger.Information("Retrieved favorites from database and cached - UserId: {UserId}, Count: {Count}", userId, user.Favorites.Count);
            return Ok(user.Favorites);
        }

        [Authorize]
        [HttpPost("favorites/{recipeId}")]
        public async Task<IActionResult> ToggleFavorite(string recipeId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
            {
                _logger.Warning("ToggleFavorite failed - User ID not found in token");
                return Unauthorized();
            }

            _logger.Information("Toggling favorite - UserId: {UserId}, RecipeId: {RecipeId}", userId, recipeId);

            var user = await _userRepository.GetUserByIdAsync(userId);
            if (user == null)
            {
                _logger.Warning("User not found for toggle favorite - UserId: {UserId}", userId);
                return NotFound();
            }

            user.Favorites ??= new List<string>();

            var wasFavorite = user.Favorites.Contains(recipeId);
            if (wasFavorite)
            {
                user.Favorites.Remove(recipeId);
                _logger.Information("Removed from favorites - UserId: {UserId}, RecipeId: {RecipeId}", userId, recipeId);
            }
            else
            {
                user.Favorites.Add(recipeId);
                _logger.Information("Added to favorites - UserId: {UserId}, RecipeId: {RecipeId}", userId, recipeId);
            }

            try
            {
                await _userRepository.UpdateUserAsync(user);
                
                await _cacheService.RemoveByPatternAsync($"users:favorites:{userId}");
                await _cacheService.RemoveByPatternAsync($"users:profile:{userId}");

                return Ok(user.Favorites);
            }
            catch (Exception ex)
            {
                _logger.Error(ex, "Error toggling favorite - UserId: {UserId}, RecipeId: {RecipeId}", userId, recipeId);
                throw;
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var user = await _userRepository.GetUserByIdAsync(id);
            if (user == null)
                return NotFound();

            return Ok(new {
                id = user.Id,
                email = user.Email,
                firstName = user.FirstName,
                lastName = user.LastName
            });
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var users = await _userRepository.GetAllAsync();
            var result = users.Select(user => new {
                id = user.Id,
                email = user.Email,
                firstName = user.FirstName,
                lastName = user.LastName
            });
            return Ok(result);
        }

        [HttpPost("update")]
        public async Task<IActionResult> UpdateUser([FromBody] User updatedUser)
        {
            var user = await _userRepository.GetUserByIdAsync(updatedUser.Id);
            if (user == null)
                return NotFound();

            user.FirstName = updatedUser.FirstName;
            user.LastName = updatedUser.LastName;
            user.Email = updatedUser.Email;

            await _userRepository.UpdateUserAsync(user);
            return Ok(new {
                id = user.Id,
                email = user.Email,
                firstName = user.FirstName,
                lastName = user.LastName
            });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(string id)
        {
            var user = await _userRepository.GetUserByIdAsync(id);
            if (user == null)
                return NotFound();

            await _userRepository.DeleteUserAsync(id);
            return NoContent();
        }
    }
}
