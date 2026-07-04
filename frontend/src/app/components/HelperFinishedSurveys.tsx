import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import {
  CheckCircle,
  Wallet,
  TrendingUp,
  ClipboardList,
  ExternalLink,
  Calendar,
  Upload,
  ImageIcon,
  X,
  CheckCircle2,
} from "lucide-react";
import { Notification } from "./Notification";
import {
  getCollaboratorFinishedSurveys,
  getTotalEarned,
} from "../services/surveyService";
import {
  createWithdrawRequest,
  getCollaboratorAvailableBalance,
} from "../services/withdrawService";
import { getCurrentUser, isAuthenticated } from "../services/authService";
import type { FinishedEntry } from "../types/survey";

// Minimum balance required to request a withdrawal
const MIN_WITHDRAW = 10000;

// Dark green = green-800 (#166534), Light green = green-400 (#4ade80)
// These must stay in sync with the legend below
const BAR_EARNED_COLOR = "bg-green-800";
const BAR_AVAILABLE_COLOR = "bg-green-400";

export function CollaboratorFinishedSurveys() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [entries, setEntries] = useState<FinishedEntry[]>([]);
  const [totalEarned, setTotalEarned] = useState(0);
  const [availableBalance, setAvailableBalance] = useState(0);

  const [notification, setNotification] = useState<{
    type: "error" | "success" | "warning" | "info";
    message: string;
  } | null>(null);

  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [qrError, setQrError] = useState("");

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
      return;
    }
    loadData();

    const handleStorage = () => {
      if (!isAuthenticated()) {
        navigate("/login");
        return;
      }
      loadData();
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [navigate]);

  const loadData = () => {
    const user = getCurrentUser();
    if (!user) return;
    const earned = getTotalEarned(user.id);
    setEntries(getHelperFinishedSurveys(user.id));
    setTotalEarned(earned);
    setAvailableBalance(getHelperAvailableBalance(user.id, earned));
  };

  // Bar shows ratio of available balance to total earned.
  // Dark green = 100% (full bar = total earned). Light green = available portion.
  const availablePercent = totalEarned > 0
    ? Math.min((availableBalance / totalEarned) * 100, 100)
    : 0;

  const handleOpenWithdraw = () => {
    if (availableBalance < MIN_WITHDRAW) {
      setNotification({
        type: "error",
        message:
          "Không thể yêu cầu rút tiền. Số dư khả dụng phải từ 10.000 đ trở lên.",
      });
      return;
    }
    setNotification(null);
    setQrPreview(null);
    setQrBase64(null);
    setQrError("");
    setSubmitted(false);
    setWithdrawOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setQrError("Vui lòng chọn file ảnh hợp lệ.");
      return;
    }
    setQrError("");
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setQrBase64(result);
      setQrPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitWithdraw = () => {
    if (!qrBase64) {
      setQrError("Vui lòng tải lên mã QR ngân hàng của bạn.");
      return;
    }
    const user = getCurrentUser();
    if (!user) return;

    setSubmitting(true);
    createWithdrawRequest({
      helperId: user.id,
      helperName: user.name,
      helperEmail: user.email,
      amount: availableBalance,
      bankQrImage: qrBase64,
    });
    window.dispatchEvent(new Event("storage"));
    setSubmitting(false);
    setSubmitted(true);
  };

  const handleCloseModal = () => {
    setWithdrawOpen(false);
    setSubmitted(false);
    setQrPreview(null);
    setQrBase64(null);
    setQrError("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Khảo sát đã hoàn thành
        </h1>
        <p className="text-gray-600 mt-1">
          Theo dõi thu nhập và lịch sử khảo sát của bạn
        </p>
      </div>

      {/* Inline notification */}
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
          autoDismiss={6000}
        />
      )}

      {/* Earnings Summary Card */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <Wallet className="w-5 h-5" />
            Tóm tắt thu nhập
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Figures */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-green-700">Tổng thu nhập</p>
              <p className="text-2xl font-bold text-green-900">
                {totalEarned.toLocaleString("vi-VN")} đ
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-green-700">Số dư khả dụng</p>
              <p className="text-2xl font-bold text-green-900">
                {availableBalance.toLocaleString("vi-VN")} đ
              </p>
            </div>
          </div>

          {/* Two-segment progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-green-700">
              <span>Tỷ lệ số dư / tổng thu nhập</span>
              <span>
                {availableBalance.toLocaleString("vi-VN")} /{" "}
                {totalEarned.toLocaleString("vi-VN")} đ
              </span>
            </div>

            {/* Bar: dark-green fills 100% (total earned), light-green overlays available portion */}
            <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
              {/* Dark green: total earned — always full width */}
              <div
                className={`absolute inset-y-0 left-0 right-0 ${BAR_EARNED_COLOR} rounded-full transition-all duration-500`}
              />
              {/* Light green: available balance */}
              <div
                className={`absolute inset-y-0 left-0 ${BAR_AVAILABLE_COLOR} rounded-full transition-all duration-500`}
                style={{ width: `${availablePercent}%` }}
              />
            </div>

            {/* Legend — colors must match the bar above */}
            <div className="flex items-center gap-5 pt-0.5">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-green-800 shrink-0" />
                <span className="text-xs text-green-800 font-medium">
                  Tổng thu nhập
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-green-400 shrink-0" />
                <span className="text-xs text-green-700 font-medium">
                  Số dư khả dụng
                </span>
              </div>
            </div>
          </div>

          {/* Withdraw button */}
          <Button
            className="bg-green-600 hover:bg-green-700 sm:w-auto w-full"
            onClick={handleOpenWithdraw}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Yêu cầu rút tiền
          </Button>
        </CardContent>
      </Card>

      {/* Withdrawal Modal */}
      <Dialog open={withdrawOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Yêu cầu rút tiền
            </DialogTitle>
          </DialogHeader>

          {submitted ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Yêu cầu đã được gửi!
              </h3>
              <p className="text-sm text-gray-500">
                Yêu cầu rút{" "}
                <span className="font-semibold text-green-700">
                  {availableBalance.toLocaleString("vi-VN")} đ
                </span>{" "}
                của bạn đang chờ xử lý. Admin sẽ xét duyệt sớm nhất có thể.
              </p>
              <Button
                onClick={handleCloseModal}
                className="bg-green-600 hover:bg-green-700"
              >
                Đóng
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-5 py-2">
                {/* Amount display */}
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200">
                  <div>
                    <p className="text-xs text-green-700 mb-0.5">Số tiền rút</p>
                    <p className="text-2xl font-bold text-green-900">
                      {availableBalance.toLocaleString("vi-VN")} đ
                    </p>
                  </div>
                  <Wallet className="w-8 h-8 text-green-400" />
                </div>

                {/* QR upload */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">
                    Mã QR ngân hàng{" "}
                    <span className="text-red-500">*</span>
                  </p>

                  {qrPreview ? (
                    <div className="relative">
                      <img
                        src={qrPreview}
                        alt="Mã QR ngân hàng"
                        className="w-full max-h-56 object-contain rounded-xl border border-gray-200 bg-gray-50"
                      />
                      <button
                        onClick={() => {
                          setQrPreview(null);
                          setQrBase64(null);
                          if (fileInputRef.current)
                            fileInputRef.current.value = "";
                        }}
                        className="absolute top-2 right-2 bg-white rounded-full p-1 shadow border border-gray-200 hover:bg-red-50 text-gray-500 hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-green-400 hover:bg-green-50 transition-colors group"
                    >
                      <ImageIcon className="w-10 h-10 text-gray-300 group-hover:text-green-400 mx-auto mb-3 transition-colors" />
                      <p className="text-sm font-medium text-gray-600">
                        Nhấp để tải lên ảnh QR
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        PNG, JPG, WEBP
                      </p>
                      <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs text-gray-600 shadow-sm">
                        <Upload className="w-3 h-3" />
                        Chọn ảnh
                      </div>
                    </button>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />

                  {qrError && (
                    <p className="text-xs text-red-500">{qrError}</p>
                  )}
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={handleCloseModal}>
                  Hủy
                </Button>
                <Button
                  onClick={handleSubmitWithdraw}
                  disabled={submitting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {submitting ? "Đang gửi..." : "Gửi yêu cầu"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Completed Surveys List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-green-600" />
          Danh sách khảo sát đã làm ({entries.length})
        </h2>

        {entries.length === 0 ? (
          <Card className="p-12">
            <div className="text-center space-y-4">
              <CheckCircle className="w-16 h-16 text-gray-300 mx-auto" />
              <h3 className="text-xl font-semibold text-gray-600">
                Chưa có khảo sát nào
              </h3>
              <p className="text-gray-500 max-w-sm mx-auto">
                Hoàn thành khảo sát trong thị trường để thấy lịch sử và thu
                nhập ở đây.
              </p>
              <Button
                onClick={() => navigate("/helper/marketplace")}
                className="bg-green-600 hover:bg-green-700"
              >
                Tìm khảo sát
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <Card
                key={`${entry.surveyId}-${entry.finishedAt}`}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900 truncate">
                          {entry.title}
                        </span>
                        <Badge
                          variant="outline"
                          className={
                            entry.surveyType === "internal"
                              ? "bg-blue-50 text-blue-700 border-blue-200 text-xs"
                              : "bg-purple-50 text-purple-700 border-purple-200 text-xs"
                          }
                        >
                          {entry.surveyType === "internal" ? (
                            <>
                              <ClipboardList className="w-3 h-3 mr-1" />
                              Nội bộ
                            </>
                          ) : (
                            <>
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Bên ngoài
                            </>
                          )}
                        </Badge>
                        <Badge className="bg-green-100 text-green-700 border border-green-200 text-xs">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Hoàn thành
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        {new Date(entry.finishedAt).toLocaleString("vi-VN")}
                      </div>
                    </div>
                    <div className="text-xl font-bold text-green-600 whitespace-nowrap">
                      +{entry.reward.toLocaleString("vi-VN")} đ
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
