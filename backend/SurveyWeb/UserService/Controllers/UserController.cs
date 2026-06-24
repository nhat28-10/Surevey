using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UserService.DTOs;
using UserService.Models;
using UserService.Services;

namespace UserService.Controllers;

[ApiController]
[Route("api/user")]
public class UserController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly MyDbContext _dbContext;
    private readonly JwtService _jwtService;
    private readonly OtpService _otpService;
    private readonly EmailService _emailService;

    public UserController(
        IUserService userService,
        MyDbContext dbContext,
        JwtService jwtService,
        OtpService otpService,
        EmailService emailService)
    {
        _userService = userService;
        _dbContext = dbContext;
        _jwtService = jwtService;
        _otpService = otpService;
        _emailService = emailService;
    }

    // ─────────────────────────────────────────────
    // ĐĂNG KÝ thường (username + password)
    // ─────────────────────────────────────────────
    [HttpPost("register")]
    public IActionResult Register([FromBody] User user)
    {
        try
        {
            _userService.CreateUser(user);
            return Ok(new { message = "Đăng ký thành công" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // ─────────────────────────────────────────────
    // ĐĂNG NHẬP bước 1: email + password → gửi OTP
    // POST /api/user/login
    // ─────────────────────────────────────────────
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest login)
    {
        try
        {
            // Validate email + password (ném exception nếu sai)
            var user = _userService.ValidateUser(login.Email, login.Password);

            // Sinh OTP và gửi về email
            var otp = await _otpService.GenerateAndStoreAsync(login.Email);
            await _emailService.SendOtpAsync(login.Email, otp);

            return Ok(new { message = "Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra và xác nhận." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // ─────────────────────────────────────────────
    // ĐĂNG NHẬP bước 2: xác minh OTP → trả JWT
    // POST /api/user/verify-otp
    // ─────────────────────────────────────────────
    [HttpPost("verify-otp")]
    public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpRequest request)
    {
        var isValid = await _otpService.VerifyAsync(request.Email, request.Otp);
        if (!isValid)
            return BadRequest(new { message = "Mã OTP không hợp lệ hoặc đã hết hạn." });

        var user = _userService.GetByEmail(request.Email);
        if (user == null)
            return NotFound(new { message = "Người dùng không tồn tại." });

        var token = _jwtService.GenerateToken(user);
        return Ok(new
        {
            message = "Đăng nhập thành công",
            token,
            user = new
            {
                user.UserId,
                user.UserName,
                user.Email,
                user.FullName,
                user.AvatarUrl,
                Role = user.Role!.RoleName
            }
        });
    }

    // ─────────────────────────────────────────────
    // GOOGLE OAUTH – bước 1: chuyển hướng đến Google
    // GET /api/user/login-google
    // ─────────────────────────────────────────────
    [HttpGet("login-google")]
    public IActionResult LoginGoogle()
    {
        var redirectUrl = Url.Action(nameof(GoogleCallback), "User", null, Request.Scheme);
        var properties = new AuthenticationProperties { RedirectUri = redirectUrl };
        return Challenge(properties, GoogleDefaults.AuthenticationScheme);
    }

    // ─────────────────────────────────────────────
    // GOOGLE OAUTH – bước 2: Google callback → trả JWT
    // GET /api/user/google-callback
    // ─────────────────────────────────────────────
    [HttpGet("google-callback")]
    public async Task<IActionResult> GoogleCallback()
    {
        var result = await HttpContext.AuthenticateAsync(GoogleDefaults.AuthenticationScheme);
        if (!result.Succeeded)
            return Unauthorized(new { message = "Xác thực Google thất bại" });

        var claims = result.Principal!.Claims.ToList();
        var googleId = claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value ?? "";
        var email = claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value ?? "";
        var fullName = claims.FirstOrDefault(c => c.Type == ClaimTypes.Name)?.Value ?? "";
        var avatarUrl = claims.FirstOrDefault(c => c.Type == "urn:google:picture")?.Value;

        var user = await _userService.FindOrCreateGoogleUserAsync(googleId, email, fullName, avatarUrl);
        var token = _jwtService.GenerateToken(user);

        return Ok(new
        {
            message = "Đăng nhập Google thành công",
            token,
            user = new
            {
                user.UserId,
                user.UserName,
                user.Email,
                user.FullName,
                user.AvatarUrl,
                Role = user.Role!.RoleName
            }
        });
    }

    // ─────────────────────────────────────────────
    // CẬP NHẬT thông tin – chỉ user đã đăng nhập
    // ─────────────────────────────────────────────
    [Authorize]
    [HttpPut("update")]
    public IActionResult Update([FromBody] UserInfo user)
    {
        try
        {
            _userService.UpdateUser(user);
            return Ok(new { message = "Cập nhật thành công" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // ─────────────────────────────────────────────
    // LẤY THÔNG TIN user – chỉ user đã đăng nhập
    // ─────────────────────────────────────────────
    [Authorize]
    [HttpGet("getUser/{id}")]
    public IActionResult GetUserInfo(int id)
    {
        try
        {
            var userInfo = _userService.GetUserInfo(id);
            return Ok(userInfo);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // ─────────────────────────────────────────────
    // DANH SÁCH MEMBER – chỉ Admin & Employee
    // ─────────────────────────────────────────────
    [Authorize(Roles = "Admin,Employee")]
    [HttpGet("members")]
    public async Task<IActionResult> GetMembers()
    {
        var members = await _dbContext.Users
            .Include(u => u.Role)
            .Where(u => u.Role != null && u.Role.RoleName == "Member")
            .OrderBy(u => u.UserId)
            .Select(u => new
            {
                u.UserId,
                u.UserName,
                u.Email,
                u.PhoneNumber,
                u.FullName,
                u.Sex,
                u.IdentityCard,
                u.DateOfBirth,
                u.Address,
                u.AvatarUrl
            }).ToListAsync();

        return Ok(members);
    }

    // ─────────────────────────────────────────────
    // PAGING – chỉ Admin
    // ─────────────────────────────────────────────
    [Authorize(Roles = "Admin")]
    [HttpGet("paging")]
    public async Task<IActionResult> GetPaged([FromQuery] PagingRequest request)
    {
        var result = await _userService.GetPagedAsync(request);
        return Ok(result);
    }

    // ─────────────────────────────────────────────
    // PROFILE – lấy thông tin user đang đăng nhập từ JWT
    // ─────────────────────────────────────────────
    [Authorize]
    [HttpGet("profile")]
    public IActionResult GetProfile()
    {
        var userId = int.Parse(User.FindFirst("userId")!.Value);
        var userInfo = _userService.GetUserInfo(userId);
        return Ok(userInfo);
    }
}
