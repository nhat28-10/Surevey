import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent } from "./ui/dialog";
import {
  CheckCircle,
  Clock,
  DollarSign,
  User,
  Mail,
  Calendar,
  ShieldCheck,
  Inbox,
  ZoomIn,
} from "lucide-react";
import {
  getAllWithdrawRequests,
  completeWithdrawRequest,
  type WithdrawRequest,
} from "../services/withdrawService";
import { getCurrentUser, isAuthenticated } from "../services/authService";

export function AdminProcessRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<WithdrawRequest[]>([]);
  const [previewImg, setPreviewImg] = useState<{ src: string; name: string } | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (!isAuthenticated() || user?.role !== "admin") {
      navigate("/login");
      return;
    }
    loadRequests();

    const handleStorage = () => loadRequests();
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [navigate]);

  const loadRequests = () => {
    const all = getAllWithdrawRequests();
    // newest first
    setRequests([...all].sort(
      (a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
    ));
  };

  const handleFinish = (id: string) => {
    completeWithdrawRequest(id);
    window.dispatchEvent(new Event("storage"));
  };

  const pending = requests.filter(r => r.status === "pending").length;
  const completed = requests.filter(r => r.status === "completed").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-blue-600" />
            Xử lý yêu cầu rút tiền
          </h1>
          <p className="text-gray-600 mt-1">
            Quản lý và xét duyệt các yêu cầu rút tiền của người dùng
          </p>
        </div>

        {/* Stats */}
        <div className="flex gap-3">
          <div className="text-center px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-xl">
            <p className="text-2xl font-bold text-yellow-700">{pending}</p>
            <p className="text-xs text-yellow-600">Chờ xử lý</p>
          </div>
          <div className="text-center px-4 py-2 bg-green-50 border border-green-200 rounded-xl">
            <p className="text-2xl font-bold text-green-700">{completed}</p>
            <p className="text-xs text-green-600">Đã hoàn thành</p>
          </div>
        </div>
      </div>

      {/* Requests List */}
      {requests.length === 0 ? (
        <Card className="p-16">
          <div className="text-center space-y-4">
            <Inbox className="w-16 h-16 text-gray-300 mx-auto" />
            <h3 className="text-xl font-semibold text-gray-500">
              Chưa có yêu cầu nào
            </h3>
            <p className="text-gray-400 text-sm">
              Các yêu cầu rút tiền từ người dùng sẽ hiển thị ở đây.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <Card
              key={req.id}
              className={`transition-shadow hover:shadow-md ${
                req.status === "completed"
                  ? "opacity-70 bg-gray-50"
                  : "border-yellow-200 bg-white"
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{req.helperName}</CardTitle>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                        <Mail className="w-3 h-3" />
                        {req.helperEmail}
                      </div>
                    </div>
                  </div>
                  <Badge
                    className={
                      req.status === "completed"
                        ? "bg-green-100 text-green-700 border border-green-200"
                        : "bg-yellow-100 text-yellow-700 border border-yellow-200"
                    }
                  >
                    {req.status === "completed" ? (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Đã hoàn thành
                      </>
                    ) : (
                      <>
                        <Clock className="w-3 h-3 mr-1" />
                        Chờ xử lý
                      </>
                    )}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {/* Amount */}
                  <div className="flex items-start gap-2">
                    <DollarSign className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Số tiền</p>
                      <p className="font-bold text-green-700">
                        {req.amount.toLocaleString("vi-VN")} đ
                      </p>
                    </div>
                  </div>

                  {/* Requested at */}
                  <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Thời gian yêu cầu</p>
                      <p className="text-sm font-medium text-gray-700">
                        {new Date(req.requestedAt).toLocaleString("vi-VN")}
                      </p>
                    </div>
                  </div>

                  {/* Completed at */}
                  {req.completedAt && (
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">Thời gian hoàn thành</p>
                        <p className="text-sm font-medium text-gray-700">
                          {new Date(req.completedAt).toLocaleString("vi-VN")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bank QR Image */}
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Mã QR ngân hàng
                  </p>
                  <div className="flex justify-start">
                    <button
                      onClick={() =>
                        setPreviewImg({ src: req.bankQrImage, name: req.helperName })
                      }
                      className="relative group h-40 w-40 rounded-xl border border-gray-200 bg-gray-50 p-2 overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      title="Nhấp để phóng to"
                    >
                      <img
                        src={req.bankQrImage}
                        alt={`QR Code của ${req.helperName}`}
                        className="h-full w-full object-contain"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center rounded-xl">
                        <ZoomIn className="w-7 h-7 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                      </div>
                    </button>
                  </div>
                </div>

                {/* Action */}
                {req.status === "pending" && (
                  <div className="pt-2 border-t">
                    <Button
                      onClick={() => handleFinish(req.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Hoàn thành yêu cầu
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* QR lightbox */}
      <Dialog open={!!previewImg} onOpenChange={() => setPreviewImg(null)}>
        <DialogContent className="sm:max-w-lg flex flex-col items-center gap-4 p-6">
          <p className="text-sm font-medium text-gray-600 self-start">
            Mã QR ngân hàng — {previewImg?.name}
          </p>
          {previewImg && (
            <img
              src={previewImg.src}
              alt={`QR Code của ${previewImg.name}`}
              className="w-full max-h-[70vh] object-contain rounded-xl border border-gray-200 bg-gray-50 p-4"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
