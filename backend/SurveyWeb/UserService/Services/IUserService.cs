using UserService.DTOs;
using UserService.Models;

namespace UserService.Services;

public interface IUserService
{
    void CreateUser(User user);
    List<User> GetAllUsers();
    User GetUserById(int userId);
    UserInfo GetUserInfo(int userId);
    void UpdateUser(UserInfo user);
    bool DeleteUser(int userId, out string errorMessage);
    User ValidateUser(string email, string password);
    Task<PagingResponse<UserInfo>> GetPagedAsync(PagingRequest request);

    // Google OAuth
    Task<User> FindOrCreateGoogleUserAsync(string googleId, string email, string fullName, string? avatarUrl);
    User? GetByEmail(string email);
}
