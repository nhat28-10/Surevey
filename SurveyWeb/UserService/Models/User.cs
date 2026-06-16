using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace UserService.Models;

public class User
{
    [Key]
    public int UserId { get; set; }

    [Required]
    [MaxLength(50)]
    public string UserName { get; set; }

    [Required]
    [MaxLength(100)]
    public string Email { get; set; }

    // Nullable vì user đăng nhập bằng Google không có password
    [MaxLength(100)]
    public string? Password { get; set; }

    [MaxLength(12)]
    public string? IdentityCard { get; set; }

    public string? Sex { get; set; }

    [MaxLength(15)]
    public string? PhoneNumber { get; set; }

    public DateTime? DateOfBirth { get; set; }

    [MaxLength(200)]
    public string? Address { get; set; }

    [Required]
    public int RoleId { get; set; }

    [ForeignKey("RoleId")]
    public Role? Role { get; set; }

    public string? FullName { get; set; }

    // Google OAuth
    [MaxLength(200)]
    public string? GoogleId { get; set; }

    // Avatar từ Google
    [MaxLength(500)]
    public string? AvatarUrl { get; set; }

    [NotMapped]
    public string? ConfirmPassword { get; set; }

    public User() { }
}
