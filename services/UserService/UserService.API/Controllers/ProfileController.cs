using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using UserService.API.Services;
using Serilog;

namespace UserService.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProfileController : ControllerBase
    {
        private readonly ICacheService _cacheService;
        private readonly Serilog.ILogger _logger;

        public ProfileController(ICacheService cacheService)
        {
            _cacheService = cacheService;
            _logger = Log.ForContext<ProfileController>();
        }

        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetProfile()
        {
            var email = User.FindFirstValue(ClaimTypes.Email);
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (userId == null)
            {
                _logger.Warning("GetProfile failed - User ID not found in token");
                return Unauthorized();
            }

            _logger.Information("Getting profile for user - UserId: {UserId}, Email: {Email}", userId, email);

            var cacheKey = $"users:profile:{userId}";
            var cachedProfile = await _cacheService.GetAsync<object>(cacheKey);
            
            if (cachedProfile != null)
            {
                _logger.Information("Retrieved profile from cache - UserId: {UserId}", userId);
                return Ok(cachedProfile);
            }

            var profile = new
            {
                userId,
                email,
                message = "JWT doğrulandı, hoş geldiniz!"
            };
            
            await _cacheService.SetAsync(cacheKey, profile);
            
            _logger.Information("Created profile and cached - UserId: {UserId}, Email: {Email}", userId, email);
            return Ok(profile);
        }
    }
}
