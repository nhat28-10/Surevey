import { Survey } from '../../types/survey';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import {
  DollarSign, Clock, Calendar, Users, CheckCircle2,
  Target, TrendingUp, Hourglass,
} from 'lucide-react';

interface SurveySummaryCardsProps {
  survey: Survey;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  iconColor?: string;
}

function StatCard({ icon, label, value, iconColor = 'text-gray-600' }: StatCardProps) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 ${iconColor}`}>{icon}</div>
          <div className="min-w-0">
            <p className="text-xs text-gray-500 truncate">{label}</p>
            <p className="font-semibold text-gray-900 truncate">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function SurveySummaryCards({ survey }: SurveySummaryCardsProps) {
  const remaining = survey.targetCompletions - survey.completedCount;
  const pct = Math.round((survey.completedCount / survey.targetCompletions) * 100);
  const createdDate = new Date(survey.createdAt).toLocaleDateString('vi-VN');
  const deadlineDate = new Date(survey.deadline).toLocaleDateString('vi-VN');

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          icon={<DollarSign className="w-5 h-5" />}
          label="Phần thưởng / người"
          value={`${survey.reward.toLocaleString('vi-VN')} đ`}
          iconColor="text-green-600"
        />
        <StatCard
          icon={<Clock className="w-5 h-5" />}
          label="Thời lượng dự kiến"
          value={`${survey.estimatedTime} phút`}
          iconColor="text-blue-600"
        />
        <StatCard
          icon={<Calendar className="w-5 h-5" />}
          label="Hạn chót"
          value={deadlineDate}
          iconColor="text-purple-600"
        />
        <StatCard
          icon={<Target className="w-5 h-5" />}
          label="Mục tiêu"
          value={`${survey.targetCompletions} phản hồi`}
          iconColor="text-orange-600"
        />
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="Đã chấp nhận"
          value={survey.acceptedBy?.length || 0}
          iconColor="text-cyan-600"
        />
        <StatCard
          icon={<CheckCircle2 className="w-5 h-5" />}
          label="Đã hoàn thành"
          value={survey.completedCount}
          iconColor="text-green-600"
        />
        <StatCard
          icon={<Hourglass className="w-5 h-5" />}
          label="Còn lại"
          value={remaining < 0 ? 0 : remaining}
          iconColor="text-yellow-600"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Tỷ lệ hoàn thành"
          value={`${pct}%`}
          iconColor="text-indigo-600"
        />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Tiến độ hoàn thành</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">
              {survey.completedCount} / {survey.targetCompletions} phản hồi
            </span>
            <span className="font-semibold">{pct}%</span>
          </div>
          <Progress value={pct} className="h-3" />
          <div className="flex justify-between text-xs text-gray-400">
            <span>Tạo lúc: {createdDate}</span>
            <span>Hạn: {deadlineDate}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
