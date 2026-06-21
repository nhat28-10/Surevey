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
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { createSurvey, getCurrentUser } from "../services/surveyService";
import { isAuthenticated } from "../services/authService";
import { SurveyPackage, SURVEY_PACKAGES, SurveyType } from "../types/survey";
import { Check } from "lucide-react";
import { toast } from "sonner";

export function PostSurvey() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  useEffect(() => {
    // Redirect if not authenticated
    if (!isAuthenticated()) {
      navigate("/login");
    }
  }, [navigate]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    surveyType: "external" as SurveyType,
    surveyLink: "",
    deadline: "",
    targetCompletions: "",
    selectedPackage: "" as SurveyPackage | "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handlePackageSelect = (packageId: SurveyPackage) => {
    setFormData((prev) => ({ ...prev, selectedPackage: packageId }));
    if (errors.selectedPackage) {
      setErrors((prev) => ({ ...prev, selectedPackage: "" }));
    }
  };

  const getSelectedPackageInfo = () => {
    return SURVEY_PACKAGES.find((p) => p.id === formData.selectedPackage);
  };

  const calculateTotalCost = () => {
    if (!formData.selectedPackage || !formData.targetCompletions) return 0;
    const packageInfo = getSelectedPackageInfo();
    if (!packageInfo) return 0;

    const baseAmount =
      packageInfo.pricePerResponse * parseInt(formData.targetCompletions);
    const platformFee = baseAmount * 0.2;
    return baseAmount + platformFee;
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Tiêu đề là bắt buộc";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Mô tả là bắt buộc";
    }

    // Only validate survey link if external survey is selected
    if (formData.surveyType === "external") {
      if (!formData.surveyLink.trim()) {
        newErrors.surveyLink = "Liên kết khảo sát là bắt buộc";
      } else if (
        !formData.surveyLink.startsWith("http://") &&
        !formData.surveyLink.startsWith("https://")
      ) {
        newErrors.surveyLink =
          "Vui lòng nhập URL hợp lệ bắt đầu bằng http:// hoặc https://";
      }
    }

    if (!formData.selectedPackage) {
      newErrors.selectedPackage = "Vui lòng chọn một gói";
    }

    if (!formData.deadline) {
      newErrors.deadline = "Hạn chót là bắt buộc";
    } else if (new Date(formData.deadline) <= new Date()) {
      newErrors.deadline = "Hạn chót phải là ngày trong tương lai";
    }

    if (!formData.targetCompletions) {
      newErrors.targetCompletions = "Mục tiêu hoàn thành là bắt buộc";
    } else if (parseInt(formData.targetCompletions) <= 0) {
      newErrors.targetCompletions = "Mục tiêu phải lớn hơn 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast.error("Vui lòng sửa các lỗi trong biểu mẫu");
      return;
    }

    // If internal survey, redirect to survey builder with form data
    if (formData.surveyType === "internal") {
      // Store form data in localStorage temporarily for survey builder
      localStorage.setItem(
        "surveyDraft",
        JSON.stringify({
          title: formData.title,
          description: formData.description,
          package: formData.selectedPackage,
          deadline: formData.deadline,
          targetCompletions: formData.targetCompletions,
          ownerId: currentUser.id,
          ownerName: currentUser.name,
        }),
      );
      navigate("/owner/survey-builder");
      return;
    }

    // For external surveys, create immediately
    try {
      createSurvey({
        title: formData.title,
        description: formData.description,
        surveyType: "external",
        surveyLink: formData.surveyLink,
        package: formData.selectedPackage as SurveyPackage,
        deadline: new Date(formData.deadline).toISOString(),
        targetCompletions: parseInt(formData.targetCompletions),
        ownerId: currentUser.id,
        ownerName: currentUser.name,
      });

      toast.success("Đã đăng khảo sát thành công!");
      window.dispatchEvent(new Event("storage"));
      navigate("/owner/dashboard");
    } catch (error) {
      toast.error("Không thể đăng khảo sát");
      console.error(error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Đăng khảo sát mới</h1>
        <p className="text-gray-600 mt-1">
          Điền thông tin bên dưới để đăng khảo sát của bạn
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Chi tiết khảo sát</CardTitle>
          <CardDescription>
            Cung cấp thông tin về khảo sát của bạn để thu hút người làm khảo sát
            chất lượng
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Tiêu đề khảo sát *</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="ví dụ: Khảo sát mức độ hài lòng của khách hàng"
                className={errors.title ? "border-red-500" : ""}
              />
              {errors.title && (
                <p className="text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Mô tả *</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Mô tả khảo sát của bạn và loại phản hồi bạn đang tìm kiếm..."
                rows={4}
                className={errors.description ? "border-red-500" : ""}
              />
              {errors.description && (
                <p className="text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            {/* Survey Type */}
            <div className="space-y-3">
              <Label>Loại khảo sát *</Label>
              <RadioGroup
                value={formData.surveyType}
                onValueChange={(value: SurveyType) => {
                  setFormData((prev) => ({ ...prev, surveyType: value }));
                  // Clear survey link error when switching
                  if (errors.surveyLink) {
                    setErrors((prev) => ({ ...prev, surveyLink: "" }));
                  }
                }}
              >
                <div className="flex items-center space-x-2 border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-all">
                  <RadioGroupItem value="external" id="external" />
                  <Label htmlFor="external" className="flex-1 cursor-pointer">
                    <div>
                      <p className="font-semibold">Link bên ngoài</p>
                      <p className="text-sm text-gray-600">
                        Google Forms, Typeform, SurveyMonkey, v.v.
                      </p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-all">
                  <RadioGroupItem value="internal" id="internal" />
                  <Label htmlFor="internal" className="flex-1 cursor-pointer">
                    <div>
                      <p className="font-semibold">
                        Tạo khảo sát trên hệ thống
                      </p>
                      <p className="text-sm text-gray-600">
                        Sử dụng trình tạo khảo sát của chúng tôi
                      </p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Survey Link - Only show for external surveys */}
            {formData.surveyType === "external" && (
              <div className="space-y-2">
                <Label htmlFor="surveyLink">Liên kết khảo sát *</Label>
                <Input
                  id="surveyLink"
                  name="surveyLink"
                  type="url"
                  value={formData.surveyLink}
                  onChange={handleChange}
                  placeholder="https://forms.google.com/..."
                  className={errors.surveyLink ? "border-red-500" : ""}
                />
                <p className="text-xs text-gray-500">
                  Liên kết đến khảo sát của bạn trên Google Forms, Typeform,
                  SurveyMonkey, v.v.
                </p>
                {errors.surveyLink && (
                  <p className="text-sm text-red-600">{errors.surveyLink}</p>
                )}
              </div>
            )}

            {/* Package Selection */}
            <div className="space-y-3">
              <Label>Chọn gói khảo sát *</Label>
              <div className="grid md:grid-cols-3 gap-4">
                {SURVEY_PACKAGES.map((pkg) => (
                  <div
                    key={pkg.id}
                    onClick={() => handlePackageSelect(pkg.id)}
                    className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      formData.selectedPackage === pkg.id
                        ? "border-green-300 bg-green-50"
                        : "border-gray-200 hover:border-green-300"
                    }`}
                  >
                    {formData.selectedPackage === pkg.id && (
                      <div className="absolute top-3 right-3 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div className="space-y-2">
                      <h3 className="font-bold text-lg">{pkg.name}</h3>
                      <p className="text-sm text-gray-600">{pkg.description}</p>
                      <div className="pt-2 border-t space-y-1">
                        <p className="text-xs text-gray-500">Giá mỗi lượt</p>
                        <p className="text-xl font-bold text-blue-600">
                          {pkg.pricePerResponse.toLocaleString("vi-VN")} đ
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          Thời gian giới hạn
                        </p>
                        <p className="text-sm font-semibold">
                          {pkg.timeLimit} phút
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {errors.selectedPackage && (
                <p className="text-sm text-red-600">{errors.selectedPackage}</p>
              )}
            </div>

            {/* Deadline and Target Grid */}
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Deadline */}
              <div className="space-y-2">
                <Label htmlFor="deadline">Hạn chót *</Label>
                <Input
                  id="deadline"
                  name="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={handleChange}
                  min={new Date().toISOString().split("T")[0]}
                  className={errors.deadline ? "border-red-500" : ""}
                />
                {errors.deadline && (
                  <p className="text-sm text-red-600">{errors.deadline}</p>
                )}
              </div>

              {/* Target Completions */}
              <div className="space-y-2">
                <Label htmlFor="targetCompletions">Số lượt cần đạt *</Label>
                <Input
                  id="targetCompletions"
                  name="targetCompletions"
                  type="number"
                  min="1"
                  value={formData.targetCompletions}
                  onChange={handleChange}
                  placeholder="50"
                  className={errors.targetCompletions ? "border-red-500" : ""}
                />
                <p className="text-xs text-gray-500">
                  Có bao nhiêu người nên hoàn thành khảo sát này?
                </p>
                {errors.targetCompletions && (
                  <p className="text-sm text-red-600">
                    {errors.targetCompletions}
                  </p>
                )}
              </div>
            </div>

            {/* Summary Box */}
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 space-y-3">
              <p className="font-bold text-gray-900 text-lg">Tóm tắt chi phí</p>
              {formData.selectedPackage && formData.targetCompletions ? (
                <div className="space-y-2">
                  <div className="text-sm text-gray-700 space-y-1">
                    <div className="flex justify-between">
                      <span>Giá mỗi lượt:</span>
                      <span className="font-semibold">
                        {getSelectedPackageInfo()?.pricePerResponse.toLocaleString(
                          "vi-VN",
                        )}{" "}
                        đ
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Số lượt cần đạt:</span>
                      <span className="font-semibold">
                        {formData.targetCompletions}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Thời gian trả lời:</span>
                      <span className="font-semibold">
                        {getSelectedPackageInfo()?.timeLimit} phút
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-green-200">
                      <span>Chi phí cơ bản:</span>
                      <span className="font-semibold">
                        {(
                          getSelectedPackageInfo()!.pricePerResponse *
                          parseInt(formData.targetCompletions)
                        ).toLocaleString("vi-VN")}{" "}
                        đ
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Phí nền tảng (20%):</span>
                      <span className="font-semibold">
                        {(
                          getSelectedPackageInfo()!.pricePerResponse *
                          parseInt(formData.targetCompletions) *
                          0.2
                        ).toLocaleString("vi-VN")}{" "}
                        đ
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between pt-2 border-t-2 border-green-300">
                    <span className="font-bold text-lg">
                      Tổng số tiền phải trả:
                    </span>
                    <span className="font-bold text-xl text-blue-600">
                      {calculateTotalCost().toLocaleString("vi-VN")} đ
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    • Dự kiến hoàn thành:{" "}
                    {formData.deadline
                      ? new Date(formData.deadline).toLocaleDateString("vi-VN")
                      : "Chưa đặt"}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-600">
                  Chọn gói và nhập số lượt để xem chi phí
                </p>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {formData.surveyType === "internal"
                  ? "Tiếp theo: Tạo câu hỏi"
                  : "Đăng khảo sát"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/owner/dashboard")}
              >
                Hủy
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
