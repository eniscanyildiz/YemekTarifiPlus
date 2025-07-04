using NotificationService.API.Messaging;
using NotificationService.API.Services;
using NotificationService.API.Middleware;
using Serilog;

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

    builder.Host.UseSerilog();

    builder.Services.AddControllers();
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen();

    builder.Services.AddSingleton<EmailSender>();
    builder.Services.AddHostedService<RabbitMqConsumer>();

    var app = builder.Build();
            
    app.UseMiddleware<GlobalExceptionMiddleware>();

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
