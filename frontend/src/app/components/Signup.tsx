import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { signup } from "../services/authService";
import type { UserRole } from "../types/auth";
import { ClipboardList, Search, Users } from "lucide-react";

export function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    userName: "",
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "Collaborator" as Exclude<UserRole, "Admin">,
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (formData.password !== formData.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    setIsLoading(true);
    const result = await signup(formData);
    setIsLoading(false);

    if (!result.success) {
      setError(result.error || "Đã xảy ra lỗi");
      return;
    }

    navigate(result.user?.role === "Customer" ? "/customer/dashboard" : "/collaborator/marketplace");
  };

  return <div className="grid min-h-[80vh] place-items-center py-8">
    <Card className="w-full max-w-3xl border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-100">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-900 text-white"><ClipboardList className="h-7 w-7" /></div>
          <div>
            <CardTitle className="text-2xl text-slate-950">Đăng ký tài khoản</CardTitle>
            <CardDescription className="mt-1">Chọn đúng vai trò để hệ thống đưa bạn vào dashboard phù hợp.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-5 p-6">
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="userName">Tên đăng nhập *</Label><Input id="userName" value={formData.userName} onChange={event => setFormData(prev => ({ ...prev, userName: event.target.value }))} required maxLength={50} /></div>
            <div className="space-y-2"><Label htmlFor="name">Họ và tên *</Label><Input id="name" value={formData.name} onChange={event => setFormData(prev => ({ ...prev, name: event.target.value }))} required /></div>
            <div className="space-y-2 md:col-span-2"><Label htmlFor="email">Email *</Label><Input id="email" type="email" value={formData.email} onChange={event => setFormData(prev => ({ ...prev, email: event.target.value }))} required maxLength={100} /></div>
            <div className="space-y-2"><Label htmlFor="password">Mật khẩu *</Label><Input id="password" type="password" value={formData.password} onChange={event => setFormData(prev => ({ ...prev, password: event.target.value }))} required minLength={6} /></div>
            <div className="space-y-2"><Label htmlFor="confirmPassword">Xác nhận *</Label><Input id="confirmPassword" type="password" value={formData.confirmPassword} onChange={event => setFormData(prev => ({ ...prev, confirmPassword: event.target.value }))} required minLength={6} /></div>
          </div>

          <div className="space-y-3">
            <Label>Vai trò đăng ký</Label>
            <RadioGroup value={formData.role} onValueChange={value => setFormData(prev => ({ ...prev, role: value as Exclude<UserRole, "Admin"> }))}>
              <div className="grid gap-3 md:grid-cols-2">
                <RoleOption
                  id="collaborator"
                  value="Collaborator"
                  active={formData.role === "Collaborator"}
                  icon={<Search className="h-5 w-5 text-blue-700" />}
                  title="Collaborator"
                  description="Nhận campaign, làm khảo sát và nhận thưởng."
                />
                <RoleOption
                  id="customer"
                  value="Customer"
                  active={formData.role === "Customer"}
                  icon={<Users className="h-5 w-5 text-green-700" />}
                  title="Customer"
                  description="Đăng campaign khảo sát và thanh toán ngân sách thưởng."
                />
              </div>
            </RadioGroup>
          </div>

          <Button type="button" variant="outline" className="w-full" disabled title="Backend Google callback hiện trả JSON, chưa có callback về frontend">Google OAuth chưa nối callback về SPA</Button>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 border-t border-slate-100 p-6">
          <Button type="submit" className="w-full bg-slate-900 text-white hover:bg-slate-800" disabled={isLoading}>{isLoading ? "Đang đăng ký..." : "Đăng ký"}</Button>
          <div className="text-center text-sm text-slate-600">Đã có tài khoản? <Button type="button" variant="link" className="h-auto p-0" onClick={() => navigate("/login")}>Đăng nhập</Button></div>
        </CardFooter>
      </form>
    </Card>
  </div>;
}

function RoleOption({ id, value, active, icon, title, description }: { id: string; value: Exclude<UserRole, "Admin">; active: boolean; icon: React.ReactNode; title: string; description: string }) {
  return <label htmlFor={id} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition ${active ? "border-slate-900 bg-slate-50" : "border-slate-200 hover:border-slate-300"}`}>
    <RadioGroupItem value={value} id={id} className="mt-1" />
    <span className="flex-1">
      <span className="flex items-center gap-2 font-semibold text-slate-950">{icon}{title}</span>
      <span className="mt-1 block text-sm leading-6 text-slate-600">{description}</span>
    </span>
  </label>;
}
