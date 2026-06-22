// Model: Survey Data Types

export enum SurveyStatus {
  OPEN = 'Open',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled'
}

export enum SurveyPackage {
  PACKAGE_1 = 'package_1',
  PACKAGE_2 = 'package_2',
  PACKAGE_3 = 'package_3'
}

export type SurveyType = 'external' | 'internal';

export type QuestionType = 'multiple_choice' | 'text';

export interface SurveyQuestion {
  id: string;
  text: string;
  type: QuestionType;
  options?: string[]; // Only for multiple choice
}

export interface PackageInfo {
  id: SurveyPackage;
  name: string;
  description: string;
  pricePerResponse: number; // in VND
  maxQuestions: string;
  timeLimit: number; // in minutes
}

export const SURVEY_PACKAGES: PackageInfo[] = [
  {
    id: SurveyPackage.PACKAGE_1,
    name: 'Gói 1',
    description: 'Dưới 10 câu hỏi',
    pricePerResponse: 1000,
    maxQuestions: '< 10 câu hỏi',
    timeLimit: 3
  },
  {
    id: SurveyPackage.PACKAGE_2,
    name: 'Gói 2',
    description: 'Từ 10 đến 20 câu hỏi',
    pricePerResponse: 1500,
    maxQuestions: '10-20 câu hỏi',
    timeLimit: 7
  },
  {
    id: SurveyPackage.PACKAGE_3,
    name: 'Gói 3',
    description: 'Trên 20 câu hỏi',
    pricePerResponse: 2000,
    maxQuestions: '> 20 câu hỏi',
    timeLimit: 10
  }
];

export interface Survey {
  id: string;
  title: string;
  description: string;
  surveyType: SurveyType;
  surveyLink: string; // For external surveys
  internalQuestions?: SurveyQuestion[]; // For internal surveys
  package: SurveyPackage;
  estimatedTime: number; // in minutes (based on package)
  reward: number; // payment amount (based on package)
  deadline: string; // ISO date string
  status: SurveyStatus;
  ownerId: string;
  ownerName: string;
  createdAt: string;
  completedCount: number;
  targetCompletions: number;
  acceptedBy?: string[]; // Helper IDs who accepted
}

export interface SurveyFilters {
  minReward?: number;
  maxReward?: number;
  maxTime?: number;
  sortBy?: 'reward' | 'time' | 'deadline';
}

export type UserRole = 'owner' | 'helper';