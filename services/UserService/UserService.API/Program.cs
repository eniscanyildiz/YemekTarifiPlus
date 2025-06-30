using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Extensions.DependencyInjection;
using MongoDB.Driver;
using System.Text;
using UserService.API.Models;
using Microsoft.OpenApi.Models;
using UserService.API.Repositories;
using UserService.API.Services;
using UserService.API.Middleware;
using StackExchange.Redis;
using Serilog;

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(new ConfigurationBuilder()
        .SetBasePath(Directory.GetCurrentDirectory())
        .AddJsonFile("appsettings.json")
        .AddJsonFile($"appsettings.{Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development"}.json", true)
        .Build())
    .CreateLogger();

try
{
    Log.Information("Starting UserService API...");
    
    var builder = WebApplication.CreateBuilder(args);

    // Configure Serilog for the application
    builder.Host.UseSerilog();

    // 1. CORS servisi
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowFrontend",
            policy =>
            {
                policy.WithOrigins("http://localhost:5173")
                      .AllowAnyHeader()
                      .AllowAnyMethod();
            });
    });

    builder.Services.AddControllers();

    builder.Services.AddEndpointsApiExplorer();
    //SWAGGER
    builder.Services.AddSwaggerGen(c =>
    {
        c.SwaggerDoc("v1", new OpenApiInfo { Title = "Your API", Version = "v1" });

        // JWT Authentication için Security Definition ekle
        c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
        {
            Description = "JWT Authorization header using the Bearer scheme. Example: \"Bearer {token}\"",
            Name = "Authorization",
            In = ParameterLocation.Header,
            Type = SecuritySchemeType.ApiKey,
            Scheme = "Bearer"
        });

        // Tüm endpointler için security requirement ekle
        c.AddSecurityRequirement(new OpenApiSecurityRequirement()
        {
            {
                new OpenApiSecurityScheme
                {
                    Reference = new OpenApiReference
                    {
                        Type = ReferenceType.SecurityScheme,
                        Id = "Bearer"
                    }
                },
                new string[] {}
            }
        });
    });

    //Database
    builder.Services.Configure<DatabaseSettings>(
        builder.Configuration.GetSection("DatabaseSettings"));

    builder.Services.AddSingleton<IMongoClient>(s =>
        new MongoClient(builder.Configuration.GetSection("DatabaseSettings:ConnectionString").Value));

    builder.Services.AddSingleton<UserRepository>();

    // Redis Configuration
    builder.Services.AddSingleton<IConnectionMultiplexer>(sp =>
    {
        var redisConnectionString = builder.Configuration["Redis:ConnectionString"];
        return ConnectionMultiplexer.Connect(redisConnectionString!);
    });

    // Cache Service
    builder.Services.AddScoped<ICacheService, RedisCacheService>();

    //Auth Middleware
    var jwtKey = builder.Configuration["JwtSettings:Key"];
    var key = Encoding.UTF8.GetBytes(jwtKey!);

    builder.Services.AddAuthentication(opt =>
    {
        opt.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        opt.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    }).AddJwtBearer(opt =>
    {
        opt.RequireHttpsMetadata = false;
        opt.SaveToken = true;
        opt.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(key),
            ValidateIssuer = false,
            ValidateAudience = false,
            ClockSkew = TimeSpan.Zero
        };
        opt.Events = new JwtBearerEvents
        {
            OnAuthenticationFailed = context =>
            {
                Log.Warning("Authentication failed: {Error}", context.Exception.Message);
                return Task.CompletedTask;
            }
        };
    });

    builder.Services.AddAuthorization();

    var app = builder.Build();

    // Global Exception Middleware
    app.UseMiddleware<GlobalExceptionMiddleware>();

    app.UseRouting();

    app.UseCors("AllowFrontend");

    app.UseAuthentication();
    app.UseAuthorization(); 

    app.MapControllers();

    // Configure the HTTP request pipeline.
    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI();
    }

    //app.UseHttpsRedirection();

    Log.Information("UserService API started successfully");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "UserService API terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
