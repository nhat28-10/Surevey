import { Link } from "react-router";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { ClipboardList, DollarSign, ShieldCheck, WalletCards } from "lucide-react";
import { getCurrentUser } from "../services/authService";

export function Home() {
  const user = getCurrentUser();
  const primaryPath = user?.role === "Customer"
    ? "/customer/dashboard"
    : user?.role === "Collaborator"
      ? "/collaborator/marketplace"
      : user?.role === "Admin"
        ? "/admin"
        : "/signup";
  const primaryLabel = user?.role === "Customer"
    ? "Mở campaign của tôi"
    : user?.role === "Collaborator"
      ? "Mở marketplace"
      : user?.role === "Admin"
        ? "Mở trang quản trị"
        : "Đăng ký tài khoản";

  return <div className="space-y-12">
    <section className="text-center space-y-6 py-12">
      <h1 className="text-5xl font-bold text-gray-900 max-w-3xl mx-auto">SureVey kết nối trực tiếp với backend hiện tại</h1>
      <p className="text-xl text-gray-600 max-w-3xl mx-auto">Customer tạo và thanh toán campaign; Admin xác minh và duyệt; Collaborator nhận việc, nộp kết quả, nhận thưởng và rút tiền.</p>
      <div className="flex gap-3 justify-center"><Button asChild size="lg" className="bg-green-600 hover:bg-green-700"><Link to={primaryPath}>{primaryLabel}</Link></Button>{!user&&<Button asChild size="lg" variant="outline"><Link to="/login">Đăng nhập</Link></Button>}</div>
    </section>

    <section className="grid md:grid-cols-3 gap-6">
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><ClipboardList className="w-6 h-6 text-blue-600"/>Customer</CardTitle><CardDescription>Campaign và thanh toán</CardDescription></CardHeader><CardContent className="text-sm text-gray-600">Tạo campaign Google Form, tạo yêu cầu thanh toán, gửi chứng từ, gửi campaign chờ Admin duyệt và kiểm tra submission thật.</CardContent></Card>
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="w-6 h-6 text-green-600"/>Collaborator</CardTitle><CardDescription>Participation và reward</CardDescription></CardHeader><CardContent className="text-sm text-gray-600">Xem campaign ACTIVE, nhận campaign, nộp confirmation code, theo dõi trạng thái, xem ví và gửi yêu cầu rút tiền.</CardContent></Card>
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="w-6 h-6 text-purple-600"/>Admin</CardTitle><CardDescription>Duyệt nghiệp vụ</CardDescription></CardHeader><CardContent className="text-sm text-gray-600">Xác minh thanh toán, duyệt campaign, xử lý withdrawal, xem người dùng và top-up ví bằng API backend.</CardContent></Card>
    </section>

    <section className="rounded-xl border bg-white p-6"><div className="flex items-start gap-3"><WalletCards className="w-6 h-6 text-amber-600 mt-1"/><div><h2 className="font-semibold text-lg">Không dùng số liệu giả</h2><p className="text-gray-600 mt-1">Các dashboard sau khi đăng nhập đều lấy dữ liệu từ UserService, SurveyService và WalletService qua API Gateway. Trang chủ chỉ mô tả tính năng, không hiển thị số lượng campaign hoặc doanh thu giả.</p></div></div></section>
  </div>;
}
