import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  ClipboardList,
  Home,
  PlusCircle,
  Search,
  HelpCircle,
  LogOut,
  UserCircle,
  CheckCircle,
  ShieldCheck,
} from "lucide-react";
import {
  getCurrentUser,
  switchUserRole,
  logout,
  isAuthenticated,
} from "../services/authService";
import { useState, useEffect } from "react";

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  const [authenticated, setAuthenticated] = useState(isAuthenticated());

  const handleLogout = () => {
    logout();
    setCurrentUser(null);
    setAuthenticated(false);
    navigate("/");
    window.dispatchEvent(new Event("storage"));
  };

  useEffect(() => {
    const handleStorageChange = () => {
      setCurrentUser(getCurrentUser());
      setAuthenticated(isAuthenticated());
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2">
              <ClipboardList className="w-8 h-8 text-green-600" />
              <span className="text-2xl font-bold text-green-600">SureVey</span>
            </Link>

            <nav className="hidden md:flex items-start gap-2">
              <Link
                to="/"
                className={`flex items-center px-2 py-1 rounded-md transition-colors ${
                  isActive("/")
                    ? "bg-green-600 text-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Home className="w-4 h-4" />
                Trang chủ
              </Link>

              {authenticated && currentUser?.role === "owner" ? (
                <>
                  <Link
                    to="/owner/dashboard"
                    className={`flex items-center gap-2 px-2 py-1 rounded-md transition-colors ${
                      isActive("/owner/dashboard")
                        ? "bg-green-600 text-white"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <ClipboardList className="w-4 h-4" />
                    Khảo sát của tôi
                  </Link>
                  <Link
                    to="/owner/post"
                    className={`flex items-center gap-2 px-2 py-1 rounded-md transition-colors ${
                      isActive("/owner/post")
                        ? "bg-green-600 text-white"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <PlusCircle className="w-4 h-4" />
                    Đăng khảo sát
                  </Link>
                </>
              ) : authenticated && currentUser?.role === "helper" ? (
                <>
                  <Link
                    to="/helper/marketplace"
                    className={`flex items-center gap-2 px-2 py-1 rounded-md transition-colors ${
                      isActive("/helper/marketplace")
                        ? "bg-green-600 text-white"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <Search className="w-4 h-4" />
                    Tìm khảo sát
                  </Link>
                  <Link
                    to="/helper/finished"
                    className={`flex items-center gap-2 px-2 py-1 rounded-md transition-colors ${
                      isActive("/helper/finished")
                        ? "bg-green-600 text-white"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Đã hoàn thành
                  </Link>
                </>
              ) : authenticated && currentUser?.role === "admin" ? (
                <Link
                  to="/admin/requests"
                  className={`flex items-center gap-2 px-2 py-1 rounded-md transition-colors ${
                    isActive("/admin/requests")
                      ? "bg-green-600 text-white"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  Yêu cầu rút tiền
                </Link>
              ) : null}

              {currentUser?.role !== "admin" && (
                <Link
                  to="/support/faq"
                  className={`flex items-center px-2 py-1 rounded-md transition-colors ${
                    isActive("/support/faq") || isActive("/support/tickets")
                      ? "bg-green-600 text-white"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <HelpCircle className="w-4 h-4" />
                  Trợ giúp
                </Link>
              )}
            </nav>

            <div className="flex items-center gap-3 ml-auto">
              {authenticated && currentUser ? (
                <>
                  <div className="hidden lg:flex items-center gap-3 text-lg text-gray-600">
                    <UserCircle className="w-7 h-7" />
                    <span>{currentUser.name}</span>
                    <Badge
                      className={`text-sm font-medium ${
                        currentUser.role === "admin"
                          ? "bg-blue-100 text-blue-800"
                          : currentUser.role === "owner"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-green-100 text-green-800"
                      }`}
                    >
                      {currentUser.role === "admin"
                        ? "Quản trị viên"
                        : currentUser.role === "owner"
                          ? "Chủ khảo sát"
                          : "Người làm khảo sát"}
                    </Badge>
                  </div>

                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleLogout}
                    className="hidden sm:flex gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Đăng xuất
                  </Button>
                </>
              ) : (
                <div className="hidden sm:flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate("/login")}
                  >
                    Đăng nhập
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => navigate("/signup")}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Đăng ký
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Navigation */}
          <nav className="md:hidden flex items-center gap-4 mt-4 overflow-x-auto pb-2">
            <Link
              to="/"
              className={`flex items-center gap-1 text-sm whitespace-nowrap px-3 py-1.5 rounded-full transition-colors ${
                isActive("/") ? "bg-green-600 text-white" : "text-gray-600"
              }`}
            >
              <Home className="w-4 h-4" />
              Trang chủ
            </Link>

            {authenticated && currentUser?.role === "owner" ? (
              <>
                <Link
                  to="/owner/dashboard"
                  className={`flex items-center gap-1 text-sm whitespace-nowrap px-3 py-1.5 rounded-full transition-colors ${
                    isActive("/owner/dashboard")
                      ? "bg-green-600 text-white"
                      : "text-gray-600"
                  }`}
                >
                  <ClipboardList className="w-4 h-4" />
                  Khảo sát
                </Link>
                <Link
                  to="/owner/post"
                  className={`flex items-center gap-1 text-sm whitespace-nowrap px-3 py-1.5 rounded-full transition-colors ${
                    isActive("/owner/post")
                      ? "bg-green-600 text-white"
                      : "text-gray-600"
                  }`}
                >
                  <PlusCircle className="w-4 h-4" />
                  Đăng
                </Link>
              </>
            ) : authenticated && currentUser?.role === "helper" ? (
              <>
                <Link
                  to="/helper/marketplace"
                  className={`flex items-center gap-1 text-sm whitespace-nowrap px-3 py-1.5 rounded-full transition-colors ${
                    isActive("/helper/marketplace")
                      ? "bg-green-600 text-white"
                      : "text-gray-600"
                  }`}
                >
                  <Search className="w-4 h-4" />
                  Tìm kiếm
                </Link>
                <Link
                  to="/helper/finished"
                  className={`flex items-center gap-1 text-sm whitespace-nowrap px-3 py-1.5 rounded-full transition-colors ${
                    isActive("/helper/finished")
                      ? "bg-green-600 text-white"
                      : "text-gray-600"
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  Đã làm
                </Link>
              </>
            ) : authenticated && currentUser?.role === "admin" ? (
              <Link
                to="/admin/requests"
                className={`flex items-center gap-1 text-sm whitespace-nowrap px-3 py-1.5 rounded-full transition-colors ${
                  isActive("/admin/requests")
                    ? "bg-blue-600 text-white"
                    : "text-gray-600"
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                Yêu cầu
              </Link>
            ) : null}

            {currentUser?.role !== "admin" && (
              <Link
                to="/support/faq"
                className={`flex items-center gap-1 text-sm whitespace-nowrap px-3 py-1.5 rounded-full transition-colors ${
                  isActive("/support/faq") || isActive("/support/tickets")
                    ? "bg-green-600 text-white"
                    : "text-gray-600"
                }`}
              >
                <HelpCircle className="w-4 h-4" />
                Trợ giúp
              </Link>
            )}

            {!authenticated && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate("/login")}
                  className="whitespace-nowrap"
                >
                  Đăng nhập
                </Button>
                <Button
                  size="sm"
                  onClick={() => navigate("/signup")}
                  className="whitespace-nowrap"
                >
                  Đăng ký
                </Button>
              </>
            )}
          </nav>

          {/* Mobile Role Switcher and Logout */}
          {authenticated && currentUser && (
            <div className="sm:hidden mt-3">
              <div className="flex gap-2 mb-2">
                <Button
                  size="sm"
                  className="flex-1"
                  variant={currentUser.role === "owner" ? "default" : "outline"}
                  onClick={() => handleRoleSwitch("owner")}
                >
                  Chủ khảo sát
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  variant={
                    currentUser.role === "helper" ? "default" : "outline"
                  }
                  onClick={() => handleRoleSwitch("helper")}
                >
                  Người làm
                </Button>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-600 bg-gray-50 rounded p-2">
                <div className="flex items-center gap-1">
                  <UserCircle className="w-3 h-3" />
                  <span>{currentUser.name}</span>
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleLogout}
                  className="h-auto py-1 px-2 text-xs"
                >
                  <LogOut className="w-3 h-3 mr-1" />
                  Đăng xuất
                </Button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-gray-600 text-sm">
              © 2026 SureVey - Kết nối Chủ khảo sát với Người làm khảo sát
            </p>
            <div className="flex items-center gap-4 text-sm">
              <Link
                to="/support/faq"
                className="text-gray-600 hover:text-blue-600 transition-colors"
              >
                Trợ giúp
              </Link>
              <span className="text-gray-300">|</span>
              <Link
                to="/support/tickets"
                className="text-gray-600 hover:text-blue-600 transition-colors"
              >
                Trạng thái đơn báo cáo
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
