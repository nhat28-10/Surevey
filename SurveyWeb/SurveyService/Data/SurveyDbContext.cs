using Microsoft.EntityFrameworkCore;
using SurveyService.Enums;
using SurveyService.Models;

namespace SurveyService.Data;

public class SurveyDbContext : DbContext
{
    public SurveyDbContext(DbContextOptions<SurveyDbContext> options) : base(options)
    {
    }

    public DbSet<Campaign> Campaigns => Set<Campaign>();
    public DbSet<Participation> Participations => Set<Participation>();
    public DbSet<Submission> Submissions => Set<Submission>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Campaign>(entity =>
        {
            entity.Property(c => c.Title).HasMaxLength(200).IsRequired();
            entity.Property(c => c.Description).HasMaxLength(2000).IsRequired();
            entity.Property(c => c.Instruction).HasMaxLength(2000).IsRequired();
            entity.Property(c => c.GoogleFormUrl).HasMaxLength(1000);
            entity.Property(c => c.ConfirmationCode).HasMaxLength(32).IsRequired();
            entity.Property(c => c.RewardPerResponse).HasPrecision(18, 2);
            entity.Property(c => c.Category).HasMaxLength(100).IsRequired();
            entity.Property(c => c.Status).HasConversion<string>().HasMaxLength(32);
            entity.Property(c => c.CampaignType).HasConversion<string>().HasMaxLength(32);
            entity.Property(c => c.RejectReason).HasMaxLength(1000);
            entity.Property(c => c.IsEscrowed).HasDefaultValue(false);
            entity.HasIndex(c => c.CustomerId);
            entity.HasIndex(c => c.Status);
        });

        modelBuilder.Entity<Participation>(entity =>
        {
            entity.Property(p => p.Status).HasConversion<string>().HasMaxLength(32);
            entity.HasIndex(p => new { p.CampaignId, p.CollaboratorId }).IsUnique();
            entity.HasOne(p => p.Campaign)
                .WithMany(c => c.Participations)
                .HasForeignKey(p => p.CampaignId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Submission>(entity =>
        {
            entity.Property(s => s.ConfirmationCode).HasMaxLength(32).IsRequired();
            entity.Property(s => s.ProofImageUrl).HasMaxLength(1000);
            entity.Property(s => s.ContactEmail).HasMaxLength(200);
            entity.Property(s => s.ContactPhone).HasMaxLength(30);
            entity.Property(s => s.Note).HasMaxLength(2000);
            entity.Property(s => s.Status).HasConversion<string>().HasMaxLength(32);
            entity.Property(s => s.RejectReason).HasMaxLength(1000);
            entity.Property(s => s.RewardTransactionReference).HasMaxLength(80);
            entity.HasIndex(s => s.CampaignId);
            entity.HasIndex(s => s.ParticipationId);
            entity.HasOne(s => s.Campaign)
                .WithMany(c => c.Submissions)
                .HasForeignKey(s => s.CampaignId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(s => s.Participation)
                .WithMany(p => p.Submissions)
                .HasForeignKey(s => s.ParticipationId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
