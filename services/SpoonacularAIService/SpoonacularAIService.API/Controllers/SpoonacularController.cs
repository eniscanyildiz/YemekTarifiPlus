using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using System.Threading.Tasks;
using SpoonacularAIService.API.Services;

namespace SpoonacularAIService.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SpoonacularController : ControllerBase
    {
        private readonly SpoonacularService _spoonacularService;

        public SpoonacularController(IConfiguration configuration)
        {
            _spoonacularService = new SpoonacularService(configuration);
        }

        [HttpGet("search")]
        public async Task<IActionResult> Search([FromQuery] string query)
        {
            if (string.IsNullOrWhiteSpace(query))
                return BadRequest("Query parametresi gereklidir.");

            var result = await _spoonacularService.SearchRecipesAsync(query);
            return Content(result, "application/json");
        }
    }
} 