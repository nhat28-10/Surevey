// Model: Support & FAQ Data Types

export enum TicketCategory {
  LOGIN = 'login',
  SURVEY_JOIN = 'survey_join',
  REWARD = 'reward',
  OTHER = 'other'
}

export enum DisputeType {
  NO_REWARD = 'no_reward',
  SURVEY_PROBLEM = 'survey_problem',
  SUSPECTED_FRAUD = 'suspected_fraud'
}

export enum TicketStatus {
  PROCESSING = 'processing',
  RESOLVED = 'resolved'
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  category: TicketCategory;
  description: string;
  email: string;
  status: TicketStatus;
  createdAt: string;
  resolvedAt?: string;
}

export interface DisputeTicket {
  id: string;
  userId: string;
  userName: string;
  surveyName: string;
  disputeType: DisputeType;
  description: string;
  email: string;
  status: TicketStatus;
  createdAt: string;
  resolvedAt?: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface FAQCategory {
  id: string;
  title: string;
  icon: string;
  items: FAQItem[];
}

export const TICKET_CATEGORY_LABELS: Record<TicketCategory, string> = {
  [TicketCategory.LOGIN]: 'Vấn đề đăng nhập',
  [TicketCategory.SURVEY_JOIN]: 'Không thể tham gia khảo sát',
  [TicketCategory.REWARD]: 'Vấn đề phần thưởng',
  [TicketCategory.OTHER]: 'Khác'
};

export const DISPUTE_TYPE_LABELS: Record<DisputeType, string> = {
  [DisputeType.NO_REWARD]: 'Không nhận được phần thưởng',
  [DisputeType.SURVEY_PROBLEM]: 'Vấn đề về khảo sát',
  [DisputeType.SUSPECTED_FRAUD]: 'Nghi ngờ gian lận'
};

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  [TicketStatus.PROCESSING]: 'Đang xử lý',
  [TicketStatus.RESOLVED]: 'Đã giải quyết'
};
