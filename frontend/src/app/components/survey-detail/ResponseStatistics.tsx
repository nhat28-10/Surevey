import { HelperResponse } from './types';
import { computeStats, formatTime } from './mockData';
import { Card, CardContent } from '../ui/card';
import { Timer, Activity, Zap, AlarmClock } from 'lucide-react';

interface ResponseStatisticsProps {
  responses: HelperResponse[];
}

interface TimeCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  iconColor: string;
}

function TimeCard({ icon, label, value, iconColor }: TimeCardProps) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 ${iconColor}`}>{icon}</div>
          <div>
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-xl font-bold text-gray-900">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ResponseStatistics({ responses }: ResponseStatisticsProps) {
  const stats = computeStats(responses);

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-3">Thống kê thời gian hoàn thành</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <TimeCard
          icon={<Activity className="w-5 h-5" />}
          label="Thời gian trung bình"
          value={formatTime(stats.avg)}
          iconColor="text-blue-600"
        />
        <TimeCard
          icon={<Timer className="w-5 h-5" />}
          label="Thời gian trung vị"
          value={formatTime(stats.median)}
          iconColor="text-purple-600"
        />
        <TimeCard
          icon={<Zap className="w-5 h-5" />}
          label="Nhanh nhất"
          value={formatTime(stats.fastest)}
          iconColor="text-green-600"
        />
        <TimeCard
          icon={<AlarmClock className="w-5 h-5" />}
          label="Chậm nhất"
          value={formatTime(stats.slowest)}
          iconColor="text-orange-600"
        />
      </div>
    </div>
  );
}
