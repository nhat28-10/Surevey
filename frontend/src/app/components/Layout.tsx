import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Bell, ClipboardList, Home, PlusCircle, Search, HelpCircle, LogOut, UserCircle, CheckCircle, ShieldCheck } from "lucide-react";
import { getCurrentUser, logout } from "../services/authService";
import { useEffect, useState } from "react";
import { NotificationBell } from "./NotificationBell";

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(getCurrentUser());

  useEffect(() => {
    const refresh = () => setCurrentUser(getCurrentUser());
    window.addEventListener("auth-changed", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("auth-changed", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const brandPath = currentUser?.role === "Admin" ? "/dashboard" : "/";

  const navClass = (path: string) => `flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
    (path === "/" ? location.pathname === "/" : location.pathname.startsWith(path))
      ? "bg-green-600 text-white"
      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
  }`;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center gap-5">
          <Link to={brandPath} className="flex items-center gap-2 shrink-0">
            <ClipboardList className="w-8 h-8 text-green-600" />
            <span className="text-2xl font-bold text-green-600">SureVey</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {currentUser?.role !== "Admin" && <Link to="/" className={navClass("/")}><Home className="w-4 h-4" />Trang chủ</Link>}
            {currentUser?.role === "Customer" && <>
              <Link to="/customer/dashboard" className={navClass("/customer/dashboard")}><ClipboardList className="w-4 h-4" />Campaign của tôi</Link>
              <Link to="/customer/post" className={navClass("/customer/post")}><PlusCircle className="w-4 h-4" />Tạo campaign</Link>
            </>}
            {currentUser?.role === "Collaborator" && <>
              <Link to="/collaborator/marketplace" className={navClass("/collaborator/marketplace")}><Search className="w-4 h-4" />Marketplace</Link>
              <Link to="/collaborator/activities" className={navClass("/collaborator/activities")}><CheckCircle className="w-4 h-4" />Công việc & ví</Link>
            </>}
            {currentUser?.role === "Admin" &&
              <Link to="/admin" className={navClass("/admin")}><ShieldCheck className="w-4 h-4" />Quản trị</Link>}
            {currentUser && currentUser.role !== "Admin" &&
              <Link to="/support/faq" className={navClass("/support")}><HelpCircle className="w-4 h-4" />Hỗ trợ</Link>}
            {currentUser &&
              <Link to="/profile" className={navClass("/profile")}><UserCircle className="w-4 h-4" />Hồ sơ</Link>}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            {currentUser ? <>
              <NotificationBell user={currentUser} />
              <Link to="/profile" className="hidden lg:flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
                <UserCircle className="w-5 h-5" /><span>{currentUser.name}</span>
                <Badge variant="outline">{currentUser.role}</Badge>
              </Link>
              <Button size="sm" variant="destructive" onClick={handleLogout}><LogOut className="w-4 h-4 mr-1" />Đăng xuất</Button>
            </> : <>
              <Button size="sm" variant="outline" onClick={() => navigate("/login")}>Đăng nhập</Button>
              <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => navigate("/signup")}>Đăng ký</Button>
            </>}
          </div>
        </div>

        {currentUser && <nav className="md:hidden container mx-auto px-4 pb-3 flex gap-2 overflow-x-auto">
          {currentUser.role === "Customer" && <><Link to="/customer/dashboard" className={navClass("/customer/dashboard")}>Campaign</Link><Link to="/customer/post" className={navClass("/customer/post")}>Tạo mới</Link></>}
          {currentUser.role === "Collaborator" && <><Link to="/collaborator/marketplace" className={navClass("/collaborator/marketplace")}>Marketplace</Link><Link to="/collaborator/activities" className={navClass("/collaborator/activities")}>Công việc & ví</Link></>}
          {currentUser.role === "Admin" && <Link to="/admin" className={navClass("/admin")}>Quản trị</Link>}
          <Link to="/notifications" className={navClass("/notifications")}><Bell className="w-4 h-4" />Thông báo</Link>
          <Link to="/profile" className={navClass("/profile")}>Hồ sơ</Link>
        </nav>}
      </header>

      <main className="container mx-auto px-4 py-8"><Outlet /></main>
      <footer className="bg-white border-t mt-16"><div className="container mx-auto px-4 py-8 text-sm text-gray-600">© 2026 SureVey</div></footer>
    </div>
  );
}
