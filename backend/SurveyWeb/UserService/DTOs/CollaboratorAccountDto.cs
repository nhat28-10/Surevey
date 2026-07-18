namespace UserService.DTOs;

public class CollaboratorAccountDto
{
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? FullName { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Sex { get; set; }
    public string? IdentityCard { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? Address { get; set; }
    public string? AvatarUrl { get; set; }
    public string RoleName { get; set; } = "Collaborator";
    public string AuthProvider { get; set; } = "Password";
    public int ProfileCompletionPercent { get; set; }
}
