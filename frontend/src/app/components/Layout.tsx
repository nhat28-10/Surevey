import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { CheckCircle, ClipboardList, HelpCircle, Home, LogOut, PlusCircle, Search, ShieldCheck, UserCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { getCurrentUser, logout } from "../services/authService";
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

  const navClass = (path: string) => `flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
    (path === "/" ? location.pathname === "/" : location.pathname.startsWith(path))
      ? "bg-green-600 text-white"
      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
  }`;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 border-b bg-white shadow-sm">
        <div className="container mx-auto flex items-center gap-3 px-4 py-3 sm:gap-5">
          <Link to={brandPath} className="flex shrink-0 items-center gap-2">
            <ClipboardList className="h-8 w-8 text-green-600" />
            <span className="text-xl font-bold text-green-600 sm:text-2xl">SureVey</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {currentUser?.role !== "Admin" && <Link to="/" className={navClass("/")}><Home className="h-4 w-4" />Trang chủ</Link>}
            {currentUser?.role === "Customer" && <>
              <Link to="/customer/dashboard" className={navClass("/customer/dashboard")}><ClipboardList className="h-4 w-4" />Campaign của tôi</Link>
              <Link to="/customer/post" className={navClass("/customer/post")}><PlusCircle className="h-4 w-4" />Tạo campaign</Link>
            </>}
            {currentUser?.role === "Collaborator" && <>
              <Link to="/collaborator/marketplace" className={navClass("/collaborator/marketplace")}><Search className="h-4 w-4" />Marketplace</Link>
              <Link to="/collaborator/activities" className={navClass("/collaborator/activities")}><CheckCircle className="h-4 w-4" />Công việc & ví</Link>
            </>}
            {currentUser?.role === "Admin" &&
              <Link to="/admin" className={navClass("/admin")}><ShieldCheck className="h-4 w-4" />Quản trị</Link>}
            {currentUser && currentUser.role !== "Admin" &&
              <Link to="/support/faq" className={navClass("/support")}><HelpCircle className="h-4 w-4" />Hỗ trợ</Link>}
            {currentUser &&
              <Link to="/profile" className={navClass("/profile")}><UserCircle className="h-4 w-4" />Hồ sơ</Link>}
          </nav>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            {currentUser ? <>
              <NotificationBell user={currentUser} />
              <Link to="/profile" className="hidden items-center gap-2 text-sm text-gray-600 hover:text-gray-900 lg:flex">
                <UserCircle className="h-5 w-5" />
                <span>{currentUser.name}</span>
                <Badge variant="outline">{currentUser.role}</Badge>
              </Link>
              <Button size="sm" variant="destructive" onClick={handleLogout}>
                <LogOut className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Đăng xuất</span>
              </Button>
            </> : <>
              <Button size="sm" variant="outline" onClick={() => navigate("/login")}>Đăng nhập</Button>
              <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => navigate("/signup")}>Đăng ký</Button>
            </>}
          </div>
        </div>

        {currentUser && <nav className="container mx-auto flex gap-2 overflow-x-auto px-4 pb-3 md:hidden">
          {currentUser.role === "Customer" && <>
            <Link to="/customer/dashboard" className={navClass("/customer/dashboard")}>Campaign</Link>
            <Link to="/customer/post" className={navClass("/customer/post")}>Tạo mới</Link>
          </>}
          {currentUser.role === "Collaborator" && <>
            <Link to="/collaborator/marketplace" className={navClass("/collaborator/marketplace")}>Marketplace</Link>
            <Link to="/collaborator/activities" className={navClass("/collaborator/activities")}>Công việc & ví</Link>
          </>}
          {currentUser.role === "Admin" && <Link to="/admin" className={navClass("/admin")}>Quản trị</Link>}
          <Link to="/profile" className={navClass("/profile")}>Hồ sơ</Link>
        </nav>}
      </header>

      <main className="container mx-auto px-4 py-8"><Outlet /></main>
      <footer className="mt-16 border-t bg-white">
        <div className="container mx-auto px-4 py-8 text-sm text-gray-600">© 2026 SureVey</div>
      </footer>
    </div>
  );
}
