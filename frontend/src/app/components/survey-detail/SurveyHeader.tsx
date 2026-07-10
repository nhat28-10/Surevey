import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { Survey, SurveyStatus } from '../../types/survey';
import { Card, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { ChevronLeft, Pencil, XCircle, Trash2 } from 'lucide-react';
import { updateSurvey, cancelSurvey, deleteSurvey } from '../../services/surveyService';
import { getCurrentUser } from '../../services/authService';
import { toast } from 'sonner';

const STATUS_COLORS: Record<SurveyStatus, string> = {
  [SurveyStatus.OPEN]: 'bg-green-500',
  [SurveyStatus.IN_PROGRESS]: 'bg-blue-500',
  [SurveyStatus.COMPLETED]: 'bg-gray-500',
  [SurveyStatus.CANCELLED]: 'bg-red-500',
};

interface SurveyHeaderProps {
  survey: Survey;
  onUpdate: (survey: Survey) => void;
}

export function SurveyHeader({ survey, onUpdate }: SurveyHeaderProps) {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [editing, setEditing] = useState<{ title: string; description: string } | null>(null);

  const handleEditSave = () => {
    if (!editing) return;
    const updated = updateSurvey(survey.id, { title: editing.title, description: editing.description });
    if (updated) {
      onUpdate(updated);
      toast.success('Đã cập nhật khảo sát');
      setEditing(null);
      window.dispatchEvent(new Event('storage'));
    }
  };

  const handleCancel = () => {
    if (!currentUser) return;
    const result = cancelSurvey(survey.id, currentUser.id);
    if (result) {
      onUpdate(result);
      toast.success('Đã hủy khảo sát');
      window.dispatchEvent(new Event('storage'));
    } else {
      toast.error('Không thể hủy khảo sát này');
    }
  };

  const handleDelete = () => {
    if (!currentUser || !window.confirm('Bạn có chắc chắn muốn xóa khảo sát này?')) return;
    const result = deleteSurvey(survey.id, currentUser.id);
    if (result) {
      toast.success('Đã xóa khảo sát');
      window.dispatchEvent(new Event('storage'));
      navigate('/owner/dashboard');
    } else {
      toast.error('Không thể xóa khảo sát');
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link to="/owner/dashboard" className="hover:text-gray-900 flex items-center gap-1 transition-colors">
          <ChevronLeft className="w-4 h-4" />
          Bảng điều khiển
        </Link>
        <span>/</span>
        <span className="text-gray-900 truncate max-w-xs">{survey.title}</span>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <CardTitle className="text-2xl">{survey.title}</CardTitle>
                <Badge className={STATUS_COLORS[survey.status]}>{survey.status}</Badge>
              </div>
              <CardDescription className="text-base mt-1">{survey.description}</CardDescription>
            </div>

            <div className="flex flex-wrap gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditing({ title: survey.title, description: survey.description })}
              >
                <Pencil className="w-4 h-4 mr-1" />
                Sửa
              </Button>
              {survey.status === SurveyStatus.OPEN && (
                <Button
                  size="sm"
                  className="bg-yellow-500 hover:bg-yellow-600 text-white"
                  onClick={handleCancel}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Hủy
                </Button>
              )}
              <Button size="sm" variant="destructive" onClick={handleDelete}>
                <Trash2 className="w-4 h-4 mr-1" />
                Xóa
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Dialog open={editing !== null} onOpenChange={(open) => { if (!open) setEditing(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa khảo sát</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="sd-edit-title">Tên khảo sát</Label>
              <Input
                id="sd-edit-title"
                value={editing?.title ?? ''}
                onChange={(e) => setEditing(prev => prev ? { ...prev, title: e.target.value } : prev)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="sd-edit-desc">Mô tả</Label>
              <Textarea
                id="sd-edit-desc"
                rows={4}
                value={editing?.description ?? ''}
                onChange={(e) => setEditing(prev => prev ? { ...prev, description: e.target.value } : prev)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Hủy</Button>
            <Button onClick={handleEditSave}>Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
