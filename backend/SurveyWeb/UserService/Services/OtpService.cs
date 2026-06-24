using StackExchange.Redis;

namespace UserService.Services;

public class OtpService
{
    private readonly IDatabase _redis;
    private const int OtpTtlSeconds = 120; // 2 phút
    private const string Prefix = "otp:";

    public OtpService(IConnectionMultiplexer redis)
    {
        _redis = redis.GetDatabase();
    }

    /// <summary>Sinh OTP 6 số và lưu vào Redis với TTL 2 phút.</summary>
    public async Task<string> GenerateAndStoreAsync(string email)
    {
        var otp = Random.Shared.Next(100_000, 999_999).ToString();
        await _redis.StringSetAsync(Prefix + email, otp, TimeSpan.FromSeconds(OtpTtlSeconds));
        return otp;
    }

    /// <summary>Xác minh OTP. Đúng → xóa key khỏi Redis. Sai hoặc hết hạn → false.</summary>
    public async Task<bool> VerifyAsync(string email, string otp)
    {
        var key = Prefix + email;
        var stored = await _redis.StringGetAsync(key);
        if (stored.IsNullOrEmpty || stored != otp) return false;

        await _redis.KeyDeleteAsync(key); // dùng 1 lần
        return true;
    }
}
