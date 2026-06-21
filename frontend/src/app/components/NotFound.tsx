import { Link } from 'react-router';
import { Button } from './ui/button';
import { Home, Search } from 'lucide-react';

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
      <div className="space-y-2">
        <h1 className="text-6xl font-bold text-gray-900">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700">Không tìm thấy trang</h2>
        <p className="text-gray-600 max-w-md">
          Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển.
        </p>
      </div>
      
      <div className="flex gap-4">
        <Button asChild>
          <Link to="/">
            <Home className="w-4 h-4 mr-2" />
            Về trang chủ
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/helper/marketplace">
            <Search className="w-4 h-4 mr-2" />
            Tìm khảo sát
          </Link>
        </Button>
      </div>
    </div>
  );
}