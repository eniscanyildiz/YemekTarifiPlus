using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using System.Net.Http.Json;
using System;

namespace SpoonacularAIService.API.Services
{
    public class SpoonacularService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;

        public SpoonacularService(IConfiguration configuration)
        {
            _httpClient = new HttpClient();
            _apiKey = configuration["Spoonacular:ApiKey"];
        }

        public async Task<string> SearchRecipesAsync(string query)
        {
            var url = $"https://api.spoonacular.com/recipes/complexSearch?query={Uri.EscapeDataString(query)}&number=10&apiKey={_apiKey}";
            var response = await _httpClient.GetAsync(url);
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadAsStringAsync();
        }
    }
} 