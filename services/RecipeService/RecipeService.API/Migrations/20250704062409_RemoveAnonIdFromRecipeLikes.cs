using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RecipeService.API.Migrations
{
    public partial class RemoveAnonIdFromRecipeLikes : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AnonId",
                table: "RecipeLikes");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AnonId",
                table: "RecipeLikes",
                type: "text",
                nullable: true);
        }
    }
}
