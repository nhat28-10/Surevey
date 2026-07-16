import { apiRequest } from "./httpClient";
import type { AdminRevenueSummary, Campaign, CampaignPayment, PagedResponse, UserProfile, Withdrawal } from "./types";

export const adminApi = {
  pendingCampaigns: () => apiRequest<Campaign[]>("/survey/api/admin/campaigns/pending"),
  approveCampaign: (id: number) =>
    apiRequest<Campaign>(`/survey/api/admin/campaigns/${id}/approve`, { method: "POST" }),
  rejectCampaign: (id: number, reason: string) =>
    apiRequest<Campaign>(`/survey/api/admin/campaigns/${id}/reject`, { method: "POST", bodyJson: { reason } }),

  payments: (status?: string) =>
    apiRequest<CampaignPayment[]>(`/wallet/api/admin/payments${status ? `?status=${encodeURIComponent(status)}` : ""}`),
  payment: (id: number) => apiRequest<CampaignPayment>(`/wallet/api/admin/payments/${id}`),
  approvePayment: (id: number) =>
    apiRequest<CampaignPayment>(`/wallet/api/admin/payments/${id}/approve`, { method: "POST" }),
  rejectPayment: (id: number, rejectReason: string) =>
    apiRequest<CampaignPayment>(`/wallet/api/admin/payments/${id}/reject`, { method: "POST", bodyJson: { rejectReason } }),
  revenueSummary: () => apiRequest<AdminRevenueSummary>("/wallet/api/admin/revenue-summary"),

  withdrawals: (status?: string) =>
    apiRequest<Withdrawal[]>(`/wallet/api/admin/withdrawals${status ? `?status=${encodeURIComponent(status)}` : ""}`),
  approveWithdrawal: (id: number, adminNote?: string) =>
    apiRequest<Withdrawal>(`/wallet/api/admin/withdrawals/${id}/approve`, { method: "POST", bodyJson: { adminNote } }),
  rejectWithdrawal: (id: number, rejectReason: string, adminNote?: string) =>
    apiRequest<Withdrawal>(`/wallet/api/admin/withdrawals/${id}/reject`, { method: "POST", bodyJson: { rejectReason, adminNote } }),
  markWithdrawalPaid: (id: number, adminNote?: string) =>
    apiRequest<Withdrawal>(`/wallet/api/admin/withdrawals/${id}/mark-paid`, { method: "POST", bodyJson: { adminNote } }),

  users: (pageIndex = 1, pageSize = 100) =>
    apiRequest<PagedResponse<UserProfile>>(`/user/api/user/paging?pageIndex=${pageIndex}&pageSize=${pageSize}`),
  topup: (userId: number, amount: number, description?: string) =>
    apiRequest(`/wallet/api/admin/wallets/${userId}/topup`, { method: "POST", bodyJson: { amount, description } }),
};
