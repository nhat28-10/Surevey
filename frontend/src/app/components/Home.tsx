import { Link } from "react-router";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { ClipboardList, DollarSign, Clock, TrendingUp } from "lucide-react";
import { getCurrentUser, isAuthenticated } from "../services/authService";

export function Home() {
  const currentUser = getCurrentUser();
  const authenticated = isAuthenticated();

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center space-y-6 py-12">
        <h1 className="text-5xl font-bold text-gray-900 max-w-3xl mx-auto">
          Chào mừng đến với SureVey
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Nền tảng kết nối chủ khảo sát với người làm khảo sát. Đăng khảo sát
          của bạn hoặc kiếm tiền bằng cách hoàn thành chúng.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          {authenticated ? (
            currentUser?.role === "customer" ? (
              <>
                <Button asChild size="lg" className="bg-green-600">
                  <Link to="/customer/post">Đăng khảo sát</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/customer/dashboard">Xem khảo sát của tôi</Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild size="lg" className="bg-green-600">
                  <Link to="/collaborator/marketplace">Tìm khảo sát</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/customer/post">Trở thành chủ khảo sát</Link>
                </Button>
              </>
            )
          ) : (
            <>
              <Button
                asChild
                size="lg"
                className="bg-green-600 hover:bg-green-700"
              >
                <Link to="/signup">Đăng ký ngay</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/login">Đăng nhập</Link>
              </Button>
            </>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-8">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <ClipboardList className="w-12 h-12 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">1,000+</div>
          <div className="text-gray-600">Khảo sát đang hoạt động</div>
        </div>

        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <Clock className="w-12 h-12 text-purple-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">3-10 phút</div>
          <div className="text-gray-600">Thời gian làm khảo sát</div>
        </div>

        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <TrendingUp className="w-12 h-12 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">1-2k đ</div>
          <div className="text-gray-600">Phần thưởng mỗi lượt</div>
        </div>
      </section>

      {/* Features Section */}
      <section className="grid md:grid-cols-2 gap-8">
        <Card className="border-2 hover:border-blue-500 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-blue-600" />
              Dành cho Chủ khảo sát
            </CardTitle>
            <CardDescription>
              Nhận phản hồi chất lượng cho khảo sát của bạn một cách nhanh chóng
              và hiệu quả
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>
                  Đăng liên kết khảo sát từ bất kỳ nền tảng nào (Google Forms,
                  Typeform, v.v.)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Tự đặt mức thưởng và thời hạn của riêng bạn</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Theo dõi tiến độ hoàn thành theo thời gian thực</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Hủy khảo sát trước khi chúng được bắt đầu</span>
              </li>
            </ul>
            {authenticated && currentUser?.role !== "collaborator" && (
              <Button asChild className="w-full mt-4 bg-blue-600">
                <Link to="/customer/post">Bắt đầu đăng khảo sát</Link>
              </Button>
            )}
            {!authenticated && (
              <Button
                asChild
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
              >
                <Link to="/signup">Đăng ký làm chủ khảo sát</Link>
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-green-500 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-green-600" />
              Dành cho Người làm khảo sát
            </CardTitle>
            <CardDescription>
              Kiếm tiền bằng cách hoàn thành khảo sát trong thời gian rảnh
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">•</span>
                <span>Duyệt hàng trăm khảo sát có sẵn</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">•</span>
                <span>Lọc theo mức thưởng và thời gian ước tính</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">•</span>
                <span>Làm việc theo lịch trình của riêng bạn</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">•</span>
                <span>Được trả tiền cho ý kiến quý giá của bạn</span>
              </li>
            </ul>
            {authenticated && currentUser?.role !== "customer" && (
              <Button asChild className="w-full mt-4 bg-green-600">
                <Link to="/collaborator/marketplace">Tìm khảo sát</Link>
              </Button>
            )}
            {!authenticated && (
              <Button
                asChild
                className="w-full mt-4 bg-green-600 hover:bg-green-700"
              >
                <Link to="/signup">Đăng ký làm người làm khảo sát</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </section>

      {/* How It Works */}
      <section className="bg-white rounded-lg p-8 border">
        <h2 className="text-3xl font-bold text-center mb-8">Cách hoạt động</h2>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-blue-600">
              Với tư cách Chủ khảo sát
            </h3>
            <ol className="space-y-3">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm">
                  1
                </span>
                <span>Tạo và đăng khảo sát của bạn với đầy đủ thông tin</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm">
                  2
                </span>
                <span>Đặt mức thưởng và thời hạn</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm">
                  3
                </span>
                <span>Người làm khảo sát hoàn thành khảo sát của bạn</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm">
                  4
                </span>
                <span>Theo dõi tiến độ và nhận kết quả</span>
              </li>
            </ol>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold text-green-600">
              Với tư cách Người làm khảo sát
            </h3>
            <ol className="space-y-3">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-sm">
                  1
                </span>
                <span>Duyệt khảo sát có sẵn</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-sm">
                  2
                </span>
                <span>Lọc theo thời gian và phần thưởng</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-sm">
                  3
                </span>
                <span>Chấp nhận và hoàn thành khảo sát</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-sm">
                  4
                </span>
                <span>Nhận phần thưởng cho thời gian của bạn</span>
              </li>
            </ol>
          </div>
        </div>
      </section>
    </div>
  );
}
