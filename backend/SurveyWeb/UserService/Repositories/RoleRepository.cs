using UserService.Models;

namespace UserService.Repositories
{
    public class RoleRepository : IRoleRepository
    {
        private readonly MyDbContext _context;

        public RoleRepository(MyDbContext context)
        {
            _context = context;
        }

        public Role? GetByName(string roleName)
        {
            return _context.Roles.FirstOrDefault(r => r.RoleName == roleName);
        }
    }
}