import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import { login } from "../services/authService";
import { ClipboardList, LockKeyhole, Mail } from "lucide-react";

export function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    const result = await login(formData);
    setIsLoading(false);

    if (result.success) {
      navigate("/dashboard");
      window.dispatchEvent(new Event("storage"));
      return;
    }

    setError(result.error || "Đã xảy ra lỗi");
  };

  return <div className="grid min-h-[80vh] place-items-center py-8">
    <div className="w-full max-w-5xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
        <div className="hidden bg-slate-950 p-8 text-white lg:block">
          <div className="flex h-full flex-col justify-between">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white text-slate-950"><ClipboardList className="h-7 w-7" /></div>
              <h1 className="mt-8 text-3xl font-bold">Đăng nhập SureSurvey</h1>
              <p className="mt-3 leading-7 text-slate-300">Một tài khoản, ba dashboard khác nhau theo role: Customer, Collaborator và Admin.</p>
            </div>
            <div className="grid gap-3 text-sm text-slate-300">
              <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">Customer theo dõi campaign và tiến độ response.</div>
              <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">Collaborator nhận việc, nộp kết quả và xem ví.</div>
              <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">Admin duyệt nghiệp vụ và xem doanh thu.</div>
            </div>
          </div>
        </div>

        <Card className="border-0 shadow-none">
          <CardHeader className="space-y-2 p-8 pb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-900 text-white lg:hidden"><ClipboardList className="h-7 w-7" /></div>
            <CardTitle className="text-2xl text-slate-950">Đăng nhập</CardTitle>
            <CardDescription>Nhập thông tin để mở dashboard theo đúng vai trò của bạn.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 px-8">
              {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input id="email" type="email" placeholder="email@example.com" value={formData.email} onChange={event => setFormData({ ...formData, email: event.target.value })} required className="pl-9" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <div className="relative">
                  <LockKeyhole className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input id="password" type="password" placeholder="••••••••" value={formData.password} onChange={event => setFormData({ ...formData, password: event.target.value })} required className="pl-9" />
                </div>
              </div>

              <Button type="button" variant="outline" className="w-full" disabled title="Chưa cấu hình Google OAuth">
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="18" height="18" />
                Đăng nhập Google (chưa cấu hình)
              </Button>
            </CardContent>

            <CardFooter className="flex flex-col gap-4 p-8 pt-5">
              <Button type="submit" className="w-full bg-slate-900 text-white hover:bg-slate-800" disabled={isLoading}>{isLoading ? "Đang đăng nhập..." : "Đăng nhập"}</Button>
              <div className="text-center text-sm text-slate-600">
                Chưa có tài khoản?{" "}
                <Button type="button" variant="link" className="h-auto p-0" onClick={() => navigate("/signup")}>Đăng ký ngay</Button>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  </div>;
}
