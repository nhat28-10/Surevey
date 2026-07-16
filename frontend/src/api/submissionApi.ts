import { apiRequest } from "./httpClient";
import type { CampaignStatus, ParticipationStatus, Submission, SubmissionStatus } from "./types";

export interface ReviewSubmissionResponse {
  submissionId: number;
  submissionStatus: SubmissionStatus;
  participationStatus: ParticipationStatus;
  campaignStatus: CampaignStatus;
  approvedResponses: number;
  message: string;
}

export const submissionApi = {
  get: (id: number) => apiRequest<Submission>(`/survey/api/submissions/${id}`),
  approve: (id: number) => apiRequest<ReviewSubmissionResponse>(`/survey/api/submissions/${id}/approve`, { method: "POST" }),
  reject: (id: number, rejectReason: string) => apiRequest<ReviewSubmissionResponse>(`/survey/api/submissions/${id}/reject`, {
    method: "POST",
    bodyJson: { rejectReason },
  }),
};
