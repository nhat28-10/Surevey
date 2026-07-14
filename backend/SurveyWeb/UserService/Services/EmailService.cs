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
        var host = smtp["Host"];
        var username = smtp["Username"];
        var password = smtp["Password"];
        var timeoutSeconds = _config.GetValue("Smtp:TimeoutSeconds", 10);

        if (string.IsNullOrWhiteSpace(host) ||
            string.IsNullOrWhiteSpace(smtp["Port"]) ||
            string.IsNullOrWhiteSpace(username) ||
            string.IsNullOrWhiteSpace(password))
        {
            throw new InvalidOperationException("Thiếu cấu hình SMTP để gửi OTP.");
        }

        if (!int.TryParse(smtp["Port"], out var port))
        {
            throw new InvalidOperationException("Cổng SMTP không hợp lệ.");
        }

        using var client = new SmtpClient(host, port)
        {
            Credentials = new NetworkCredential(username, password),
            EnableSsl = true,
            Timeout = timeoutSeconds * 1000
        };

        using var mail = new MailMessage
        {
            From = new MailAddress(username, smtp["DisplayName"] ?? "UserService"),
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

        try
        {
            await client.SendMailAsync(mail).WaitAsync(TimeSpan.FromSeconds(timeoutSeconds));
        }
        catch (TimeoutException ex)
        {
            client.SendAsyncCancel();
            throw new TimeoutException("Gửi email OTP quá thời gian chờ. Vui lòng kiểm tra cấu hình SMTP hoặc kết nối mạng.", ex);
        }
    }
}
