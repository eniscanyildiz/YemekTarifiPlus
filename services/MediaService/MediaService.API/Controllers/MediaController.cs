using MediaService.API.Services;
using Microsoft.AspNetCore.Mvc;
using Serilog;

namespace MediaService.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MediaController : ControllerBase
    {
        private readonly BlobStorageService _blobStorageService;
        private readonly Serilog.ILogger _logger;

        public MediaController(BlobStorageService blobStorageService)
        {
            _blobStorageService = blobStorageService;
            _logger = Log.ForContext<MediaController>();
        }

        [HttpPost("upload")]
        public async Task<IActionResult> Upload([FromForm] List<IFormFile> files)
        {
            _logger.Information("File upload request received - FileCount: {FileCount}", files?.Count ?? 0);
            
            if (files == null || files.Count == 0)
            {
                _logger.Warning("Upload failed - No files provided");
                return BadRequest("File is empty.");
            }

            var medias = new List<object>();
            var uploadedFiles = new List<string>();

            try
            {
                foreach (var file in files)
                {
                    _logger.Debug("Processing file upload - FileName: {FileName}, ContentType: {ContentType}, Size: {Size} bytes", 
                        file.FileName, file.ContentType, file.Length);
                    
                    var fileName = Guid.NewGuid() + Path.GetExtension(file.FileName);
                    using var stream = file.OpenReadStream();
                    var url = await _blobStorageService.UploadFileAsync(stream, fileName, file.ContentType);
                    var type = file.ContentType.StartsWith("video/") ? "video" : "image";
                    medias.Add(new { url, type });
                    uploadedFiles.Add(fileName);
                    
                    _logger.Debug("File uploaded successfully - OriginalName: {OriginalName}, StoredName: {StoredName}, Url: {Url}", 
                        file.FileName, fileName, url);
                }

                _logger.Information("File upload completed successfully - FileCount: {FileCount}, UploadedFiles: {UploadedFiles}", 
                    files.Count, string.Join(", ", uploadedFiles));
                
                return Ok(new { medias });
            }
            catch (Exception ex)
            {
                _logger.Error(ex, "Error during file upload - FileCount: {FileCount}", files.Count);
                throw;
            }
        }
    }
}
