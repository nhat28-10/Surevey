using System.Security.Claims;

namespace WalletService.Services;

public interface ICurrentUserService
{
    int UserId { get; }
    string Role { get; }
}

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public int UserId
    {
        get
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var value = user?.FindFirst("userId")?.Value ?? user?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(value, out var userId))
            {
                throw new ApiException(StatusCodes.Status401Unauthorized, "Authenticated token does not contain a valid userId claim.");
            }
            return userId;
        }
    }

    public string Role
    {
        get
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var role = user?.FindFirst(ClaimTypes.Role)?.Value ?? user?.FindFirst("role")?.Value;
            if (string.IsNullOrWhiteSpace(role))
            {
                throw new ApiException(StatusCodes.Status401Unauthorized, "Authenticated token does not contain a valid role claim.");
            }
            return role;
        }
    }
}
