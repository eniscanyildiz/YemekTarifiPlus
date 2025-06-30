using SendGrid.Helpers.Mail;
using SendGrid;
using Serilog;

namespace NotificationService.API.Services
{
    public class EmailSender
    {
        private readonly string _apiKey;
        private readonly Serilog.ILogger _logger;

        public EmailSender(IConfiguration config)
        {
            _apiKey = config["SendGrid:ApiKey"];
            _logger = Log.ForContext<EmailSender>();
            
            _logger.Information("EmailSender initialized with SendGrid API");
        }

        public async Task SendEmailAsync(string toEmail, string subject, string content)
        {
            _logger.Information("Sending email - To: {ToEmail}, Subject: {Subject}, ContentLength: {ContentLength}", 
                toEmail, subject, content?.Length ?? 0);
            
            try
            {
                var client = new SendGridClient(_apiKey);
                var from = new EmailAddress("eniscanyldz_1282_@hotmail.com", "YemekTarifiPlus");
                var to = new EmailAddress(toEmail);
                var msg = MailHelper.CreateSingleEmail(from, to, subject, content, content);

                var response = await client.SendEmailAsync(msg);
                
                if (response.IsSuccessStatusCode)
                {
                    _logger.Information("Email sent successfully - To: {ToEmail}, Subject: {Subject}, StatusCode: {StatusCode}", 
                        toEmail, subject, response.StatusCode);
                }
                else
                {
                    _logger.Warning("Email sending failed - To: {ToEmail}, Subject: {Subject}, StatusCode: {StatusCode}", 
                        toEmail, subject, response.StatusCode);
                }
            }
            catch (Exception ex)
            {
                _logger.Error(ex, "Error sending email - To: {ToEmail}, Subject: {Subject}", toEmail, subject);
                throw;
            }
        }
    }
}
