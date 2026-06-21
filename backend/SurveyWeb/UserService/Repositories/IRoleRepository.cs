using UserService.Models;

namespace UserService.Repositories
{
    public interface IRoleRepository
    {
        Role? GetByName(string roleName);
    }
}