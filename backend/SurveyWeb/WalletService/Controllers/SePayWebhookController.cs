using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WalletService.DTOs;
using WalletService.Services;

namespace WalletService.Controllers;

[ApiController]
[AllowAnonymous]
[Route("api/sepay")]
public class SePayWebhookController : ApiControllerBase
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly IConfiguration _configuration;
    private readonly IWalletFlowService _walletFlowService;

    public SePayWebhookController(IConfiguration configuration, IWalletFlowService walletFlowService)
    {
        _configuration = configuration;
        _walletFlowService = walletFlowService;
    }

    [HttpPost("webhook")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> Receive()
    {
        var rawPayload = await ReadRawBodyAsync();
        var unauthorized = ValidateWebhookAuthentication(rawPayload);
        if (unauthorized != null)
        {
            return unauthorized;
        }

        SePayWebhookRequest? request;
        try
        {
            request = JsonSerializer.Deserialize<SePayWebhookRequest>(rawPayload, JsonOptions);
        }
        catch (JsonException)
        {
            return BadRequest(new { success = false, message = "Invalid SePay JSON payload." });
        }

        if (request == null)
        {
            return BadRequest(new { success = false, message = "Empty SePay payload." });
        }

        try
        {
            await _walletFlowService.ProcessSePayWebhookAsync(request, rawPayload);
            return Ok(new { success = true });
        }
        catch (ApiException ex)
        {
            return StatusCode(ex.StatusCode, new { success = false, message = ex.Message });
        }
    }

    private async Task<string> ReadRawBodyAsync()
    {
        Request.EnableBuffering();
        Request.Body.Position = 0;
        using var reader = new StreamReader(Request.Body, Encoding.UTF8, detectEncodingFromByteOrderMarks: false, leaveOpen: true);
        var body = await reader.ReadToEndAsync();
        Request.Body.Position = 0;
        return body;
    }

    private IActionResult? ValidateWebhookAuthentication(string rawPayload)
    {
        var hmacSecret = _configuration["SePay:WebhookSecret"];
        if (!string.IsNullOrWhiteSpace(hmacSecret))
        {
            return ValidateHmacSignature(rawPayload, hmacSecret);
        }

        var apiKey = _configuration["SePay:WebhookApiKey"];
        if (!string.IsNullOrWhiteSpace(apiKey))
        {
            var authorization = Request.Headers["Authorization"].FirstOrDefault();
            const string prefix = "Apikey ";
            if (string.IsNullOrWhiteSpace(authorization)
                || !authorization.StartsWith(prefix, StringComparison.OrdinalIgnoreCase)
                || !FixedTimeEquals(apiKey, authorization[prefix.Length..].Trim()))
            {
                return Unauthorized(new { success = false, message = "Invalid SePay webhook API key." });
            }
        }

        return null;
    }

    private IActionResult? ValidateHmacSignature(string rawPayload, string secret)
    {
        var signature = Request.Headers["X-SePay-Signature"].FirstOrDefault();
        var timestamp = Request.Headers["X-SePay-Timestamp"].FirstOrDefault();
        if (string.IsNullOrWhiteSpace(signature) || string.IsNullOrWhiteSpace(timestamp))
        {
            return Unauthorized(new { success = false, message = "Missing SePay signature headers." });
        }

        if (!long.TryParse(timestamp, out var unixSeconds))
        {
            return Unauthorized(new { success = false, message = "Invalid SePay signature timestamp." });
        }

        var now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        if (Math.Abs(now - unixSeconds) > 300)
        {
            return Unauthorized(new { success = false, message = "Expired SePay signature timestamp." });
        }

        var signedPayload = $"{timestamp}.{rawPayload}";
        var expectedHash = ComputeHmacSha256Hex(secret, signedPayload);
        var expectedSignature = $"sha256={expectedHash}";

        return FixedTimeEquals(expectedSignature, signature.Trim())
            ? null
            : Unauthorized(new { success = false, message = "Invalid SePay webhook signature." });
    }

    private static string ComputeHmacSha256Hex(string secret, string payload)
    {
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));
        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    private static bool FixedTimeEquals(string expected, string actual)
    {
        var expectedBytes = Encoding.UTF8.GetBytes(expected);
        var actualBytes = Encoding.UTF8.GetBytes(actual);
        return expectedBytes.Length == actualBytes.Length
            && CryptographicOperations.FixedTimeEquals(expectedBytes, actualBytes);
    }
}
