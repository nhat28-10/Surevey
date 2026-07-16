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

  return <div className="min-h-[80vh] flex items-center justify-center py-8">
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <div className="flex justify-center mb-4"><ClipboardList className="w-12 h-12 text-green-600" /></div>
        <CardTitle className="text-2xl text-center">Đăng ký tài khoản</CardTitle>
        <CardDescription className="text-center">Chọn đúng vai trò để hệ thống đưa bạn vào luồng phù hợp.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          <div className="space-y-2"><Label htmlFor="userName">Tên đăng nhập *</Label><Input id="userName" value={formData.userName} onChange={e => setFormData(prev => ({ ...prev, userName: e.target.value }))} required maxLength={50} /></div>
          <div className="space-y-2"><Label htmlFor="name">Họ và tên *</Label><Input id="name" value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} required /></div>
          <div className="space-y-2"><Label htmlFor="email">Email *</Label><Input id="email" type="email" value={formData.email} onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))} required maxLength={100} /></div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label htmlFor="password">Mật khẩu *</Label><Input id="password" type="password" value={formData.password} onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))} required minLength={6} /></div>
            <div className="space-y-2"><Label htmlFor="confirmPassword">Xác nhận *</Label><Input id="confirmPassword" type="password" value={formData.confirmPassword} onChange={e => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))} required minLength={6} /></div>
          </div>
          <div className="space-y-3">
            <Label>Vai trò đăng ký</Label>
            <RadioGroup value={formData.role} onValueChange={value => setFormData(prev => ({ ...prev, role: value as Exclude<UserRole, "Admin"> }))}>
              <div className="flex items-start gap-3 border rounded-lg p-4">
                <RadioGroupItem value="Collaborator" id="collaborator" className="mt-1" />
                <Label htmlFor="collaborator" className="flex-1 cursor-pointer">
                  <span className="flex items-center gap-2 font-medium"><Search className="w-5 h-5 text-blue-600" />Guest / Người làm khảo sát</span>
                  <span className="block text-sm text-gray-600 mt-1">Chọn mục này nếu bạn muốn đăng ký để nhận campaign, làm khảo sát và nhận thưởng.</span>
                </Label>
              </div>
              <div className="flex items-start gap-3 border rounded-lg p-4">
                <RadioGroupItem value="Customer" id="customer" className="mt-1" />
                <Label htmlFor="customer" className="flex-1 cursor-pointer">
                  <span className="flex items-center gap-2 font-medium"><Users className="w-5 h-5 text-green-600" />Customer / Người tạo campaign</span>
                  <span className="block text-sm text-gray-600 mt-1">Chọn mục này nếu bạn muốn đăng campaign khảo sát và thanh toán ngân sách thưởng.</span>
                </Label>
              </div>
            </RadioGroup>
          </div>
          <Button type="button" variant="outline" className="w-full" disabled title="Backend Google callback hiện trả JSON, chưa có callback về frontend">Google OAuth chưa nối callback về SPA</Button>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 mt-5">
          <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isLoading}>{isLoading ? "Đang đăng ký..." : "Đăng ký"}</Button>
          <div className="text-sm text-center text-gray-600">Đã có tài khoản? <Button type="button" variant="link" className="p-0 h-auto" onClick={() => navigate("/login")}>Đăng nhập</Button></div>
        </CardFooter>
      </form>
    </Card>
  </div>;
}
