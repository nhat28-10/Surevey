using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SurveyService.Migrations
{
    /// <inheritdoc />
    public partial class AddCampaignManualPaymentFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AnswerCount",
                table: "Campaigns",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "PaymentId",
                table: "Campaigns",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PaymentStatus",
                table: "Campaigns",
                type: "character varying(32)",
                maxLength: 32,
                nullable: false,
                defaultValue: "UNPAID");

            migrationBuilder.AddColumn<decimal>(
                name: "PlatformFeeAmount",
                table: "Campaigns",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "RewardBudget",
                table: "Campaigns",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "TotalAmount",
                table: "Campaigns",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "UnitPricePerAnswer",
                table: "Campaigns",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.CreateIndex(
                name: "IX_Campaigns_PaymentStatus",
                table: "Campaigns",
                column: "PaymentStatus");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Campaigns_PaymentStatus",
                table: "Campaigns");

            migrationBuilder.DropColumn(
                name: "AnswerCount",
                table: "Campaigns");

            migrationBuilder.DropColumn(
                name: "PaymentId",
                table: "Campaigns");

            migrationBuilder.DropColumn(
                name: "PaymentStatus",
                table: "Campaigns");

            migrationBuilder.DropColumn(
                name: "PlatformFeeAmount",
                table: "Campaigns");

            migrationBuilder.DropColumn(
                name: "RewardBudget",
                table: "Campaigns");

            migrationBuilder.DropColumn(
                name: "TotalAmount",
                table: "Campaigns");

            migrationBuilder.DropColumn(
                name: "UnitPricePerAnswer",
                table: "Campaigns");
        }
    }
}
