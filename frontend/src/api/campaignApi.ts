import { apiRequest } from "./httpClient";
import type { AvailableCampaign, Campaign, CampaignPayment, CampaignQuote, Participation, Submission } from "./types";

export interface CreateCampaignInput {
  title: string;
  description: string;
  instruction: string;
  campaignType: "GOOGLE_FORM" | "INTERNAL_FORM";
  googleFormUrl?: string;
  rewardPerResponse: number;
  targetResponses: number;
  answerCount: number;
  unitPricePerAnswer: number;
  deadline: string;
  category: string;
  submitForReview: boolean;
}

export const campaignApi = {
  create: (data: CreateCampaignInput) =>
    apiRequest<Campaign>("/survey/api/campaigns", { method: "POST", bodyJson: data }),
  myCampaigns: () => apiRequest<Campaign[]>("/survey/api/campaigns/my"),
  get: (id: number) => apiRequest<Campaign>(`/survey/api/campaigns/${id}`),
  submitForReview: (id: number) =>
    apiRequest<Campaign>(`/survey/api/campaigns/${id}/submit-review`, { method: "POST" }),
  submissions: (id: number) =>
    apiRequest<Submission[]>(`/survey/api/campaigns/${id}/submissions`),
  available: () => apiRequest<AvailableCampaign[]>("/survey/api/surveys/available"),
  accept: (id: number) =>
    apiRequest<Participation>(`/survey/api/campaigns/${id}/accept`, { method: "POST" }),
  quote: (data: { targetResponses: number; answerCount: number; unitPricePerAnswer: number }) =>
    apiRequest<CampaignQuote>("/wallet/api/payments/campaign-quote", { method: "POST", bodyJson: data }),
  createPayment: (campaignId: number, data: { targetResponses: number; answerCount: number; unitPricePerAnswer: number; customerNote?: string }) =>
    apiRequest<CampaignPayment>(`/wallet/api/campaigns/${campaignId}/payments`, { method: "POST", bodyJson: data }),
  submitPaymentProof: (paymentId: number, data: { proofImageUrl: string; customerNote?: string }) =>
    apiRequest<CampaignPayment>(`/wallet/api/payments/${paymentId}/proof`, { method: "POST", bodyJson: data }),
};
