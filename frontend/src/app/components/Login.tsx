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
import { login } from "../services/authService";
import { ClipboardList } from "lucide-react";

export function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const result = login(formData);

    setIsLoading(false);

    if (result.success) {
      // Navigate based on role
      if (result.user?.role === "owner") {
        navigate("/owner/dashboard");
      } else {
        navigate("/helper/marketplace");
      }
      // Force re-render
      window.dispatchEvent(new Event("storage"));
    } else {
      setError(result.error || "Đã xảy ra lỗi");
    }
  };

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
        <form onSubmit={handleSubmit}>
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
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    email: e.target.value,
                  })
                }
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
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    password: e.target.value,
                  })
                }
                required
              />
            </div>
            <div className="flex flex-col gap-4 mt-5">
              <Button variant="outline" className="w-full">
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt="Google"
                  width="18"
                  height="18"
                />
                Đăng nhập bằng Google
              </Button>
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
