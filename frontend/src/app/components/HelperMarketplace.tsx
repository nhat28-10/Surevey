import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Calendar,
  Clock,
  DollarSign,
  Users,
  Filter,
  CheckCircle,
} from "lucide-react";
import { Survey, SurveyFilters } from "../types/survey";
import {
  getOpenSurveys,
  addCollaboratorFinishedSurvey,
  completeSurvey,
} from "../services/surveyService";
import { isAuthenticated, getCurrentUser } from "../services/authService";

export function CollaboratorMarketplace() {
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [filteredSurveys, setFilteredSurveys] = useState<Survey[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState<SurveyFilters>({
    minReward: undefined,
    maxReward: undefined,
    maxTime: undefined,
    sortBy: undefined,
  });

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

  useEffect(() => {
    applyFilters();
  }, [surveys, filters]);

  const loadSurveys = () => {
    const openSurveys = getOpenSurveys();
    setSurveys(openSurveys);
  };

  const applyFilters = () => {
    const filtered = getOpenSurveys(filters);
    setFilteredSurveys(filtered);
  };

  const handleFilterChange = (key: keyof SurveyFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === "" ? undefined : value,
    }));
  };

  const resetFilters = () => {
    setFilters({
      minReward: undefined,
      maxReward: undefined,
      maxTime: undefined,
      sortBy: undefined,
    });
  };

  const completionPercentage = (survey: Survey) => {
    return Math.round((survey.completedCount / survey.targetCompletions) * 100);
  };

  const spotsRemaining = (survey: Survey) => {
    return survey.targetCompletions - survey.completedCount;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tìm khảo sát</h1>
        <p className="text-gray-600 mt-1">
          Hoàn thành khảo sát để kiếm phần thưởng
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              <CardTitle className="text-lg">Bộ lọc</CardTitle>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? "Ẩn" : "Hiện"}
            </Button>
          </div>
        </CardHeader>

        {showFilters && (
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Min Reward */}
              <div className="space-y-2">
                <Label htmlFor="minReward">Thưởng tối thiểu (đ)</Label>
                <Input
                  id="minReward"
                  type="number"
                  min="0"
                  step="100"
                  placeholder="0"
                  value={filters.minReward || ""}
                  onChange={(e) =>
                    handleFilterChange("minReward", parseFloat(e.target.value))
                  }
                />
              </div>

              {/* Max Reward */}
              <div className="space-y-2">
                <Label htmlFor="maxReward">Thưởng tối đa (đ)</Label>
                <Input
                  id="maxReward"
                  type="number"
                  min="0"
                  step="100"
                  placeholder="5000"
                  value={filters.maxReward || ""}
                  onChange={(e) =>
                    handleFilterChange("maxReward", parseFloat(e.target.value))
                  }
                />
              </div>

              {/* Max Time */}
              <div className="space-y-2">
                <Label htmlFor="maxTime">Thời gian tối đa (phút)</Label>
                <Input
                  id="maxTime"
                  type="number"
                  min="0"
                  placeholder="60"
                  value={filters.maxTime || ""}
                  onChange={(e) =>
                    handleFilterChange("maxTime", parseInt(e.target.value))
                  }
                />
              </div>

              {/* Sort By */}
              <div className="space-y-2">
                <Label htmlFor="sortBy">Sắp xếp theo</Label>
                <Select
                  value={filters.sortBy || ""}
                  onValueChange={(value) =>
                    handleFilterChange("sortBy", value || undefined)
                  }
                >
                  <SelectTrigger id="sortBy">
                    <SelectValue placeholder="Mặc định" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reward">Thưởng cao nhất</SelectItem>
                    <SelectItem value="time">Thời gian ngắn nhất</SelectItem>
                    <SelectItem value="deadline">Hạn chót sớm nhất</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={applyFilters}
                className="bg-green-600 hover:bg-green-700"
              >
                Áp dụng bộ lọc
              </Button>
              <Button size="sm" variant="outline" onClick={resetFilters}>
                Đặt lại
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Hiển thị {filteredSurveys.length}{" "}
          {filteredSurveys.length === 1 ? "khảo sát" : "khảo sát"}
        </p>
      </div>

      {/* Surveys Grid */}
      {filteredSurveys.length === 0 ? (
        <Card className="p-12">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <Filter className="w-16 h-16 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">
              Không tìm thấy khảo sát
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Thử điều chỉnh bộ lọc của bạn hoặc quay lại sau để tìm khảo sát
              mới.
            </p>
            <Button onClick={resetFilters}>Xóa bộ lọc</Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {filteredSurveys.map((survey) => {
            return (
              <Card
                key={survey.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-xl">
                          {survey.title}
                        </CardTitle>
                        {spotsRemaining(survey) <= 10 && (
                          <Badge
                            variant="outline"
                            className="bg-orange-50 text-orange-700 border-orange-200"
                          >
                            Chỉ còn {spotsRemaining(survey)} chỗ
                          </Badge>
                        )}
                      </div>
                      <CardDescription>{survey.description}</CardDescription>
                      <p className="text-sm text-gray-500 mt-2">
                        Đăng bởi: {survey.ownerName}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 sm:items-end">
                      <div className="text-2xl font-bold text-green-600">
                        {survey.reward.toLocaleString("vi-VN")} đ
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Survey Info Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                          {new Date(survey.deadline).toLocaleDateString(
                            "vi-VN",
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-orange-600" />
                      <div>
                        <p className="text-xs text-gray-500">Chỗ còn lại</p>
                        <p className="font-semibold">
                          {spotsRemaining(survey)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <div>
                        <p className="text-xs text-gray-500">Mỗi phản hồi</p>
                        <p className="font-semibold">
                          {survey.reward.toLocaleString("vi-VN")} đ
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        if (survey.surveyType === "internal") {
                          navigate(`/helper/survey/${survey.id}`);
                        } else {
                          const user = getCurrentUser();
                          if (user) {
                            addHelperFinishedSurvey(user.id, {
                              surveyId: survey.id,
                              title: survey.title,
                              surveyType: survey.surveyType,
                              reward: survey.reward,
                              finishedAt: new Date().toISOString(),
                            });
                            completeSurvey(survey.id);
                            window.dispatchEvent(new Event("storage"));
                          }
                          window.open(survey.surveyLink, "_blank");
                        }
                      }}
                    >
                      Truy cập khảo sát
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
