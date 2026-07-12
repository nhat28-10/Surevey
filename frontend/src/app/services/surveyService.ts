// Controller: Survey Service for business logic and data management

import {
  Survey,
  SurveyStatus,
  SurveyFilters,
  SurveyPackage,
  SURVEY_PACKAGES,
  FinishedEntry,
} from "../types/survey";
import { getCurrentUser as getAuthUser } from "./authService";

const STORAGE_KEY = "sureVey_surveys";

// Get current user from auth service
export const getCurrentUser = () => {
  return getAuthUser();
};

// Get all surveys from localStorage
export const getAllSurveys = (): Survey[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return getSampleSurveys();
  }
  return JSON.parse(stored);
};

// Save surveys to localStorage
const saveSurveys = (surveys: Survey[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(surveys));
};

// Create a new survey
export const createSurvey = (
  surveyData: Omit<
    Survey,
    | "id"
    | "createdAt"
    | "status"
    | "completedCount"
    | "acceptedBy"
    | "completedByHelperIds"
    | "estimatedTime"
    | "reward"
  >,
): Survey => {
  const surveys = getAllSurveys();

  // Get package info to set estimatedTime and reward
  const packageInfo = SURVEY_PACKAGES.find((p) => p.id === surveyData.package);
  if (!packageInfo) {
    throw new Error("Invalid package selected");
  }

  const newSurvey: Survey = {
    ...surveyData,
    id: `survey_${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: SurveyStatus.OPEN,
    completedCount: 0,
    acceptedBy: [],
    completedByHelperIds: [],
    estimatedTime: packageInfo.timeLimit,
    reward: packageInfo.pricePerResponse,
  };
  surveys.push(newSurvey);
  saveSurveys(surveys);
  return newSurvey;
};

// Get surveys by customer
export const getSurveysByCustomer = (customerId: string): Survey[] => {
  const surveys = getAllSurveys();
  return surveys.filter((survey) => survey.customerId === customerId);
};

// Get open surveys for helpers
// helperId: if provided, surveys this helper has already completed are excluded
export const getOpenSurveys = (
  filters?: SurveyFilters,
  helperId?: string,
): Survey[] => {
  let surveys = getAllSurveys().filter((survey) => {
    const isAcceptingResponses =
      (survey.status === SurveyStatus.OPEN ||
        survey.status === SurveyStatus.IN_PROGRESS) &&
      survey.completedCount < survey.targetCompletions;

    if (!isAcceptingResponses) return false;

    if (helperId && (survey.completedByHelperIds ?? []).includes(helperId))
      return false;

    return true;
  });

  // Apply filters
  if (filters) {
    if (filters.minReward !== undefined) {
      surveys = surveys.filter((s) => s.reward >= filters.minReward!);
    }
    if (filters.maxReward !== undefined) {
      surveys = surveys.filter((s) => s.reward <= filters.maxReward!);
    }
    if (filters.maxTime !== undefined) {
      surveys = surveys.filter((s) => s.estimatedTime <= filters.maxTime!);
    }

    // Sort
    if (filters.sortBy === "reward") {
      surveys.sort((a, b) => b.reward - a.reward);
    } else if (filters.sortBy === "time") {
      surveys.sort((a, b) => a.estimatedTime - b.estimatedTime);
    } else if (filters.sortBy === "deadline") {
      surveys.sort(
        (a, b) =>
          new Date(a.deadline).getTime() - new Date(b.deadline).getTime(),
      );
    }
  }

  return surveys;
};

// Get survey by ID
export const getSurveyById = (id: string): Survey | undefined => {
  const surveys = getAllSurveys();
  return surveys.find((survey) => survey.id === id);
};

// Update survey
export const updateSurvey = (
  id: string,
  updates: Partial<Survey>,
): Survey | null => {
  const surveys = getAllSurveys();
  const index = surveys.findIndex((survey) => survey.id === id);
  if (index === -1) return null;

  surveys[index] = { ...surveys[index], ...updates };
  saveSurveys(surveys);
  return surveys[index];
};

// Accept survey (collaborator side)
export const acceptSurvey = (
  surveyId: string,
  collaboratorId: string,
): Survey | null => {
  const survey = getSurveyById(surveyId);
  if (!survey) return null;

  const acceptedBy = survey.acceptedBy || [];
  if (!acceptedBy.includes(collaboratorId)) {
    acceptedBy.push(collaboratorId);
    return updateSurvey(surveyId, {
      acceptedBy,
      status: SurveyStatus.IN_PROGRESS,
    });
  }
  return survey;
};

// Mark survey as completed by a specific helper
// The survey only becomes globally COMPLETED when completedCount reaches targetCompletions.
// Until then it stays OPEN or IN_PROGRESS so other helpers can still see and complete it.
export const completeSurvey = (
  surveyId: string,
  helperId?: string,
): Survey | null => {
  const survey = getSurveyById(surveyId);
  if (!survey) return null;

  const newCompletedCount = survey.completedCount + 1;
  const newStatus =
    newCompletedCount >= survey.targetCompletions
      ? SurveyStatus.COMPLETED
      : SurveyStatus.IN_PROGRESS;

  const completedByHelperIds = [...(survey.completedByHelperIds ?? [])];
  if (helperId && !completedByHelperIds.includes(helperId)) {
    completedByHelperIds.push(helperId);
  }

  return updateSurvey(surveyId, {
    completedCount: newCompletedCount,
    status: newStatus,
    completedByHelperIds,
  });
};

// Cancel survey (customer side)
export const cancelSurvey = (
  surveyId: string,
  customerId: string,
): Survey | null => {
  const survey = getSurveyById(surveyId);
  if (!survey || survey.customerId !== customerId) return null;

  // Can only cancel if not started
  if (survey.status === SurveyStatus.OPEN) {
    return updateSurvey(surveyId, { status: SurveyStatus.CANCELLED });
  }
  return null;
};

// Delete survey
export const deleteSurvey = (surveyId: string, customerId: string): boolean => {
  const surveys = getAllSurveys();
  const survey = surveys.find((s) => s.id === surveyId);

  if (!survey || survey.customerId !== customerId) return false;

  const filtered = surveys.filter((s) => s.id !== surveyId);
  saveSurveys(filtered);
  return true;
};

// ── Collaborator finished-surveys (per-user localStorage) ──

const finishedKey = (collaboratorId: string) =>
  `sureVey_finished_${collaboratorId}`;

export const getCollaboratorFinishedSurveys = (
  collaboratorId: string,
): FinishedEntry[] => {
  const stored = localStorage.getItem(finishedKey(collaboratorId));
  return stored ? JSON.parse(stored) : [];
};

export const addCollaboratorFinishedSurvey = (
  collaboratorId: string,
  entry: FinishedEntry,
): void => {
  const entries = getCollaboratorFinishedSurveys(collaboratorId);
  if (entries.some((e) => e.surveyId === entry.surveyId)) return; // prevent duplicates
  entries.unshift(entry); // newest first
  localStorage.setItem(finishedKey(collaboratorId), JSON.stringify(entries));
};

export const getTotalEarned = (collaboratorId: string): number => {
  return getCollaboratorFinishedSurveys(collaboratorId).reduce(
    (sum, e) => sum + e.reward,
    0,
  );
};

// Sample data for initial load
const getSampleSurveys = (): Survey[] => {
  const samples: Survey[] = [
    {
      id: "survey_1",
      title: "Khảo sát mức độ hài lòng của khách hàng",
      description:
        "Giúp chúng tôi hiểu trải nghiệm của khách hàng với sản phẩm mới của chúng tôi. Ý kiến của bạn rất quý giá!",
      surveyType: "external",
      surveyLink: "https://forms.google.com/sample1",
      package: SurveyPackage.PACKAGE_1,
      estimatedTime: 3,
      reward: 1000,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: SurveyStatus.OPEN,
      customerId: "owner_1",
      customerName: "TechCorp Inc.",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      completedCount: 12,
      targetCompletions: 50,
      acceptedBy: [],
      completedByHelperIds: [],
    },
    {
      id: "survey_2",
      title: "Nghiên cứu thị trường - Xu hướng thương mại điện tử",
      description:
        "Chia sẻ sở thích và thói quen mua sắm trực tuyến của bạn. Khảo sát này giúp định hình tương lai của thương mại điện tử.",
      surveyType: "external",
      surveyLink: "https://typeform.com/sample2",
      package: SurveyPackage.PACKAGE_2,
      estimatedTime: 7,
      reward: 1500,
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      status: SurveyStatus.OPEN,
      customerId: "owner_2",
      customerName: "Market Insights Ltd.",
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      completedCount: 5,
      targetCompletions: 100,
      acceptedBy: [],
      completedByHelperIds: [],
    },
    {
      id: "survey_3",
      title: "Khảo sát nhanh về sở thích ẩm thực",
      description:
        "Khảo sát 3 phút nhanh về các món ăn yêu thích và thói quen ăn uống của bạn.",
      surveyType: "external",
      surveyLink: "https://forms.google.com/sample3",
      package: SurveyPackage.PACKAGE_1,
      estimatedTime: 3,
      reward: 1000,
      deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      status: SurveyStatus.OPEN,
      customerId: "owner_3",
      customerName: "FoodTech Research",
      createdAt: new Date().toISOString(),
      completedCount: 28,
      targetCompletions: 30,
      acceptedBy: [],
      completedByHelperIds: [],
    },
    {
      id: "survey_4",
      title: "Nghiên cứu năng suất làm việc",
      description:
        "Giúp chúng tôi hiểu thói quen làm việc hiện đại và các công cụ năng suất. Khảo sát chi tiết với mức thưởng hấp dẫn.",
      surveyType: "external",
      surveyLink: "https://surveymonkey.com/sample4",
      package: SurveyPackage.PACKAGE_3,
      estimatedTime: 10,
      reward: 2000,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: SurveyStatus.IN_PROGRESS,
      customerId: "owner_4",
      customerName: "HR Analytics Co.",
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      completedCount: 45,
      targetCompletions: 200,
      acceptedBy: ["helper_1", "helper_2"],
      completedByHelperIds: [],
    },
  ];

  saveSurveys(samples);
  return samples;
};
