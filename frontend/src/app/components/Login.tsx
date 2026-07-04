import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "./ui/input-otp";
import { login, verifyOtp, getGoogleLoginUrl } from "../services/authService";
import { ClipboardList } from "lucide-react";
import type { UserRole } from "../types/auth";

const redirectByRole = (role: UserRole, navigate: ReturnType<typeof useNavigate>) => {
  if (role === "admin") navigate("/admin/requests");
  else if (role === "customer") navigate("/customer/dashboard");
  else navigate("/collaborator/marketplace");
};

export function Login() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"login" | "otp">("login");
  const [pendingEmail, setPendingEmail] = useState("");
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    const result = await login(formData);
    setIsLoading(false);

    if (!result.success) {
      setError(result.error ?? "Đã xảy ra lỗi");
      return;
    }
    if (result.requiresOtp) {
      setPendingEmail(formData.email);
      setStep("otp");
      return;
    }
    if (result.user) redirectByRole(result.user.role, navigate);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) {
      setError("Vui lòng nhập đủ 6 chữ số OTP");
      return;
    }
    setError("");
    setIsLoading(true);
    const result = await verifyOtp(pendingEmail, otp);
    setIsLoading(false);

    if (!result.success) {
      setError(result.error ?? "Mã OTP không đúng");
      return;
    }
    if (result.user) redirectByRole(result.user.role, navigate);
  };

  if (step === "otp") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <ClipboardList className="w-12 h-12 text-blue-600" />
            </div>
            <CardTitle className="text-2xl text-center">Xác thực OTP</CardTitle>
            <CardDescription className="text-center">
              Mã OTP đã được gửi đến <strong>{pendingEmail}</strong>
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleVerifyOtp}>
            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 mt-2">
              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={isLoading || otp.length < 6}
              >
                {isLoading ? "Đang xác thực..." : "Xác nhận"}
              </Button>
              <Button
                type="button"
                variant="link"
                className="text-sm"
                onClick={() => {
                  setStep("login");
                  setOtp("");
                  setError("");
                }}
              >
                Quay lại đăng nhập
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <ClipboardList className="w-12 h-12 text-blue-600" />
          </div>
          <CardTitle className="text-2xl text-center">Đăng nhập</CardTitle>
          <CardDescription className="text-center">
            Nhập thông tin để đăng nhập vào tài khoản của bạn
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            <div className="flex flex-col gap-4 mt-5">
              <a href={getGoogleLoginUrl()} className="w-full">
                <Button type="button" variant="outline" className="w-full gap-2">
                  <img
                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                    alt="Google"
                    width="18"
                    height="18"
                  />
                  Đăng nhập bằng Google
                </Button>
              </a>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4 mt-5">
            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={isLoading}
            >
              {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>

            <div className="text-sm text-center text-gray-600">
              Chưa có tài khoản?{" "}
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto"
                onClick={() => navigate("/signup")}
              >
                Đăng ký ngay
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
