using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using System.Security.Claims;
using System.Text;
using UserService.API.Models;
using Serilog;

namespace UserService.API.Helpers
{
    public static class JwtHelper
    {
        private static readonly Serilog.ILogger _logger = Log.ForContext(typeof(JwtHelper));

        public static string GenerateJwtToken(string userId, string email, string key)
        {
            _logger.Debug("Generating JWT token - UserId: {UserId}, Email: {Email}", userId, email);
            
            try
            {
                var claims = new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, userId),
                    new Claim(ClaimTypes.Email, email),
                    new Claim("nameid", userId.ToString())
                };

                var keyBytes = Encoding.UTF8.GetBytes(key);
                var signingKey = new SymmetricSecurityKey(keyBytes);

                var token = new JwtSecurityToken(
                    claims: claims,
                    expires: DateTime.UtcNow.AddHours(1),
                    signingCredentials: new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256)
                );

                var tokenString = new JwtSecurityTokenHandler().WriteToken(token);
                
                _logger.Information("JWT token generated successfully - UserId: {UserId}, Email: {Email}, Expires: {Expires}", 
                    userId, email, token.ValidTo);
                
                return tokenString;
            }
            catch (Exception ex)
            {
                _logger.Error(ex, "Error generating JWT token - UserId: {UserId}, Email: {Email}", userId, email);
                throw;
            }
        }
    }
}
