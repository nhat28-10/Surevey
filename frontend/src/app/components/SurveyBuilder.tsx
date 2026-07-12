import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { DndProvider, useDrag, useDrop, useDragLayer } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { motion, AnimatePresence } from "motion/react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { createSurvey } from "../services/surveyService";
import { isAuthenticated } from "../services/authService";
import { SurveyQuestion, QuestionType, SurveyPackage } from "../types/survey";
import {
  Plus,
  Trash2,
  ArrowLeft,
  Copy,
  GripVertical,
  MoreVertical,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  Hash,
} from "lucide-react";
import { toast } from "sonner";

// ─── Constants ─────────────────────────────────────────────────────────────
const DRAG_TYPE = "SURVEY_QUESTION";

interface DragItem {
  index: number;
  id: string;
}

interface SurveyDraft {
  title: string;
  description: string;
  package: SurveyPackage;
  deadline: string;
  targetCompletions: string;
  customerId: string;
  customerName: string;
}

// ─── Auto-scroll during drag ───────────────────────────────────────────────
function useAutoScroll(active: boolean) {
  useEffect(() => {
    if (!active) return;
    let mouseY = 0;
    let rafId = 0;

    const onDragOver = (e: DragEvent) => {
      mouseY = e.clientY;
    };
    document.addEventListener("dragover", onDragOver);

    const tick = () => {
      const THRESHOLD = 80;
      const SPEED = 10;
      if (mouseY < THRESHOLD) window.scrollBy(0, -SPEED);
      else if (mouseY > window.innerHeight - THRESHOLD)
        window.scrollBy(0, SPEED);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      document.removeEventListener("dragover", onDragOver);
      cancelAnimationFrame(rafId);
    };
  }, [active]);
}

// ─── Move-to-Position Dialog ───────────────────────────────────────────────
interface MoveToPositionDialogProps {
  open: boolean;
  currentPosition: number;
  total: number;
  onClose: () => void;
  onMove: (targetPosition: number) => void;
}

function MoveToPositionDialog({
  open,
  currentPosition,
  total,
  onClose,
  onMove,
}: MoveToPositionDialogProps) {
  const [value, setValue] = useState(String(currentPosition));

  useEffect(() => {
    if (open) setValue(String(currentPosition));
  }, [open, currentPosition]);

  const handleMove = () => {
    const parsed = parseInt(value, 10);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > total) {
      toast.error(`Vui lòng nhập vị trí từ 1 đến ${total}`);
      return;
    }
    onMove(parsed);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Di chuyển đến vị trí</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Vị trí hiện tại</p>
            <p className="text-sm font-semibold text-gray-700">
              {currentPosition} / {total}
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="move-target-pos">Vị trí đích (1 – {total})</Label>
            <Input
              id="move-target-pos"
              type="number"
              min={1}
              max={total}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleMove()}
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button
            onClick={handleMove}
            className="bg-green-600 hover:bg-green-700"
          >
            Di chuyển
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Question Card ─────────────────────────────────────────────────────────
interface QuestionCardProps {
  question: SurveyQuestion;
  index: number;
  total: number;
  isHighlighted: boolean;
  onReorder: (from: number, to: number) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onMoveToTop: () => void;
  onMoveToBottom: () => void;
  onOpenMoveToPosition: () => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onUpdate: (updates: Partial<SurveyQuestion>) => void;
  onAddOption: () => void;
  onRemoveOption: (optIdx: number) => void;
  onUpdateOption: (optIdx: number, value: string) => void;
  onTypeChange: (type: QuestionType) => void;
}

function QuestionCard({
  question,
  index,
  total,
  isHighlighted,
  onReorder,
  onMoveUp,
  onMoveDown,
  onMoveToTop,
  onMoveToBottom,
  onOpenMoveToPosition,
  onRemove,
  onDuplicate,
  onUpdate,
  onAddOption,
  onRemoveOption,
  onUpdateOption,
  onTypeChange,
}: QuestionCardProps) {
  const [{ isDragging }, drag, preview] = useDrag<
    DragItem,
    unknown,
    { isDragging: boolean }
  >({
    type: DRAG_TYPE,
    item: () => ({ index, id: question.id }),
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  const [, drop] = useDrop<DragItem>({
    accept: DRAG_TYPE,
    hover(item, monitor) {
      const el = document.getElementById(`question-card-${question.id}`);
      if (!el) return;

      const dragIdx = item.index;
      const hoverIdx = index;
      if (dragIdx === hoverIdx) return;

      const rect = el.getBoundingClientRect();
      const midY = (rect.bottom - rect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;

      const hoverY = clientOffset.y - rect.top;
      if (dragIdx < hoverIdx && hoverY < midY) return;
      if (dragIdx > hoverIdx && hoverY > midY) return;

      onReorder(dragIdx, hoverIdx);
      item.index = hoverIdx;
    },
  });

  return (
    <motion.div
      layout={!isDragging}
      id={`question-card-${question.id}`}
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: isDragging ? 0.35 : 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ type: "spring", stiffness: 500, damping: 35 }}
      ref={(el) => {
        preview(el);
        drop(el);
      }}
    >
      <Card
        className={[
          "border-2 transition-colors duration-500",
          isHighlighted
            ? "border-yellow-400 ring-2 ring-yellow-300 ring-offset-1 shadow-md"
            : "border-green-300",
          !isDragging && "hover:shadow-md",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            {/* Drag handle */}
            <button
              ref={(el) => {
                drag(el);
              }}
              type="button"
              aria-label="Kéo để sắp xếp lại câu hỏi"
              className="cursor-grab active:cursor-grabbing touch-none shrink-0 rounded p-1 text-gray-400 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
            >
              <GripVertical className="h-5 w-5" />
            </button>

            <CardTitle className="flex-1 text-lg select-none">
              Câu hỏi {index + 1}
            </CardTitle>

            {/* Action buttons — onPointerDown stops DnD backend from swallowing events */}
            <div className="flex items-center gap-0.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onDuplicate}
                onPointerDown={(e) => e.stopPropagation()}
                title="Nhân đôi"
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onRemove}
                onPointerDown={(e) => e.stopPropagation()}
                title="Xóa câu hỏi"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>

              {/* ⋮ Move menu — DropdownMenuContent already portals itself; no extra DropdownMenuPortal needed */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label="Tùy chọn di chuyển"
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onSelect={onMoveToTop}
                    disabled={index === 0}
                  >
                    <ChevronsUp className="mr-2 h-4 w-4" />
                    Lên đầu danh sách
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={onMoveUp} disabled={index === 0}>
                    <ArrowUp className="mr-2 h-4 w-4" />
                    Lên một bước
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={onMoveDown}
                    disabled={index === total - 1}
                  >
                    <ArrowDown className="mr-2 h-4 w-4" />
                    Xuống một bước
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={onMoveToBottom}
                    disabled={index === total - 1}
                  >
                    <ChevronsDown className="mr-2 h-4 w-4" />
                    Xuống cuối danh sách
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={onOpenMoveToPosition}
                    disabled={total <= 1}
                  >
                    <Hash className="mr-2 h-4 w-4" />
                    Đến vị trí...
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Question text */}
          <div className="space-y-2">
            <Label htmlFor={`q-text-${question.id}`}>Nội dung câu hỏi *</Label>
            <Textarea
              id={`q-text-${question.id}`}
              value={question.text}
              onChange={(e) => onUpdate({ text: e.target.value })}
              placeholder="Nhập câu hỏi của bạn..."
              rows={2}
            />
          </div>

          {/* Question type */}
          <div className="space-y-2">
            <Label>Loại câu hỏi *</Label>
            <Select
              value={question.type}
              onValueChange={(v: QuestionType) => onTypeChange(v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="multiple_choice">Trắc nghiệm</SelectItem>
                <SelectItem value="text">Văn bản tự do</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Multiple-choice options */}
          {question.type === "multiple_choice" && question.options && (
            <div className="space-y-3">
              <Label>Lựa chọn</Label>
              {question.options.map((opt, optIdx) => (
                <div key={optIdx} className="flex gap-2">
                  <Input
                    value={opt}
                    onChange={(e) => onUpdateOption(optIdx, e.target.value)}
                    placeholder={`Lựa chọn ${optIdx + 1}`}
                  />
                  {question.options!.length > 2 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onRemoveOption(optIdx)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onAddOption}
              >
                <Plus className="mr-2 h-4 w-4" />
                Thêm lựa chọn
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Inner builder (needs to be inside DndProvider for useDragLayer) ───────
function SurveyBuilderInner() {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<SurveyDraft | null>(null);
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [moveDialog, setMoveDialog] = useState<{
    id: string;
    currentIndex: number;
  } | null>(null);

  // Drive auto-scroll from the global drag state
  const { isDraggingAny } = useDragLayer((monitor) => ({
    isDraggingAny: monitor.isDragging(),
  }));
  useAutoScroll(isDraggingAny);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
      return;
    }
    const raw = localStorage.getItem("surveyDraft");
    if (!raw) {
      toast.error("Không tìm thấy thông tin khảo sát");
      navigate("/customer/post");
      return;
    }
    try {
      setDraft(JSON.parse(raw));
    } catch {
      toast.error("Lỗi khi tải dữ liệu khảo sát");
      navigate("/customer/post");
    }
  }, [navigate]);

  // ── Reorder helpers ───────────────────────────────────────────────────────
  const reorderQuestions = useCallback((from: number, to: number) => {
    setQuestions((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  }, []);

  const highlightAndScroll = useCallback((id: string) => {
    setTimeout(() => {
      document
        .getElementById(`question-card-${id}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedId(id);
      setTimeout(() => setHighlightedId(null), 1500);
    }, 60);
  }, []);

  const moveQuestion = useCallback(
    (id: string, toIndex: number) => {
      setQuestions((prev) => {
        const fromIndex = prev.findIndex((q) => q.id === id);
        if (fromIndex === -1 || fromIndex === toIndex) return prev;
        const next = [...prev];
        const [item] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, item);
        return next;
      });
      highlightAndScroll(id);
    },
    [highlightAndScroll],
  );

  // ── CRUD helpers ──────────────────────────────────────────────────────────
  const addQuestion = () =>
    setQuestions((prev) => [
      ...prev,
      {
        id: `q_${Date.now()}`,
        text: "",
        type: "multiple_choice",
        options: ["", ""],
      },
    ]);

  const removeQuestion = (id: string) =>
    setQuestions((prev) => prev.filter((q) => q.id !== id));

  const duplicateQuestion = (id: string) =>
    setQuestions((prev) => {
      const idx = prev.findIndex((q) => q.id === id);
      if (idx === -1) return prev;
      const original = prev[idx];
      const copy: SurveyQuestion = {
        ...original,
        id: `q_${Date.now()}`,
        options: original.options ? [...original.options] : undefined,
      };
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });

  const updateQuestion = (id: string, updates: Partial<SurveyQuestion>) =>
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...updates } : q)),
    );

  const addOption = (id: string) =>
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === id && q.options ? { ...q, options: [...q.options, ""] } : q,
      ),
    );

  const removeOption = (id: string, optIdx: number) =>
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === id && q.options
          ? { ...q, options: q.options.filter((_, i) => i !== optIdx) }
          : q,
      ),
    );

  const updateOption = (id: string, optIdx: number, value: string) =>
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== id || !q.options) return q;
        const opts = [...q.options];
        opts[optIdx] = value;
        return { ...q, options: opts };
      }),
    );

  const handleTypeChange = (id: string, newType: QuestionType) =>
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== id) return q;
        if (newType === "multiple_choice" && !q.options)
          return { ...q, type: newType, options: ["", ""] };
        if (newType === "text") {
          const { options: _unused, ...rest } = q;
          return { ...rest, type: newType };
        }
        return { ...q, type: newType };
      }),
    );

  // ── Validate + Save ───────────────────────────────────────────────────────
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
        const valid = (q.options ?? []).filter((o) => o.trim());
        if (valid.length < 2) {
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
    if (!validate()) return;
    try {
      createSurvey({
        title: draft.title,
        description: draft.description,
        surveyType: "internal",
        surveyLink: "",
        internalQuestions: questions,
        package: draft.package,
        deadline: draft.deadline,
        targetCompletions: parseInt(draft.targetCompletions),
        customerId: draft.customerId,
        customerName: draft.customerName,
      });
      localStorage.removeItem("surveyDraft");
      toast.success("Đã tạo khảo sát thành công!");
      window.dispatchEvent(new Event("storage"));
      navigate("/customer/dashboard");
    } catch (error) {
      toast.error("Không thể tạo khảo sát");
      console.error(err);
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
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          onClick={() => navigate("/customer/post")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
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
          <CardDescription>Thêm câu hỏi cho khảo sát của bạn.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {questions.length === 0 && (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
              <p className="text-gray-600 mb-4">Chưa có câu hỏi nào</p>
              <Button
                onClick={addQuestion}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Thêm câu hỏi đầu tiên
              </Button>
            </div>
          )}

          {/* Card list — select-none prevents text selection while dragging */}
          <div className={`space-y-4 ${isDraggingAny ? "select-none" : ""}`}>
            <AnimatePresence initial={false}>
              {questions.map((question, index) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  index={index}
                  total={questions.length}
                  isHighlighted={highlightedId === question.id}
                  onReorder={reorderQuestions}
                  onMoveUp={() => moveQuestion(question.id, index - 1)}
                  onMoveDown={() => moveQuestion(question.id, index + 1)}
                  onMoveToTop={() => moveQuestion(question.id, 0)}
                  onMoveToBottom={() =>
                    moveQuestion(question.id, questions.length - 1)
                  }
                  onOpenMoveToPosition={() =>
                    setMoveDialog({ id: question.id, currentIndex: index })
                  }
                  onRemove={() => removeQuestion(question.id)}
                  onDuplicate={() => duplicateQuestion(question.id)}
                  onUpdate={(updates) => updateQuestion(question.id, updates)}
                  onAddOption={() => addOption(question.id)}
                  onRemoveOption={(optIdx) => removeOption(question.id, optIdx)}
                  onUpdateOption={(optIdx, val) =>
                    updateOption(question.id, optIdx, val)
                  }
                  onTypeChange={(type) => handleTypeChange(question.id, type)}
                />
              ))}
            </AnimatePresence>
          </div>

          {questions.length > 0 && (
            <Button
              onClick={addQuestion}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Thêm câu hỏi
            </Button>
          )}

          {/* Save / Cancel */}
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

      {/* Move-to-Position dialog */}
      <MoveToPositionDialog
        open={moveDialog !== null}
        currentPosition={moveDialog ? moveDialog.currentIndex + 1 : 1}
        total={questions.length}
        onClose={() => setMoveDialog(null)}
        onMove={(targetPos) => {
          if (!moveDialog) return;
          const toIndex = targetPos - 1;
          const fromIndex = questions.findIndex((q) => q.id === moveDialog.id);
          setMoveDialog(null);
          if (fromIndex !== -1 && fromIndex !== toIndex) {
            reorderQuestions(fromIndex, toIndex);
            highlightAndScroll(moveDialog.id);
          }
        }}
      />
    </div>
  );
}

// ─── Public export — wraps inner component with DndProvider ────────────────
export function SurveyBuilder() {
  return (
    <DndProvider backend={HTML5Backend}>
      <SurveyBuilderInner />
    </DndProvider>
  );
}
