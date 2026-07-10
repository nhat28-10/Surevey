import { Survey } from '../../types/survey';
import { HelperResponse, QuestionAnswer, ChartDataPoint, ResponseStats } from './types';

const FIRST_NAMES = ['An', 'Bảo', 'Chi', 'Dũng', 'Giang', 'Hà', 'Hải', 'Hoa', 'Hùng', 'Khánh', 'Lan', 'Linh', 'Minh', 'Nam', 'Ngân', 'Như', 'Phong', 'Quân', 'Tâm', 'Thảo', 'Thu', 'Trang', 'Trinh', 'Tuấn', 'Vy'];
const LAST_NAMES = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Phan', 'Vũ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý'];
const DEVICES: ('Desktop' | 'Mobile' | 'Tablet')[] = [
  'Desktop', 'Desktop', 'Desktop', 'Desktop', 'Desktop', 'Desktop',
  'Mobile', 'Mobile', 'Mobile',
  'Tablet',
];
const BROWSERS = ['Chrome', 'Chrome', 'Chrome', 'Chrome', 'Chrome', 'Chrome', 'Safari', 'Safari', 'Firefox', 'Edge'];
const COUNTRIES = [
  'Việt Nam', 'Việt Nam', 'Việt Nam', 'Việt Nam', 'Việt Nam', 'Việt Nam', 'Việt Nam', 'Việt Nam',
  'USA', 'Nhật Bản', 'Singapore', 'Hàn Quốc', 'Úc',
];
const TEXT_ANSWERS = [
  'Sản phẩm rất tốt và đáp ứng nhu cầu của tôi.',
  'Tôi hài lòng với chất lượng dịch vụ.',
  'Cần cải thiện thêm một số tính năng.',
  'Trải nghiệm sử dụng khá tốt và thuận tiện.',
  'Giao diện thân thiện và dễ sử dụng.',
  'Tôi sẽ giới thiệu sản phẩm này cho bạn bè.',
  'Cần thêm nhiều tùy chọn hơn.',
  'Giá cả hợp lý so với chất lượng nhận được.',
  'Dịch vụ hỗ trợ phản hồi rất nhanh.',
  'Tốc độ xử lý cần được cải thiện.',
  'Rất hữu ích cho công việc hàng ngày của tôi.',
  'Chất lượng dịch vụ vượt quá mong đợi.',
];

const DEFAULT_QUESTIONS = [
  { id: 'dq1', text: 'Bạn đánh giá tổng thể trải nghiệm như thế nào?', type: 'multiple_choice' as const, options: ['Rất tốt', 'Tốt', 'Bình thường', 'Kém'] },
  { id: 'dq2', text: 'Mức độ hài lòng của bạn với dịch vụ?', type: 'multiple_choice' as const, options: ['Rất hài lòng', 'Hài lòng', 'Trung lập', 'Không hài lòng'] },
  { id: 'dq3', text: 'Bạn có muốn giới thiệu cho người khác không?', type: 'multiple_choice' as const, options: ['Chắc chắn có', 'Có thể', 'Không chắc', 'Không'] },
  { id: 'dq4', text: 'Chia sẻ thêm ý kiến của bạn.', type: 'text' as const, options: [] },
];

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

function seededChoice<T>(arr: T[], seed: number): T {
  return arr[Math.floor(seededRandom(seed) * arr.length)];
}

function seededRange(min: number, max: number, seed: number): number {
  return min + seededRandom(seed) * (max - min);
}

export function generateMockResponses(survey: Survey): HelperResponse[] {
  const baseHash = hashCode(survey.id);
  const startDate = new Date(survey.createdAt).getTime();
  const endDate = Math.min(Date.now(), new Date(survey.deadline).getTime());
  const questions = survey.internalQuestions && survey.internalQuestions.length > 0
    ? survey.internalQuestions
    : DEFAULT_QUESTIONS;

  return Array.from({ length: survey.completedCount }, (_, i) => {
    const seed = baseHash + i * 137 + 1000;
    const lastName = seededChoice(LAST_NAMES, seed + 1);
    const firstName = seededChoice(FIRST_NAMES, seed + 2);
    const name = `${lastName} ${firstName}`;
    const emailPrefix = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(seededRandom(seed + 3) * 99 + 1)}`;
    const email = `${emailPrefix.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D')}@gmail.com`;
    const completedAt = new Date(startDate + seededRandom(seed + 4) * (endDate - startDate)).toISOString();
    const estimatedSecs = survey.estimatedTime * 60;
    const rawMinutes = seededRange(estimatedSecs * 0.4, estimatedSecs * 1.5, seed + 5) / 60;
    const completionTimeMinutes = Math.max(0.5, Math.round(rawMinutes * 10) / 10);

    const answers: QuestionAnswer[] = questions.map((q, qi) => {
      const qSeed = seed + qi * 71 + 500;
      let answer: string;
      if (q.type === 'multiple_choice' && q.options && q.options.length > 0) {
        answer = seededChoice(q.options, qSeed);
      } else {
        answer = seededChoice(TEXT_ANSWERS, qSeed);
      }
      return {
        questionId: q.id,
        questionText: q.text,
        questionType: q.type,
        answer,
        timeSpentSeconds: Math.max(5, Math.floor(seededRange(8, estimatedSecs / Math.max(1, questions.length) * 2.5, qSeed + 1))),
      };
    });

    return {
      id: `response_${survey.id}_${i}`,
      helperId: `helper_${baseHash + i}`,
      helperName: name,
      email,
      completedAt,
      completionTimeMinutes,
      device: seededChoice(DEVICES, seed + 6),
      browser: seededChoice(BROWSERS, seed + 7),
      country: seededChoice(COUNTRIES, seed + 8),
      answers,
    };
  });
}

export function computeStats(responses: HelperResponse[]): ResponseStats {
  if (responses.length === 0) return { avg: 0, median: 0, fastest: 0, slowest: 0 };
  const times = responses.map(r => r.completionTimeMinutes).sort((a, b) => a - b);
  const avg = times.reduce((s, t) => s + t, 0) / times.length;
  const mid = Math.floor(times.length / 2);
  const median = times.length % 2 === 0 ? (times[mid - 1] + times[mid]) / 2 : times[mid];
  return { avg, median, fastest: times[0], slowest: times[times.length - 1] };
}

export function computeDeviceBreakdown(responses: HelperResponse[]): ChartDataPoint[] {
  const counts: Record<string, number> = {};
  responses.forEach(r => { counts[r.device] = (counts[r.device] || 0) + 1; });
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
}

export function computeBrowserBreakdown(responses: HelperResponse[]): ChartDataPoint[] {
  const counts: Record<string, number> = {};
  responses.forEach(r => { counts[r.browser] = (counts[r.browser] || 0) + 1; });
  return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

export function computeCountryBreakdown(responses: HelperResponse[]): ChartDataPoint[] {
  const counts: Record<string, number> = {};
  responses.forEach(r => { counts[r.country] = (counts[r.country] || 0) + 1; });
  return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

export function formatTime(minutes: number): string {
  const mins = Math.floor(minutes);
  const secs = Math.round((minutes - mins) * 60);
  if (mins === 0) return `${secs}s`;
  if (secs === 0) return `${mins}p`;
  return `${mins}p ${secs}s`;
}
