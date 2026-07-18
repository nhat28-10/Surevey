import { Link } from "react-router";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { ClipboardList, DollarSign, ShieldCheck, TrendingUp, WalletCards } from "lucide-react";
import { getCurrentUser } from "../services/authService";

export function Home() {
  const user = getCurrentUser();
  const primaryPath = user ? "/dashboard" : "/signup";
  const primaryLabel = user?.role === "Customer"
    ? "Mở campaign của tôi"
    : user?.role === "Collaborator"
      ? "Mở marketplace"
      : user?.role === "Admin"
        ? "Mở trang quản trị"
        : "Đăng ký tài khoản";

  return <div className="space-y-10">
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-slate-950 text-white shadow-sm">
      <div className="grid gap-8 p-6 md:p-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div className="space-y-6">
          <Badge variant="outline" className="w-fit rounded-full border-slate-700 bg-slate-900 px-3 py-1 text-slate-200">SureSurvey</Badge>
          <div className="space-y-4">
            <h1 className="max-w-3xl text-4xl font-bold leading-tight md:text-5xl">Nền tảng quản lý campaign khảo sát theo vai trò</h1>
            <p className="max-w-3xl text-lg leading-8 text-slate-300">Customer tạo và thanh toán campaign; Admin xác minh, duyệt và theo dõi doanh thu; Collaborator nhận việc, nộp kết quả, nhận thưởng và rút tiền.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-white text-slate-950 hover:bg-slate-100"><Link to={primaryPath}>{primaryLabel}</Link></Button>
            {!user && <Button asChild size="lg" variant="outline" className="border-slate-600 bg-transparent text-white hover:bg-slate-900"><Link to="/login">Đăng nhập</Link></Button>}
          </div>
        </div>
        <div className="grid gap-3">
          <HeroMetric icon={<ClipboardList className="h-5 w-5" />} label="Campaign" value="Tạo - thanh toán - duyệt" />
          <HeroMetric icon={<TrendingUp className="h-5 w-5" />} label="Tiến độ" value="Theo dõi response đã mua" />
          <HeroMetric icon={<WalletCards className="h-5 w-5" />} label="Ví thưởng" value="Reward và withdrawal" />
        </div>
      </div>
    </section>

    <section className="grid gap-5 md:grid-cols-3">
      <RoleCard icon={<ClipboardList className="h-6 w-6 text-blue-700" />} title="Customer" subtitle="Campaign và thanh toán" description="Tạo campaign Google Form hoặc form nội bộ, mở QR thanh toán và theo dõi tiến độ response đã đặt." />
      <RoleCard icon={<DollarSign className="h-6 w-6 text-green-700" />} title="Collaborator" subtitle="Participation và reward" description="Xem marketplace, nhận campaign, nộp kết quả, theo dõi trạng thái duyệt thưởng và ví cá nhân." />
      <RoleCard icon={<ShieldCheck className="h-6 w-6 text-slate-700" />} title="Admin" subtitle="Duyệt nghiệp vụ" description="Duyệt thanh toán, campaign, yêu cầu rút tiền, quản lý collaborator và xem doanh thu nền tảng." />
    </section>

    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <WalletCards className="mt-1 h-6 w-6 text-amber-600" />
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Không dùng số liệu giả</h2>
          <p className="mt-1 text-slate-600">Các dashboard sau khi đăng nhập đều lấy dữ liệu từ UserService, SurveyService và WalletService qua API Gateway. Trang chủ chỉ mô tả tính năng, không hiển thị số lượng campaign hoặc doanh thu giả.</p>
        </div>
      </div>
    </section>
  </div>;
}

function HeroMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
    <div className="flex items-center gap-2 text-sm text-slate-400">{icon}{label}</div>
    <div className="mt-2 font-semibold text-white">{value}</div>
  </div>;
}

function RoleCard({ icon, title, subtitle, description }: { icon: React.ReactNode; title: string; subtitle: string; description: string }) {
  return <Card className="border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-slate-950">{icon}{title}</CardTitle>
      <CardDescription>{subtitle}</CardDescription>
    </CardHeader>
    <CardContent className="text-sm leading-6 text-slate-600">{description}</CardContent>
  </Card>;
}
