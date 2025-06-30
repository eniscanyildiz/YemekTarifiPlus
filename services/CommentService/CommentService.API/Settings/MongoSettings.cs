namespace CommentService.API.Settings
{
    public class MongoSettings
    {
        public string ConnectionString { get; set; }
        public string DatabaseName { get; set; }
        public string CommentsCollectionName { get; set; }
    }
}
