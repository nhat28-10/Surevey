using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace WalletService.Migrations
{
    /// <inheritdoc />
    public partial class AddSePayWebhookTransactions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SePayWebhookTransactions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SePayTransactionId = table.Column<long>(type: "bigint", nullable: false),
                    CampaignPaymentId = table.Column<int>(type: "integer", nullable: true),
                    PaymentCode = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    Gateway = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    AccountNumber = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    SubAccount = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    Code = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    Content = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    TransferType = table.Column<string>(type: "character varying(12)", maxLength: 12, nullable: false),
                    TransferAmount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    Accumulated = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    ReferenceCode = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    TransactionDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RawPayload = table.Column<string>(type: "character varying(8000)", maxLength: 8000, nullable: false),
                    ProcessingStatus = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    ErrorMessage = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SePayWebhookTransactions", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SePayWebhookTransactions_CampaignPaymentId",
                table: "SePayWebhookTransactions",
                column: "CampaignPaymentId");

            migrationBuilder.CreateIndex(
                name: "IX_SePayWebhookTransactions_PaymentCode",
                table: "SePayWebhookTransactions",
                column: "PaymentCode");

            migrationBuilder.CreateIndex(
                name: "IX_SePayWebhookTransactions_ProcessingStatus",
                table: "SePayWebhookTransactions",
                column: "ProcessingStatus");

            migrationBuilder.CreateIndex(
                name: "IX_SePayWebhookTransactions_SePayTransactionId",
                table: "SePayWebhookTransactions",
                column: "SePayTransactionId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SePayWebhookTransactions");
        }
    }
}
