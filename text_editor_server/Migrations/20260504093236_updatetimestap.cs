using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace text_editor_server.Migrations
{
    /// <inheritdoc />
    public partial class updatetimestap : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SectionSnapshots");

            migrationBuilder.AddColumn<int>(
                name: "Level",
                table: "Sections",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "Timestamp",
                table: "DocumentSnapshots",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Level",
                table: "Sections");

            migrationBuilder.DropColumn(
                name: "Timestamp",
                table: "DocumentSnapshots");

            migrationBuilder.CreateTable(
                name: "SectionSnapshots",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    JsonContent = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SectionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Version = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SectionSnapshots", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SectionSnapshots_Sections_SectionId",
                        column: x => x.SectionId,
                        principalTable: "Sections",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SectionSnapshots_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SectionSnapshots_SectionId_UserId",
                table: "SectionSnapshots",
                columns: new[] { "SectionId", "UserId" });

            migrationBuilder.CreateIndex(
                name: "IX_SectionSnapshots_UserId",
                table: "SectionSnapshots",
                column: "UserId");
        }
    }
}
