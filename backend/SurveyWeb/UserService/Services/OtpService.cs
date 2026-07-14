using Microsoft.Extensions.Caching.Memory;

namespace UserService.Services;

public class OtpService
{
    private readonly IMemoryCache _cache;
    private static readonly TimeSpan OtpTtl = TimeSpan.FromSeconds(120); // 2 phút
    private const string Prefix = "otp:";

    public OtpService(IMemoryCache cache)
    {
        _cache = cache;
    }

    /// <summary>Sinh OTP 6 số và lưu tạm trong memory cache với TTL 2 phút.</summary>
    public Task<string> GenerateAndStoreAsync(string email)
    {
        var otp = Random.Shared.Next(100_000, 999_999).ToString();
        _cache.Set(Prefix + email, otp, OtpTtl);
        return Task.FromResult(otp);
    }

    /// <summary>Xác minh OTP. Đúng → xóa key khỏi cache. Sai hoặc hết hạn → false.</summary>
    public Task<bool> VerifyAsync(string email, string otp)
    {
        var key = Prefix + email;
        if (!_cache.TryGetValue(key, out string? stored) || stored != otp) return Task.FromResult(false);

        _cache.Remove(key); // dùng 1 lần
        return Task.FromResult(true);
    }
}
