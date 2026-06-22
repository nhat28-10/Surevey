using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace WalletService.Migrations
{
    /// <inheritdoc />
    public partial class AddManualCampaignPayments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CampaignPayments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CampaignId = table.Column<int>(type: "integer", nullable: false),
                    CustomerId = table.Column<int>(type: "integer", nullable: false),
                    PaymentCode = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    TargetResponses = table.Column<int>(type: "integer", nullable: false),
                    AnswerCount = table.Column<int>(type: "integer", nullable: false),
                    UnitPricePerAnswer = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    RewardPerResponse = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    RewardBudget = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    PlatformFeeRate = table.Column<decimal>(type: "numeric(5,4)", precision: 5, scale: 4, nullable: false),
                    PlatformFeeAmount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    TotalAmount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    BankName = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    BankAccountName = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    BankAccountNumber = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    QrImageUrl = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    TransferContent = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    ProofImageUrl = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CustomerNote = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    VerifiedByAdminId = table.Column<int>(type: "integer", nullable: true),
                    VerifiedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RejectReason = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CampaignPayments", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CampaignPayments_CampaignId",
                table: "CampaignPayments",
                column: "CampaignId");

            migrationBuilder.CreateIndex(
                name: "IX_CampaignPayments_CustomerId",
                table: "CampaignPayments",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_CampaignPayments_PaymentCode",
                table: "CampaignPayments",
                column: "PaymentCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CampaignPayments_Status",
                table: "CampaignPayments",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CampaignPayments");
        }
    }
}
