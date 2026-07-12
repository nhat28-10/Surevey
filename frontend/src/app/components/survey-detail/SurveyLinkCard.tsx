import { Survey } from '../../types/survey';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { ExternalLink, Eye } from 'lucide-react';

export function SurveyLinkCard({ survey }: { survey: Survey }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Liên kết khảo sát</CardTitle>
      </CardHeader>
      <CardContent>
        {survey.surveyType === 'external' ? (
          <a href={survey.surveyLink} target="_blank" rel="noopener noreferrer">
            <Button variant="outline">
              <ExternalLink className="w-4 h-4 mr-2" />
              Mở khảo sát ngoài
            </Button>
          </a>
        ) : (
          <Button variant="outline" disabled>
            <Eye className="w-4 h-4 mr-2" />
            Xem trước (khảo sát nội bộ)
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
