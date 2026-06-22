using UserService.DTOs;
using UserService.Models;

namespace UserService.Repositories;

public interface IUserRepository
{
    User GetByUserNameAndPassword(string username, string password);
    User GetById(int id);
    List<User> GetAll();
    void Add(User user);
    void Update(UserInfo userInfo);
    void Delete(User user);
    bool ExistsByUsername(string username);
    void Save();
    Task SaveAsync();
    Task<PagingResponse<User>> GetPagedUserAsync(int pageIndex, int pageSize);
    Task<PagingResponse<T>> GetPagedListAsync<T>(IQueryable<T> query, int pageIndex, int pageSize);
    User GetByUserName(string username);
    User? GetByEmail(string email);
    User? GetByGoogleId(string googleId);
}
