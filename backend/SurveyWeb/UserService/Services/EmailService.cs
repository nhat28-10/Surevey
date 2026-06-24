using System.Net;
using System.Net.Mail;

namespace UserService.Services;

public class EmailService
{
    private readonly IConfiguration _config;

    public EmailService(IConfiguration config)
    {
        _config = config;
    }

    public async Task SendOtpAsync(string toEmail, string otp)
    {
        var smtp = _config.GetSection("Smtp");

        var client = new SmtpClient(smtp["Host"], int.Parse(smtp["Port"]!))
        {
            Credentials = new NetworkCredential(smtp["Username"], smtp["Password"]),
            EnableSsl = true
        };

        var mail = new MailMessage
        {
            From = new MailAddress(smtp["Username"]!, smtp["DisplayName"] ?? "UserService"),
            Subject = "Mã OTP đăng nhập của bạn",
            Body = $@"
                <div style='font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e0e0e0;border-radius:8px'>
                    <h2 style='color:#333'>Xác thực đăng nhập</h2>
                    <p>Mã OTP của bạn là:</p>
                    <div style='font-size:36px;font-weight:bold;letter-spacing:8px;color:#4f46e5;margin:24px 0'>{otp}</div>
                    <p style='color:#888;font-size:13px'>Mã có hiệu lực trong <strong>2 phút</strong>. Không chia sẻ mã này với bất kỳ ai.</p>
                </div>",
            IsBodyHtml = true
        };
        mail.To.Add(toEmail);

        await client.SendMailAsync(mail);
    }
}
