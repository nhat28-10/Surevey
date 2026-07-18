using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UserService.DTOs;
using UserService.Models;

namespace UserService.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin/collaborators")]
public class AdminCollaboratorsController : ControllerBase
{
    private readonly MyDbContext _dbContext;

    public AdminCollaboratorsController(MyDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<ActionResult<PagingResponse<CollaboratorAccountDto>>> GetCollaborators(
        [FromQuery] int pageIndex = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null)
    {
        pageIndex = Math.Max(pageIndex, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _dbContext.Users
            .AsNoTracking()
            .Include(user => user.Role)
            .Where(user => user.Role != null && user.Role.RoleName == "Collaborator");

        if (!string.IsNullOrWhiteSpace(search))
        {
            var keyword = search.Trim().ToLower();
            query = query.Where(user =>
                user.UserName.ToLower().Contains(keyword)
                || user.Email.ToLower().Contains(keyword)
                || (user.FullName != null && user.FullName.ToLower().Contains(keyword))
                || (user.PhoneNumber != null && user.PhoneNumber.Contains(keyword)));
        }

        var totalRecords = await query.CountAsync();
        var users = await query
            .OrderByDescending(user => user.UserId)
            .Skip((pageIndex - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
        var items = users.Select(ToDto).ToList();

        return Ok(new PagingResponse<CollaboratorAccountDto>(items, totalRecords, pageIndex, pageSize));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<CollaboratorAccountDto>> GetCollaborator(int id)
    {
        var collaborator = await _dbContext.Users
            .AsNoTracking()
            .Include(user => user.Role)
            .Where(user => user.UserId == id && user.Role != null && user.Role.RoleName == "Collaborator")
            .FirstOrDefaultAsync();

        if (collaborator is null)
            return NotFound(new { message = "Không tìm thấy tài khoản Collaborator." });

        return Ok(ToDto(collaborator));
    }

    private static CollaboratorAccountDto ToDto(User user)
    {
        return new CollaboratorAccountDto
        {
            UserId = user.UserId,
            UserName = user.UserName,
            Email = user.Email,
            FullName = user.FullName,
            PhoneNumber = user.PhoneNumber,
            Sex = user.Sex,
            IdentityCard = user.IdentityCard,
            DateOfBirth = user.DateOfBirth,
            Address = user.Address,
            AvatarUrl = user.AvatarUrl,
            RoleName = user.Role?.RoleName ?? "Collaborator",
            AuthProvider = string.IsNullOrEmpty(user.GoogleId) ? "Password" : "Google",
            ProfileCompletionPercent = CalculateProfileCompletion(user)
        };
    }

    private static int CalculateProfileCompletion(User user)
    {
        var fields = new[]
        {
            user.UserName,
            user.Email,
            user.FullName,
            user.PhoneNumber,
            user.IdentityCard,
            user.Sex,
            user.Address
        };

        var filled = fields.Count(value => !string.IsNullOrWhiteSpace(value));
        if (user.DateOfBirth.HasValue) filled++;

        return (int)Math.Round(filled / 8.0 * 100);
    }
}
