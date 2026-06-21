using Microsoft.EntityFrameworkCore;
using UserService.DTOs;
using UserService.Models;

namespace UserService.Repositories;

public class UserRepository : IUserRepository
{
    private readonly MyDbContext _context;

    public UserRepository(MyDbContext context)
    {
        _context = context;
    }

    public User GetByUserNameAndPassword(string username, string password)
    {
        return _context.Users
            .Include(u => u.Role)
            .SingleOrDefault(u => u.UserName == username && u.Password == password);
    }

    public User GetById(int id)
    {
        return _context.Users
            .Include(u => u.Role)
            .FirstOrDefault(u => u.UserId == id);
    }

    public List<User> GetAll()
    {
        return _context.Users
            .Include(u => u.Role)
            .ToList();
    }

    public void Add(User user)
    {
        _context.Users.Add(user);
    }

    public void Update(UserInfo userInfo)
    {
        var user = GetById(userInfo.UserId);
        if (user == null) throw new Exception("User not found");

        user.UserName = userInfo.UserName;
        user.Email = userInfo.Email;
        user.IdentityCard = userInfo.IdentityCard;
        user.Sex = userInfo.Sex;
        user.PhoneNumber = userInfo.PhoneNumber;
        user.DateOfBirth = userInfo.DateOfBirth;
        user.Address = userInfo.Address;
        user.FullName = userInfo.FullName;

        _context.Users.Update(user);
    }

    public void Delete(User user)
    {
        _context.Users.Remove(user);
    }

    public bool ExistsByUsername(string username)
    {
        return _context.Users.Any(u => u.UserName == username);
    }

    public void Save()
    {
        _context.SaveChanges();
    }

    public async Task SaveAsync()
    {
        await _context.SaveChangesAsync();
    }

    public User GetByUserName(string username)
    {
        return _context.Users
            .Include(u => u.Role)
            .SingleOrDefault(u => u.UserName == username);
    }

    public User? GetByEmail(string email)
    {
        return _context.Users
            .Include(u => u.Role)
            .FirstOrDefault(u => u.Email == email);
    }

    public User? GetByGoogleId(string googleId)
    {
        return _context.Users
            .Include(u => u.Role)
            .FirstOrDefault(u => u.GoogleId == googleId);
    }

    public async Task<PagingResponse<User>> GetPagedUserAsync(int pageIndex, int pageSize)
    {
        var query = _context.Users.AsQueryable();
        return await GetPagedListAsync(query, pageIndex, pageSize);
    }

    public async Task<PagingResponse<T>> GetPagedListAsync<T>(IQueryable<T> query, int pageIndex, int pageSize)
    {
        var totalRecords = await query.CountAsync();
        var items = await query.Skip((pageIndex - 1) * pageSize)
                               .Take(pageSize)
                               .ToListAsync();
        return new PagingResponse<T>(items, totalRecords, pageIndex, pageSize);
    }
}
