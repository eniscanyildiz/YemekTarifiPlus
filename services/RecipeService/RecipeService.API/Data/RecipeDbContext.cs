using Microsoft.EntityFrameworkCore;
using RecipeService.API.Models;

namespace RecipeService.API.Data
{
    public class RecipeDbContext : DbContext
    {
        public RecipeDbContext(DbContextOptions<RecipeDbContext> options) : base(options) { }

        public DbSet<Recipe> Recipes => Set<Recipe>();
        public DbSet<Category> Categories => Set<Category>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Recipe>()
                .Property(r => r.Ingredients)
                .HasColumnType("text[]");

            modelBuilder.Entity<Recipe>()
                .Property(r => r.Steps)
                .HasColumnType("text[]");

            modelBuilder.Entity<Recipe>()
                .OwnsMany(r => r.Media);
        }
    }
}
