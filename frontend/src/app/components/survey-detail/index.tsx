import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { Survey } from '../../types/survey';
import { getSurveyById } from '../../services/surveyService';
import { isAuthenticated } from '../../services/authService';
import { generateMockResponses } from './mockData';
import { HelperResponse } from './types';
import { SurveyHeader } from './SurveyHeader';
import { SurveySummaryCards } from './SurveySummaryCards';
import { SurveyLinkCard } from './SurveyLinkCard';
import { ResponseStatistics } from './ResponseStatistics';
import { ResponseCharts } from './ResponseCharts';
import { ParticipantsTable } from './ParticipantsTable';
import { ResponseDrawer } from './ResponseDrawer';
import { ExportButton } from './ExportButton';
import { Skeleton } from '../ui/skeleton';
import { Button } from '../ui/button';

export function SurveyDetailPage() {
  const { surveyId } = useParams<{ surveyId: string }>();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState<Survey | null | undefined>(undefined);
  const [selectedResponse, setSelectedResponse] = useState<HelperResponse | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    if (surveyId) {
      const found = getSurveyById(surveyId);
      setSurvey(found ?? null);
    } else {
      setSurvey(null);
    }
  }, [surveyId, navigate]);

  const responses = useMemo(() => {
    if (!survey) return [];
    return generateMockResponses(survey);
  }, [survey]);

  if (survey === undefined) return <PageSkeleton />;
  if (survey === null) return <NotFound />;

  return (
    <div className="space-y-6 pb-16">
      <SurveyHeader survey={survey} onUpdate={setSurvey} />
      <SurveySummaryCards survey={survey} />
      <SurveyLinkCard survey={survey} />

      {responses.length > 0 ? (
        <>
          <ResponseStatistics responses={responses} />
          <ResponseCharts responses={responses} />

          <div className="flex justify-end">
            <ExportButton survey={survey} responses={responses} />
          </div>

          <ParticipantsTable responses={responses} onViewAnswers={setSelectedResponse} />
        </>
      ) : (
        <EmptyState />
      )}

      <ResponseDrawer
        response={selectedResponse}
        open={selectedResponse !== null}
        onClose={() => setSelectedResponse(null)}
      />
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-5 w-56" />
      <Skeleton className="h-28 w-full" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
      </div>
      <Skeleton className="h-12 w-full" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-center">
      <p className="text-xl font-semibold text-gray-700">Không tìm thấy khảo sát</p>
      <p className="text-gray-500">Khảo sát không tồn tại hoặc đã bị xóa.</p>
      <Button asChild variant="outline">
        <Link to="/owner/dashboard">Quay lại bảng điều khiển</Link>
      </Button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center rounded-lg border border-dashed">
      <p className="text-lg font-semibold text-gray-700">Chưa có phản hồi</p>
      <p className="text-gray-500 mt-1 max-w-sm">
        Khi có người tham gia hoàn thành khảo sát, thống kê và kết quả sẽ xuất hiện ở đây.
      </p>
    </div>
  );
}
