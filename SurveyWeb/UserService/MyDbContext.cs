using Microsoft.EntityFrameworkCore;
using UserService.Models;

namespace UserService;

public class MyDbContext : DbContext
{
    public MyDbContext(DbContextOptions<MyDbContext> options) : base(options) { }

    public DbSet<User> Users { get; set; }
    public DbSet<Role> Roles { get; set; }

    public void SeedRoles()
    {
        if (!Roles.Any())
        {
            Roles.AddRange(
                new Role(1, "Member"),
                new Role(2, "Employee"),
                new Role(3, "Admin")
            );
            SaveChanges();
        }
    }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        if (!optionsBuilder.IsConfigured)
        {
            optionsBuilder.UseNpgsql("Host=localhost;Database=UserService;Username=postgres;Password=12345");
        }
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Index unique cho GoogleId
        modelBuilder.Entity<User>()
            .HasIndex(u => u.GoogleId)
            .IsUnique()
            .HasFilter("\"GoogleId\" IS NOT NULL");

        // Index unique cho Email
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();
    }
}
