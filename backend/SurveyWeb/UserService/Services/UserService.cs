using UserService.DTOs;
using UserService.Models;
using UserService.Repositories;

namespace UserService.Services;

public class UserService : IUserService
{
    private readonly IRoleRepository _roleRepository;
    private readonly IUserRepository _userRepository;

    public UserService(IUserRepository userRepository, IRoleRepository roleRepository)
    {
        _userRepository = userRepository;
        _roleRepository = roleRepository;
    }

    public void CreateUser(User user)
    {
        if (_userRepository.ExistsByUsername(user.UserName))
            throw new Exception("Tên đăng nhập đã tồn tại");

        if (user.Password != user.ConfirmPassword)
            throw new Exception("Mật khẩu và xác nhận mật khẩu không khớp");

        if (user.RoleId == 0)
        {
            var memberRole = _roleRepository.GetByName("Member");
            if (memberRole == null)
                throw new Exception("Vai trò 'Member' chưa được khởi tạo");
            user.RoleId = memberRole.RoleId;
            user.Role = memberRole;
        }

        if (user.DateOfBirth.HasValue && user.DateOfBirth.Value.Kind == DateTimeKind.Unspecified)
            user.DateOfBirth = DateTime.SpecifyKind(user.DateOfBirth.Value, DateTimeKind.Utc);

        if (user.DateOfBirth.HasValue)
            user.DateOfBirth = user.DateOfBirth.Value.Date;

        user.Password = BCrypt.Net.BCrypt.HashPassword(user.Password);

        _userRepository.Add(user);
        _userRepository.Save();
    }

    public bool DeleteUser(int userId, out string errorMessage)
    {
        throw new NotImplementedException();
    }

    public List<User> GetAllUsers()
    {
        return _userRepository.GetAll();
    }

    public User GetUserById(int userId)
    {
        throw new NotImplementedException();
    }

    public UserInfo GetUserInfo(int userId)
    {
        var user = _userRepository.GetById(userId);
        if (user == null) throw new Exception("Người dùng không tồn tại.");

        return new UserInfo
        {
            UserId = user.UserId,
            UserName = user.UserName,
            Email = user.Email,
            IdentityCard = user.IdentityCard,
            Sex = user.Sex,
            Address = user.Address,
            PhoneNumber = user.PhoneNumber,
            DateOfBirth = user.DateOfBirth ?? DateTime.MinValue,
            FullName = user.FullName
        };
    }

    public void UpdateUser(UserInfo userInfo)
    {
        var existingUser = _userRepository.GetById(userInfo.UserId);
        if (existingUser == null) throw new Exception("Người dùng không tồn tại.");

        if (userInfo.DateOfBirth.Kind == DateTimeKind.Unspecified)
            userInfo.DateOfBirth = DateTime.SpecifyKind(userInfo.DateOfBirth, DateTimeKind.Utc);

        existingUser.DateOfBirth = userInfo.DateOfBirth.Date;

        _userRepository.Update(userInfo);
        _userRepository.Save();
    }

    public User ValidateUser(string email, string password)
    {
        var user = _userRepository.GetByEmail(email);
        if (user == null) throw new Exception("Email không tồn tại!");
        if (string.IsNullOrEmpty(user.Password))
            throw new Exception("Tài khoản này được đăng ký bằng Google, vui lòng đăng nhập bằng Google.");
        if (!BCrypt.Net.BCrypt.Verify(password, user.Password))
            throw new Exception("Mật khẩu không chính xác!");
        return user;
    }

    public User? GetByEmail(string email)
    {
        return _userRepository.GetByEmail(email);
    }

    /// <summary>
    /// Tìm user theo GoogleId hoặc Email. Nếu chưa có thì tạo mới với role Member.
    /// </summary>
    public async Task<User> FindOrCreateGoogleUserAsync(string googleId, string email, string fullName, string? avatarUrl)
    {
        // Tìm theo GoogleId trước
        var user = _userRepository.GetByGoogleId(googleId);
        if (user != null) return user;

        // Tìm theo email (user đã đăng ký bằng username/password trước đó)
        user = _userRepository.GetByEmail(email);
        if (user != null)
        {
            // Liên kết GoogleId vào tài khoản hiện có
            user.GoogleId = googleId;
            if (string.IsNullOrEmpty(user.AvatarUrl))
                user.AvatarUrl = avatarUrl;
            _userRepository.Save();
            return user;
        }

        // Tạo user mới từ Google
        var memberRole = _roleRepository.GetByName("Member")
            ?? throw new Exception("Vai trò 'Member' chưa được khởi tạo");

        var newUser = new User
        {
            GoogleId = googleId,
            Email = email,
            FullName = fullName,
            UserName = email.Split('@')[0] + "_" + Guid.NewGuid().ToString("N")[..4],
            AvatarUrl = avatarUrl,
            Password = null, // Không có password vì dùng Google
            RoleId = memberRole.RoleId,
            Role = memberRole
        };

        _userRepository.Add(newUser);
        await _userRepository.SaveAsync();
        return newUser;
    }

    public async Task<PagingResponse<UserInfo>> GetPagedAsync(PagingRequest request)
    {
        var pagedData = await _userRepository.GetPagedUserAsync(request.PageIndex, request.PageSize);
        var items = pagedData.Items.Select(u => new UserInfo
        {
            UserId = u.UserId,
            UserName = u.UserName,
            Email = u.Email,
            IdentityCard = u.IdentityCard,
            Sex = u.Sex,
            PhoneNumber = u.PhoneNumber,
            DateOfBirth = u.DateOfBirth ?? DateTime.MinValue,
            Address = u.Address,
            FullName = u.FullName
        }).ToList();

        return new PagingResponse<UserInfo>(items, pagedData.TotalRecords, request.PageIndex, request.PageSize);
    }
}
