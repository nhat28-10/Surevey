import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import {
  PlusCircle,
  ExternalLink,
  Calendar,
  Clock,
  DollarSign,
  Users,
  XCircle,
  Trash2,
} from "lucide-react";
import { Survey, SurveyStatus } from "../types/survey";
import {
  getSurveysByOwner,
  getCurrentUser,
  cancelSurvey,
  deleteSurvey,
} from "../services/surveyService";
import { isAuthenticated } from "../services/authService";
import { toast } from "sonner";

export function OwnerDashboard() {
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const currentUser = getCurrentUser();

  useEffect(() => {
    // Redirect if not authenticated
    if (!isAuthenticated()) {
      navigate("/login");
      return;
    }

    loadSurveys();

    const handleStorageChange = () => {
      if (!isAuthenticated()) {
        navigate("/login");
        return;
      }
      loadSurveys();
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [navigate]);

  const loadSurveys = () => {
    if (currentUser) {
      const userSurveys = getSurveysByOwner(currentUser.id);
      setSurveys(userSurveys);
    }
  };

  const handleCancel = (surveyId: string) => {
    const result = cancelSurvey(surveyId, currentUser.id);
    if (result) {
      toast.success("Đã hủy khảo sát thành công");
      loadSurveys();
      window.dispatchEvent(new Event("storage"));
    } else {
      toast.error("Không thể hủy khảo sát đã được bắt đầu");
    }
  };

  const handleDelete = (surveyId: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa khảo sát này?")) {
      const result = deleteSurvey(surveyId, currentUser.id);
      if (result) {
        toast.success("Đã xóa khảo sát thành công");
        loadSurveys();
        window.dispatchEvent(new Event("storage"));
      } else {
        toast.error("Không thể xóa khảo sát");
      }
    }
  };

  const getStatusColor = (status: SurveyStatus) => {
    switch (status) {
      case SurveyStatus.OPEN:
        return "bg-green-500";
      case SurveyStatus.IN_PROGRESS:
        return "bg-blue-500";
      case SurveyStatus.COMPLETED:
        return "bg-gray-500";
      case SurveyStatus.CANCELLED:
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const completionPercentage = (survey: Survey) => {
    return Math.round((survey.completedCount / survey.targetCompletions) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Khảo sát của tôi</h1>
          <p className="text-gray-600 mt-1">
            Quản lý và theo dõi các khảo sát đã đăng
          </p>
        </div>
        <Button asChild className="bg-green-600">
          <Link to="/owner/post">
            <PlusCircle className="w-4 h-4 mr-2" />
            Đăng khảo sát mới
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Tổng số khảo sát</CardDescription>
            <CardTitle className="text-3xl">{surveys.length}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Đang mở</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {surveys.filter((s) => s.status === SurveyStatus.OPEN).length}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Đang tiến hành</CardDescription>
            <CardTitle className="text-3xl text-blue-600">
              {
                surveys.filter((s) => s.status === SurveyStatus.IN_PROGRESS)
                  .length
              }
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Đã hoàn thành</CardDescription>
            <CardTitle className="text-3xl text-gray-600">
              {
                surveys.filter((s) => s.status === SurveyStatus.COMPLETED)
                  .length
              }
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Surveys List */}
      {surveys.length === 0 ? (
        <Card className="p-12">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <PlusCircle className="w-16 h-16 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">
              Chưa có khảo sát nào
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Bắt đầu bằng cách đăng khảo sát đầu tiên của bạn. Đặt mức thưởng
              và tiếp cận hàng trăm người tham gia tiềm năng.
            </p>
            <Button asChild className="bg-green-600 hover:bg-green-600">
              <Link to="/owner/post">Đăng khảo sát đầu tiên</Link>
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6">
          {surveys.map((survey) => (
            <Card key={survey.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-xl">{survey.title}</CardTitle>
                      <Badge className={getStatusColor(survey.status)}>
                        {survey.status}
                      </Badge>
                    </div>
                    <CardDescription>{survey.description}</CardDescription>
                  </div>

                  <div className="flex gap-2">
                    {survey.status === SurveyStatus.OPEN && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleCancel(survey.id)}
                        className="bg-yellow-500 hover:bg-yellow-600"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Hủy
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(survey.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Xóa
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tiến độ hoàn thành</span>
                    <span className="font-semibold">
                      {survey.completedCount} / {survey.targetCompletions} phản
                      hồi
                    </span>
                  </div>
                  <Progress
                    value={completionPercentage(survey)}
                    className="h-2"
                  />
                  <p className="text-xs text-gray-500 text-right">
                    {completionPercentage(survey)}% hoàn thành
                  </p>
                </div>

                {/* Survey Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <div>
                      <p className="text-xs text-gray-500">Phần thưởng</p>
                      <p className="font-semibold">
                        {survey.reward.toLocaleString("vi-VN")} đ
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="text-xs text-gray-500">Thời lượng</p>
                      <p className="font-semibold">
                        {survey.estimatedTime} phút
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-purple-600" />
                    <div>
                      <p className="text-xs text-gray-500">Hạn chót</p>
                      <p className="font-semibold text-sm">
                        {new Date(survey.deadline).toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-orange-600" />
                    <div>
                      <p className="text-xs text-gray-500">Đã chấp nhận</p>
                      <p className="font-semibold">
                        {survey.acceptedBy?.length || 0}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Survey Link */}
                <div className="pt-4 border-t">
                  <a
                    href={survey.surveyLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Xem liên kết khảo sát
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
