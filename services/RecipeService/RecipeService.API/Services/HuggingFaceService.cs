using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace RecipeService.API.Services
{
    public class HuggingFaceService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;

        public HuggingFaceService(string apiKey)
        {
            _apiKey = apiKey;
            _httpClient = new HttpClient();
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
        }

        public async Task<string> GenerateTextAsync(string prompt)
        {
            try
            {
                var url = "https://openrouter.ai/api/v1/chat/completions";
                var requestBody = new
                {
                    model = "deepseek/deepseek-chat-v3:free",
                    messages = new[]
                    {
                        new { role = "user", content = prompt }
                    }
                };
                var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

                Console.WriteLine($"AI Request URL: {url}");
                Console.WriteLine($"AI Request Body: {JsonSerializer.Serialize(requestBody)}");

                var response = await _httpClient.PostAsync(url, content);
                var responseString = await response.Content.ReadAsStringAsync();
                
                Console.WriteLine($"AI Response Status: {response.StatusCode}");
                Console.WriteLine($"AI Response: {responseString}");

                if (!response.IsSuccessStatusCode)
                {
                    throw new Exception($"AI API Error: {response.StatusCode} - {responseString}");
                }

                using var doc = JsonDocument.Parse(responseString);
                var completion = doc.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString();
                return completion;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"AI Service Error: {ex.Message}");
                throw;
            }
        }
    }
} 