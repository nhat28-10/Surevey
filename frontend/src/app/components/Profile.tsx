import { useEffect, useState } from "react";
import { toast } from "sonner";
import { authApi } from "../../api/authApi";
import { ApiError } from "../../api/httpClient";
import type { UserProfile } from "../../api/types";
import { getCurrentUser } from "../services/authService";
import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ProfileSkeleton } from "./LoadingStates";

interface ProfileForm {
  userId: number;
  userName: string;
  email: string;
  fullName: string;
  identityCard: string;
  sex: string;
  phoneNumber: string;
  dateOfBirth: string;
  address: string;
  roleName: string;
}

function toDateInput(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime()) || date.getUTCFullYear() <= 1901) return "";
  return date.toISOString().slice(0, 10);
}

function toForm(profile: UserProfile): ProfileForm {
  return {
    userId: profile.userId,
    userName: profile.userName || "",
    email: profile.email || "",
    fullName: profile.fullName || "",
    identityCard: profile.identityCard || "",
    sex: profile.sex || "",
    phoneNumber: profile.phoneNumber || "",
    dateOfBirth: toDateInput(profile.dateOfBirth),
    address: profile.address || "",
    roleName: profile.roleName || getCurrentUser()?.role || "",
  };
}

function toPayload(form: ProfileForm): UserProfile {
  return {
    userId: form.userId,
    userName: form.userName.trim(),
    email: form.email.trim(),
    fullName: form.fullName.trim() || null,
    identityCard: form.identityCard.trim() || null,
    sex: form.sex.trim() || null,
    phoneNumber: form.phoneNumber.trim() || null,
    dateOfBirth: form.dateOfBirth ? `${form.dateOfBirth}T00:00:00.000Z` : null,
    address: form.address.trim() || null,
    roleName: form.roleName || null,
  };
}

function errorMessage(error: unknown) {
  return error instanceof ApiError || error instanceof Error ? error.message : "Không thể tải hồ sơ";
}

export function Profile() {
  const [form, setForm] = useState<ProfileForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError("");
      try {
        setForm(toForm(await authApi.profile()));
      } catch (err) {
        setError(errorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const setField = (name: keyof ProfileForm, value: string) => {
    setForm(prev => prev ? { ...prev, [name]: value } : prev);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form) return;
    setSaving(true);
    setError("");
    try {
      await authApi.updateProfile(toPayload(form));
      toast.success("Đã cập nhật hồ sơ");
      setForm(toForm(await authApi.profile()));
      window.dispatchEvent(new Event("auth-changed"));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <ProfileSkeleton />;
  if (!form) return <Alert variant="destructive"><AlertDescription>{error || "Không tìm thấy hồ sơ"}</AlertDescription></Alert>;

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Hồ sơ cá nhân</CardTitle>
          <CardDescription>Dữ liệu được tải và cập nhật qua UserService.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-5">
            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="userName">Tên đăng nhập</Label>
                <Input id="userName" value={form.userName} readOnly />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={form.email} readOnly />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName">Họ và tên</Label>
                <Input id="fullName" value={form.fullName} onChange={event => setField("fullName", event.target.value)} maxLength={200} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Vai trò</Label>
                <Input id="role" value={form.roleName} readOnly />
              </div>
              <div className="space-y-2">
                <Label htmlFor="identityCard">CCCD/CMND</Label>
                <Input id="identityCard" value={form.identityCard} onChange={event => setField("identityCard", event.target.value)} maxLength={12} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sex">Giới tính</Label>
                <Input id="sex" value={form.sex} onChange={event => setField("sex", event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Số điện thoại</Label>
                <Input id="phone" value={form.phoneNumber} onChange={event => setField("phoneNumber", event.target.value)} maxLength={15} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Ngày sinh</Label>
                <Input id="dateOfBirth" type="date" value={form.dateOfBirth} onChange={event => setField("dateOfBirth", event.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Địa chỉ</Label>
              <Input id="address" value={form.address} onChange={event => setField("address", event.target.value)} maxLength={200} />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={saving} className="bg-green-600 hover:bg-green-700">
                {saving ? "Đang lưu..." : "Lưu hồ sơ"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
