using Azure.Storage.Blobs;
using Serilog;
using Azure.Storage.Sas;

namespace MediaService.API.Services
{
    public class BlobStorageService
    {
        private readonly BlobContainerClient _containerClient;
        private readonly Serilog.ILogger _logger;

        public BlobStorageService(IConfiguration configuration)
        {
            var connectionString = configuration["AzureBlob:ConnectionString"];
            var containerName = configuration["AzureBlob:ContainerName"];
            _logger = Log.ForContext<BlobStorageService>();

            try
            {
                var blobServiceClient = new BlobServiceClient(connectionString);
                _containerClient = blobServiceClient.GetBlobContainerClient(containerName);
                _containerClient.CreateIfNotExists();
                
                _logger.Information("BlobStorageService initialized - Container: {ContainerName}", containerName);
            }
            catch (Exception ex)
            {
                _logger.Error(ex, "Error initializing BlobStorageService - Container: {ContainerName}", containerName);
                throw;
            }
        }

        private string GetBlobSasUri(string blobName, int expireMinutes = 60)
        {
            var blobClient = _containerClient.GetBlobClient(blobName);
            if (!blobClient.CanGenerateSasUri)
                throw new InvalidOperationException("SAS URI oluşturulamıyor. Lütfen Storage Account Key ile bağlanın.");
            var sasBuilder = new BlobSasBuilder
            {
                BlobContainerName = _containerClient.Name,
                BlobName = blobName,
                Resource = "b",
                ExpiresOn = DateTimeOffset.UtcNow.AddMinutes(expireMinutes)
            };
            sasBuilder.SetPermissions(BlobSasPermissions.Read);
            var sasUri = blobClient.GenerateSasUri(sasBuilder);
            return sasUri.ToString();
        }

        public async Task<string> UploadFileAsync(Stream fileStream, string fileName, string contentType)
        {
            _logger.Debug("Starting file upload to blob storage - FileName: {FileName}, ContentType: {ContentType}", fileName, contentType);
            
            try
            {
                var blobClient = _containerClient.GetBlobClient(fileName);

                var blobHttpHeaders = new Azure.Storage.Blobs.Models.BlobHttpHeaders
                {
                    ContentType = contentType
                };

                await blobClient.UploadAsync(fileStream, new Azure.Storage.Blobs.Models.BlobUploadOptions
                {
                    HttpHeaders = blobHttpHeaders
                });

                var publicUrl = blobClient.Uri.ToString();
                _logger.Information("File uploaded successfully to blob storage - FileName: {FileName}, Public Url: {Url}", fileName, publicUrl);
                return publicUrl;
            }
            catch (Exception ex)
            {
                _logger.Error(ex, "Error uploading file to blob storage - FileName: {FileName}, ContentType: {ContentType}", fileName, contentType);
                throw;
            }
        }
    }
}
