using System.ComponentModel.DataAnnotations;

namespace UserService.Models;

public class Role
{
    [Key]
    public int RoleId { get; set; }
    public string RoleName { get; set; }

    public Role(int id, string roleName)
    {
        RoleId = id;
        RoleName = roleName;
    }

    public Role()
    {
    }
}