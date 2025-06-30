using NotificationService.API.Messaging;
using NotificationService.API.Services;
using NotificationService.API.Middleware;
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
    Log.Information("Starting NotificationService API...");
    
    var builder = WebApplication.CreateBuilder(args);

    // Configure Serilog for the application
    builder.Host.UseSerilog();

    // Add services to the container.
    builder.Services.AddControllers();
    // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen();

    builder.Services.AddSingleton<EmailSender>();
    builder.Services.AddHostedService<RabbitMqConsumer>();

    var app = builder.Build();

    // Global Exception Middleware
    app.UseMiddleware<GlobalExceptionMiddleware>();

    // Configure the HTTP request pipeline.
    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI();
    }

    app.UseHttpsRedirection();

    app.UseAuthorization();

    app.MapControllers();

    Log.Information("NotificationService API started successfully");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "NotificationService API terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
