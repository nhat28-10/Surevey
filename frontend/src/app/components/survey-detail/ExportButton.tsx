import * as XLSX from 'xlsx';
import { Survey } from '../../types/survey';
import { HelperResponse } from './types';
import { Button } from '../ui/button';
import { Download } from 'lucide-react';

interface ExportButtonProps {
  survey: Survey;
  responses: HelperResponse[];
}

export function ExportButton({ survey, responses }: ExportButtonProps) {
  const handleExport = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Summary
    const pct = Math.round((survey.completedCount / survey.targetCompletions) * 100);
    const avgTime = responses.length
      ? responses.reduce((s, r) => s + r.completionTimeMinutes, 0) / responses.length
      : 0;
    const sortedTimes = [...responses].sort((a, b) => a.completionTimeMinutes - b.completionTimeMinutes);
    const mid = Math.floor(sortedTimes.length / 2);
    const medianTime = sortedTimes.length % 2 === 0
      ? ((sortedTimes[mid - 1]?.completionTimeMinutes ?? 0) + (sortedTimes[mid]?.completionTimeMinutes ?? 0)) / 2
      : (sortedTimes[mid]?.completionTimeMinutes ?? 0);

    const summaryRows = [
      ['Thông tin khảo sát'],
      ['Tên', survey.title],
      ['Mô tả', survey.description],
      ['Trạng thái', survey.status],
      ['Loại', survey.surveyType === 'external' ? 'Ngoài' : 'Nội bộ'],
      ['Ngày tạo', new Date(survey.createdAt).toLocaleDateString('vi-VN')],
      ['Hạn chót', new Date(survey.deadline).toLocaleDateString('vi-VN')],
      [],
      ['Thống kê'],
      ['Phần thưởng / người (đ)', survey.reward],
      ['Thời lượng dự kiến (phút)', survey.estimatedTime],
      ['Mục tiêu phản hồi', survey.targetCompletions],
      ['Đã hoàn thành', survey.completedCount],
      ['Đã chấp nhận', survey.acceptedBy?.length ?? 0],
      ['Còn lại', Math.max(0, survey.targetCompletions - survey.completedCount)],
      ['Tỷ lệ hoàn thành (%)', pct],
      [],
      ['Chỉ số thời gian hoàn thành'],
      ['Trung bình (phút)', avgTime.toFixed(2)],
      ['Trung vị (phút)', medianTime.toFixed(2)],
      ['Nhanh nhất (phút)', (sortedTimes[0]?.completionTimeMinutes ?? 0).toFixed(2)],
      ['Chậm nhất (phút)', (sortedTimes[sortedTimes.length - 1]?.completionTimeMinutes ?? 0).toFixed(2)],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryRows), 'Tóm tắt');

    // Sheet 2: Participants
    const participantHeaders = ['Họ tên', 'Email', 'Hoàn thành lúc', 'Thời gian (phút)', 'Thiết bị', 'Trình duyệt', 'Quốc gia'];
    const participantRows = responses.map(r => [
      r.helperName,
      r.email,
      new Date(r.completedAt).toLocaleString('vi-VN'),
      r.completionTimeMinutes.toFixed(1),
      r.device,
      r.browser,
      r.country,
    ]);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([participantHeaders, ...participantRows]), 'Người tham gia');

    // Sheet 3: Responses
    const responseHeaders = ['Họ tên', 'Email', 'Câu hỏi', 'Loại', 'Câu trả lời', 'T. gian (giây)', 'Hoàn thành lúc'];
    const responseRows = responses.flatMap(r =>
      r.answers.map(a => [
        r.helperName,
        r.email,
        a.questionText,
        a.questionType === 'multiple_choice' ? 'Trắc nghiệm' : 'Văn bản',
        a.answer,
        a.timeSpentSeconds,
        new Date(r.completedAt).toLocaleString('vi-VN'),
      ])
    );
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([responseHeaders, ...responseRows]), 'Câu trả lời');

    // Sheet 4: Statistics
    const deviceCounts: Record<string, number> = {};
    const browserCounts: Record<string, number> = {};
    const countryCounts: Record<string, number> = {};
    responses.forEach(r => {
      deviceCounts[r.device] = (deviceCounts[r.device] || 0) + 1;
      browserCounts[r.browser] = (browserCounts[r.browser] || 0) + 1;
      countryCounts[r.country] = (countryCounts[r.country] || 0) + 1;
    });

    const statsRows = [
      ['Thiết bị'],
      ['Thiết bị', 'Số lượng'],
      ...Object.entries(deviceCounts),
      [],
      ['Trình duyệt'],
      ['Trình duyệt', 'Số lượng'],
      ...Object.entries(browserCounts),
      [],
      ['Quốc gia / Khu vực'],
      ['Quốc gia', 'Số lượng'],
      ...Object.entries(countryCounts).sort((a, b) => b[1] - a[1]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(statsRows), 'Thống kê');

    const safeName = survey.title.replace(/[\\/:*?"<>|]/g, '_').slice(0, 50);
    XLSX.writeFile(wb, `${safeName}_export.xlsx`);
  };

  return (
    <Button onClick={handleExport} className="bg-green-600 hover:bg-green-700 text-white">
      <Download className="w-4 h-4 mr-2" />
      Xuất Excel
    </Button>
  );
}
