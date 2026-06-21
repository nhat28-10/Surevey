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
    }
}
