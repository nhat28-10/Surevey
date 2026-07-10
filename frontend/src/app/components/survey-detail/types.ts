export interface HelperResponse {
  id: string;
  helperId: string;
  helperName: string;
  email: string;
  completedAt: string;
  completionTimeMinutes: number;
  device: 'Desktop' | 'Mobile' | 'Tablet';
  browser: string;
  country: string;
  answers: QuestionAnswer[];
}

export interface QuestionAnswer {
  questionId: string;
  questionText: string;
  questionType: 'multiple_choice' | 'text';
  answer: string;
  timeSpentSeconds: number;
}

export type SortOption = 'newest' | 'oldest' | 'fastest' | 'slowest';

export interface TableFilters {
  search: string;
  sortBy: SortOption;
  dateFrom: string;
  dateTo: string;
  minTime: string;
  maxTime: string;
}

export interface ChartDataPoint {
  name: string;
  value: number;
}

export interface ResponseStats {
  avg: number;
  median: number;
  fastest: number;
  slowest: number;
}
