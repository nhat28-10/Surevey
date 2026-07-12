import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { getCurrentUser, updateProfile, refreshProfile } from "../services/authService";
import { UserCircle, Save, Loader2 } from "lucide-react";
import type { User } from "../types/auth";

const ROLE_LABELS: Record<string, string> = {
  customer: "Chủ khảo sát",
  collaborator: "Người làm khảo sát",
  admin: "Quản trị viên",
};

const ROLE_COLORS: Record<string, string> = {
  customer: "bg-purple-100 text-purple-800",
  collaborator: "bg-green-100 text-green-800",
  admin: "bg-blue-100 text-blue-800",
};

export function UserProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(getCurrentUser());
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    userName: "",
    phoneNumber: "",
    identityCard: "",
    sex: "",
    dateOfBirth: "",
    address: "",
  });

  useEffect(() => {
    if (!getCurrentUser()) {
      navigate("/login");
      return;
    }

    const load = async () => {
      setIsFetching(true);
      const refreshed = await refreshProfile();
      if (refreshed) {
        setUser(refreshed);
        setForm({
          fullName: refreshed.fullName ?? "",
          userName: refreshed.userName ?? "",
          phoneNumber: refreshed.phoneNumber ?? "",
          identityCard: refreshed.identityCard ?? "",
          sex: refreshed.sex ?? "",
          dateOfBirth: refreshed.dateOfBirth ? refreshed.dateOfBirth.slice(0, 10) : "",
          address: refreshed.address ?? "",
        });
      }
      setIsFetching(false);
    };

    load();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const result = await updateProfile({
      fullName: form.fullName || undefined,
      userName: form.userName || undefined,
      phoneNumber: form.phoneNumber || undefined,
      identityCard: form.identityCard || undefined,
      sex: form.sex || undefined,
      dateOfBirth: form.dateOfBirth || undefined,
      address: form.address || undefined,
    });

    setIsLoading(false);

    if (!result.success) {
      setError(result.error ?? "Cập nhật thất bại");
      return;
    }

    if (result.user) setUser(result.user);
    toast.success("Cập nhật thông tin thành công");
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!user) return null;

  const initials = (user.fullName || user.name || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src={user.avatarUrl} alt={user.name} />
              <AvatarFallback className="text-xl bg-green-100 text-green-700">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold">{user.fullName || user.name}</h2>
              <p className="text-gray-500 text-sm">{user.email}</p>
              <Badge className={`mt-1 text-xs ${ROLE_COLORS[user.role]}`}>
                {ROLE_LABELS[user.role]}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCircle className="w-5 h-5" />
            Thông tin cá nhân
          </CardTitle>
          <CardDescription>Cập nhật thông tin hồ sơ của bạn</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Họ và tên</Label>
                <Input
                  id="fullName"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  placeholder="Nguyễn Văn A"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="userName">Tên đăng nhập</Label>
                <Input
                  id="userName"
                  value={form.userName}
                  onChange={(e) => setForm({ ...form, userName: e.target.value })}
                  placeholder="nguyenvana"
                />
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Số điện thoại</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={form.phoneNumber}
                  onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                  placeholder="0901234567"
                  maxLength={15}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="identityCard">CCCD / CMND</Label>
                <Input
                  id="identityCard"
                  value={form.identityCard}
                  onChange={(e) => setForm({ ...form, identityCard: e.target.value })}
                  placeholder="012345678901"
                  maxLength={12}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sex">Giới tính</Label>
                <select
                  id="sex"
                  value={form.sex}
                  onChange={(e) => setForm({ ...form, sex: e.target.value })}
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">-- Chọn --</option>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Ngày sinh</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Địa chỉ</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="123 Đường ABC, Quận 1, TP.HCM"
                maxLength={200}
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                className="bg-green-600 hover:bg-green-700 gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isLoading ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
