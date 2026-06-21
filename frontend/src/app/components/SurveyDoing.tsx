import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import {
  CheckCircle2,
  Circle,
  ChevronRight,
  ChevronLeft,
  Send,
  Clock,
  FileText,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Progress } from "../components/ui/progress";
import { getAllSurveys } from "../services/surveyService";
import type { Survey, SurveyQuestion } from "../types/survey";

type Answers = Record<string, string>;

export const SurveyDoing = () => {
  const { surveyId } = useParams<{ surveyId: string }>();
  const navigate = useNavigate();

  const [survey, setSurvey] = useState<Survey | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const all = getAllSurveys();
    const found = all.find((s) => s.id === surveyId) ?? null;
    setSurvey(found);
  }, [surveyId]);

  if (!survey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <p className="text-zinc-400 text-sm">Không tìm thấy khảo sát.</p>
      </div>
    );
  }

  const questions: SurveyQuestion[] = survey.internalQuestions ?? [];
  const total = questions.length;
  const current = questions[currentIndex];
  const progress =
    total === 0
      ? 100
      : Math.round(
          ((currentIndex + (answers[current?.id] ? 1 : 0)) / total) * 100,
        );
  const answeredCount = Object.keys(answers).length;

  const handleSelect = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (currentIndex < total - 1) setCurrentIndex((i) => i + 1);
  };

  const handleBack = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  };

  const handleSubmit = () => {
    // Submission logic goes here
    setSubmitted(true);
  };

  const isCurrentAnswered = current ? !!answers[current.id] : false;
  const isLast = currentIndex === total - 1;
  const allAnswered = answeredCount === total;

  /* ── Submitted state ── */
  if (submitted) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-semibold text-zinc-900 mb-2">
            Đã nộp khảo sát!
          </h2>
          <p className="text-sm text-zinc-500 mb-6">
            Cảm ơn bạn đã hoàn thành{" "}
            <span className="font-medium text-zinc-700">{survey.title}</span>.
            Phần thưởng sẽ được ghi nhận sớm.
          </p>
          <Button
            className="bg-green-600 text-white hover:bg-green-700 rounded-full px-6"
            onClick={() => navigate("/helper/marketplace")}
          >
            Quay lại thị trường
          </Button>
        </div>
      </div>
    );
  }

  /* ── Empty survey guard ── */
  if (total === 0) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <FileText className="w-10 h-10 text-zinc-300 mx-auto mb-4" />
          <p className="text-zinc-500 text-sm">
            Khảo sát này chưa có câu hỏi nào.
          </p>
          <Button
            variant="ghost"
            className="mt-4 text-sm"
            onClick={() => navigate(-1)}
          >
            Quay lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      {/* ── Header ── */}
      <header className="bg-white border-b border-zinc-200 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-sm font-semibold text-zinc-900 truncate max-w-[60%]">
              {survey.title}
            </h1>
            <div className="flex items-center gap-3 text-xs text-zinc-400 shrink-0">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {survey.estimatedTime} phút
              </span>
              <span className="font-medium text-zinc-600">
                {currentIndex + 1} / {total}
              </span>
            </div>
          </div>
          <Progress
            value={progress}
            className="h-1 bg-zinc-100 [&>div]:bg-green-700"
          />
        </div>
      </header>

      {/* ── Question area ── */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-2xl">
          {/* Question card */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm mb-5">
            <span className="inline-block text-xs font-medium text-zinc-400 mb-3 tracking-wide uppercase">
              Câu {currentIndex + 1}
            </span>
            <p className="text-base font-medium text-zinc-900 leading-relaxed mb-6">
              {current.text || (
                <span className="text-zinc-400 italic">
                  Chưa có nội dung câu hỏi
                </span>
              )}
            </p>

            {/* Multiple choice */}
            {current.type === "multiple_choice" && current.options && (
              <div className="space-y-2.5">
                {current.options.map((option, idx) => {
                  const selected = answers[current.id] === option;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelect(current.id, option)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left text-sm transition-all duration-150
                        ${
                          selected
                            ? "bg-green-600 text-white"
                            : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-zinc-400 hover:bg-white"
                        }`}
                    >
                      {selected ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 shrink-0 text-zinc-300" />
                      )}
                      <span>{option}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Free text */}
            {current.type === "text" && (
              <Textarea
                value={answers[current.id] ?? ""}
                onChange={(e) => handleSelect(current.id, e.target.value)}
                placeholder="Nhập câu trả lời của bạn..."
                rows={4}
                className="resize-none rounded-xl border-zinc-200 focus-visible:ring-zinc-400 text-sm"
              />
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentIndex === 0}
              className="rounded-full px-5 border-zinc-200 text-zinc-600 hover:bg-zinc-100 disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Trước
            </Button>

            <div className="flex-1" />

            {isLast ? (
              <Button
                onClick={handleSubmit}
                disabled={!allAnswered}
                className="rounded-full px-6 bg-green-700 text-white hover:bg-green-800 disabled:opacity-40 flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Nộp khảo sát
                {!allAnswered && (
                  <span className="ml-1 text-xs opacity-70">
                    ({answeredCount}/{total})
                  </span>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!isCurrentAnswered}
                className="rounded-full px-5 bg-green-700 text-white hover:bg-green-800 disabled:opacity-40"
              >
                Tiếp
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>

          {/* Dot navigation */}
          <div className="flex justify-center gap-1.5 mt-8">
            {questions.map((q, i) => (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(i)}
                className={`h-2 rounded-full transition-all duration-150
                  ${
                    i === currentIndex
                      ? "bg-green-700 w-5"
                      : answers[q.id]
                        ? "bg-zinc-400 w-2"
                        : "bg-zinc-200 w-2"
                  }`}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};
