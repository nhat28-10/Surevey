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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { createSurvey } from "../services/surveyService";
import { isAuthenticated } from "../services/authService";
import { SurveyQuestion, QuestionType, SurveyPackage } from "../types/survey";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface SurveyDraft {
  title: string;
  description: string;
  package: SurveyPackage;
  deadline: string;
  targetCompletions: string;
  customerId: string;
  customerName: string;
}

export function SurveyBuilder() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if not authenticated
    if (!isAuthenticated()) {
      navigate("/login");
      return;
    }

    // Check if we have draft data
    const draftData = localStorage.getItem("surveyDraft");
    if (!draftData) {
      toast.error("Không tìm thấy thông tin khảo sát");
      navigate("/customer/post");
      return;
    }

    try {
      const draft: SurveyDraft = JSON.parse(draftData);
      setDraft(draft);
    } catch (error) {
      toast.error("Lỗi khi tải dữ liệu khảo sát");
      navigate("/customer/post");
    }
  }, [navigate]);

  const [draft, setDraft] = useState<SurveyDraft | null>(null);
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);

  const addQuestion = () => {
    const newQuestion: SurveyQuestion = {
      id: `q_${Date.now()}`,
      text: "",
      type: "multiple_choice",
      options: ["", ""],
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (questionId: string) => {
    setQuestions(questions.filter((q) => q.id !== questionId));
  };

  const updateQuestion = (
    questionId: string,
    updates: Partial<SurveyQuestion>,
  ) => {
    setQuestions(
      questions.map((q) => (q.id === questionId ? { ...q, ...updates } : q)),
    );
  };

  const addOption = (questionId: string) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId && q.options) {
          return { ...q, options: [...q.options, ""] };
        }
        return q;
      }),
    );
  };

  const removeOption = (questionId: string, optionIndex: number) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId && q.options) {
          const newOptions = q.options.filter((_, idx) => idx !== optionIndex);
          return { ...q, options: newOptions };
        }
        return q;
      }),
    );
  };

  const updateOption = (
    questionId: string,
    optionIndex: number,
    value: string,
  ) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId && q.options) {
          const newOptions = [...q.options];
          newOptions[optionIndex] = value;
          return { ...q, options: newOptions };
        }
        return q;
      }),
    );
  };

  const handleQuestionTypeChange = (
    questionId: string,
    newType: QuestionType,
  ) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId) {
          if (newType === "multiple_choice" && !q.options) {
            return { ...q, type: newType, options: ["", ""] };
          } else if (newType === "text") {
            const { options, ...rest } = q;
            return { ...rest, type: newType };
          }
          return { ...q, type: newType };
        }
        return q;
      }),
    );
  };

  const validate = (): boolean => {
    if (questions.length === 0) {
      toast.error("Vui lòng thêm ít nhất một câu hỏi");
      return false;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];

      if (!q.text.trim()) {
        toast.error(`Câu hỏi ${i + 1} cần có nội dung`);
        return false;
      }

      if (q.type === "multiple_choice") {
        if (!q.options || q.options.length < 2) {
          toast.error(`Câu hỏi ${i + 1} cần có ít nhất 2 lựa chọn`);
          return false;
        }

        const validOptions = q.options.filter((opt) => opt.trim());
        if (validOptions.length < 2) {
          toast.error(`Câu hỏi ${i + 1} cần có ít nhất 2 lựa chọn hợp lệ`);
          return false;
        }
      }
    }

    return true;
  };

  const handleSave = () => {
    if (!draft) {
      toast.error("Không tìm thấy thông tin khảo sát");
      return;
    }

    if (!validate()) {
      return;
    }

    try {
      // Create the survey with internal questions
      createSurvey({
        title: draft.title,
        description: draft.description,
        surveyType: "internal",
        surveyLink: "", // Empty for internal surveys
        internalQuestions: questions,
        package: draft.package,
        deadline: draft.deadline,
        targetCompletions: parseInt(draft.targetCompletions),
        customerId: draft.customerId,
        customerName: draft.customerName,
      });

      // Clear draft from localStorage
      localStorage.removeItem("surveyDraft");

      toast.success("Đã tạo khảo sát thành công!");
      window.dispatchEvent(new Event("storage"));
      navigate("/customer/dashboard");
    } catch (error) {
      toast.error("Không thể tạo khảo sát");
      console.error(error);
    }
  };

  if (!draft) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <p className="text-center text-gray-600">Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      <div>
        <Button
          variant="ghost"
          onClick={() => navigate("/customer/post")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">
          Tạo câu hỏi khảo sát
        </h1>
        <p className="text-gray-600 mt-1">
          Khảo sát: <span className="font-semibold">{draft.title}</span>
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Câu hỏi khảo sát</CardTitle>
          <CardDescription>
            Thêm các câu hỏi cho khảo sát của bạn. Mỗi câu hỏi có thể là trắc
            nghiệm hoặc văn bản tự do.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {questions.length === 0 && (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
              <p className="text-gray-600 mb-4">Chưa có câu hỏi nào</p>
              <Button
                onClick={addQuestion}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Thêm câu hỏi đầu tiên
              </Button>
            </div>
          )}

          {questions.map((question, index) => (
            <Card key={question.id} className="border-2 border-green-300">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Câu hỏi {index + 1}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeQuestion(question.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Question Text */}
                <div className="space-y-2">
                  <Label htmlFor={`question-${question.id}`}>
                    Nội dung câu hỏi *
                  </Label>
                  <Textarea
                    id={`question-${question.id}`}
                    value={question.text}
                    onChange={(e) =>
                      updateQuestion(question.id, { text: e.target.value })
                    }
                    placeholder="Nhập câu hỏi của bạn..."
                    rows={2}
                  />
                </div>

                {/* Question Type */}
                <div className="space-y-2">
                  <Label>Loại câu hỏi *</Label>
                  <Select
                    value={question.type}
                    onValueChange={(value: QuestionType) =>
                      handleQuestionTypeChange(question.id, value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="multiple_choice">
                        Trắc nghiệm
                      </SelectItem>
                      <SelectItem value="text">Văn bản tự do</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Options for Multiple Choice */}
                {question.type === "multiple_choice" && question.options && (
                  <div className="space-y-3">
                    <Label>Lựa chọn</Label>
                    {question.options.map((option, optIndex) => (
                      <div key={optIndex} className="flex gap-2">
                        <Input
                          value={option}
                          onChange={(e) =>
                            updateOption(question.id, optIndex, e.target.value)
                          }
                          placeholder={`Lựa chọn ${optIndex + 1}`}
                        />
                        {question.options!.length > 2 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeOption(question.id, optIndex)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addOption(question.id)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Thêm lựa chọn
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {questions.length > 0 && (
            <Button
              onClick={addQuestion}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Thêm câu hỏi
            </Button>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <Button
              onClick={handleSave}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              Lưu khảo sát
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                localStorage.removeItem("surveyDraft");
                navigate("/customer/post");
              }}
            >
              Hủy
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
