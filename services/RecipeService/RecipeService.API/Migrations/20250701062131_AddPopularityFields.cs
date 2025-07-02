using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RecipeService.API.Migrations
{
    public partial class AddPopularityFields : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CommentCount",
                table: "Recipes",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "LikeCount",
                table: "Recipes",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<double>(
                name: "PopularityScore",
                table: "Recipes",
                type: "double precision",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<int>(
                name: "ViewCount",
                table: "Recipes",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CommentCount",
                table: "Recipes");

            migrationBuilder.DropColumn(
                name: "LikeCount",
                table: "Recipes");

            migrationBuilder.DropColumn(
                name: "PopularityScore",
                table: "Recipes");

            migrationBuilder.DropColumn(
                name: "ViewCount",
                table: "Recipes");
        }
    }
}
