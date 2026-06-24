namespace UserService.DTOs;

public class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class VerifyOtpRequest
{
    public string Email { get; set; } = string.Empty;
    public string Otp { get; set; } = string.Empty;
}
