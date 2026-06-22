using Microsoft.EntityFrameworkCore;
using WalletService.Models;

namespace WalletService.Data;

public class WalletDbContext : DbContext
{
    public WalletDbContext(DbContextOptions<WalletDbContext> options) : base(options)
    {
    }

    public DbSet<Wallet> Wallets => Set<Wallet>();
    public DbSet<WalletTransaction> WalletTransactions => Set<WalletTransaction>();
    public DbSet<CampaignEscrow> CampaignEscrows => Set<CampaignEscrow>();
    public DbSet<CampaignPayment> CampaignPayments => Set<CampaignPayment>();
    public DbSet<WithdrawalRequest> WithdrawalRequests => Set<WithdrawalRequest>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Wallet>(entity =>
        {
            entity.HasIndex(w => w.UserId).IsUnique();
            entity.Property(w => w.AvailableBalance).HasPrecision(18, 2);
            entity.Property(w => w.PendingBalance).HasPrecision(18, 2);
            entity.Property(w => w.EscrowBalance).HasPrecision(18, 2);
        });

        modelBuilder.Entity<WalletTransaction>(entity =>
        {
            entity.Property(t => t.Type).HasConversion<string>().HasMaxLength(40);
            entity.Property(t => t.Amount).HasPrecision(18, 2);
            entity.Property(t => t.BalanceAfter).HasPrecision(18, 2);
            entity.Property(t => t.ReferenceType).HasMaxLength(80);
            entity.Property(t => t.ReferenceId).HasMaxLength(80);
            entity.Property(t => t.Description).HasMaxLength(1000);
            entity.HasIndex(t => t.UserId);
            entity.HasIndex(t => new { t.Type, t.ReferenceType, t.ReferenceId }).IsUnique()
                .HasFilter("\"ReferenceType\" IS NOT NULL AND \"ReferenceId\" IS NOT NULL");
            entity.HasOne(t => t.Wallet)
                .WithMany(w => w.Transactions)
                .HasForeignKey(t => t.WalletId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<CampaignEscrow>(entity =>
        {
            entity.HasIndex(e => e.CampaignId).IsUnique();
            entity.HasIndex(e => e.CustomerId);
            entity.Property(e => e.TotalAmount).HasPrecision(18, 2);
            entity.Property(e => e.RemainingAmount).HasPrecision(18, 2);
            entity.Property(e => e.Status).HasConversion<string>().HasMaxLength(32);
        });

        modelBuilder.Entity<CampaignPayment>(entity =>
        {
            entity.HasIndex(p => p.CampaignId);
            entity.HasIndex(p => p.CustomerId);
            entity.HasIndex(p => p.PaymentCode).IsUnique();
            entity.HasIndex(p => p.Status);
            entity.Property(p => p.PaymentCode).HasMaxLength(40);
            entity.Property(p => p.UnitPricePerAnswer).HasPrecision(18, 2);
            entity.Property(p => p.RewardPerResponse).HasPrecision(18, 2);
            entity.Property(p => p.RewardBudget).HasPrecision(18, 2);
            entity.Property(p => p.PlatformFeeRate).HasPrecision(5, 4);
            entity.Property(p => p.PlatformFeeAmount).HasPrecision(18, 2);
            entity.Property(p => p.TotalAmount).HasPrecision(18, 2);
            entity.Property(p => p.BankName).HasMaxLength(120);
            entity.Property(p => p.BankAccountName).HasMaxLength(160);
            entity.Property(p => p.BankAccountNumber).HasMaxLength(80);
            entity.Property(p => p.QrImageUrl).HasMaxLength(1000);
            entity.Property(p => p.TransferContent).HasMaxLength(200);
            entity.Property(p => p.ProofImageUrl).HasMaxLength(1000);
            entity.Property(p => p.CustomerNote).HasMaxLength(1000);
            entity.Property(p => p.Status).HasConversion<string>().HasMaxLength(32);
            entity.Property(p => p.RejectReason).HasMaxLength(1000);
        });

        modelBuilder.Entity<WithdrawalRequest>(entity =>
        {
            entity.HasIndex(w => w.CollaboratorId);
            entity.HasIndex(w => w.Status);
            entity.Property(w => w.Amount).HasPrecision(18, 2);
            entity.Property(w => w.BankName).HasMaxLength(120);
            entity.Property(w => w.BankAccountName).HasMaxLength(160);
            entity.Property(w => w.BankAccountNumber).HasMaxLength(80);
            entity.Property(w => w.Status).HasConversion<string>().HasMaxLength(32);
            entity.Property(w => w.AdminNote).HasMaxLength(1000);
            entity.Property(w => w.RejectReason).HasMaxLength(1000);
            entity.HasOne(w => w.Wallet)
                .WithMany(w => w.WithdrawalRequests)
                .HasForeignKey(w => w.WalletId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
