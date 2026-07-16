export type BackendRole = "Customer" | "Collaborator" | "Admin";
export type CampaignStatus = "DRAFT" | "PENDING_REVIEW" | "ACTIVE" | "REJECTED" | "PAUSED" | "COMPLETED" | "CANCELLED" | "EXPIRED";
export type CampaignPaymentStatus = "UNPAID" | "PAYMENT_PENDING" | "PAYMENT_VERIFYING" | "PAID" | "PAYMENT_REJECTED";
export type ParticipationStatus = "ACCEPTED" | "IN_PROGRESS" | "SUBMITTED" | "APPROVED" | "REJECTED" | "CANCELLED";
export type SubmissionStatus = "PENDING" | "APPROVED" | "REJECTED" | "RESUBMISSION_REQUIRED";
export type WithdrawalStatus = "PENDING" | "APPROVED" | "REJECTED" | "PAID";
export type WalletPaymentStatus = "PENDING" | "PENDING_VERIFY" | "PAID" | "REJECTED" | "CANCELLED";

export interface Campaign {
  id: number;
  customerId: number;
  title: string;
  description: string;
  instruction: string;
  campaignType: "GOOGLE_FORM" | "INTERNAL_FORM";
  googleFormUrl?: string | null;
  confirmationCode?: string;
  rewardPerResponse: number;
  targetResponses: number;
  approvedResponses: number;
  deadline: string;
  category: string;
  status: CampaignStatus;
  rejectReason?: string | null;
  isEscrowed: boolean;
  escrowedAt?: string | null;
  paymentStatus: CampaignPaymentStatus;
  paymentId?: number | null;
  rewardBudget: number;
  platformFeeAmount: number;
  totalAmount: number;
  answerCount: number;
  unitPricePerAnswer: number;
  createdAt: string;
  updatedAt: string;
}

export interface AvailableCampaign {
  id: number;
  title: string;
  description: string;
  instruction: string;
  googleFormUrl?: string | null;
  rewardPerResponse: number;
  targetResponses: number;
  approvedResponses: number;
  remainingSlots: number;
  deadline: string;
  category: string;
}

export interface Participation {
  id: number;
  campaignId: number;
  collaboratorId: number;
  status: ParticipationStatus;
  acceptedAt: string;
  submittedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  campaign?: Campaign | null;
}

export interface Submission {
  id: number;
  campaignId: number;
  participationId: number;
  collaboratorId: number;
  confirmationCode?: string;
  proofImageUrl?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  note?: string | null;
  status: SubmissionStatus;
  rejectReason?: string | null;
  reviewedByUserId?: number | null;
  reviewedAt?: string | null;
  rewardPaidAt?: string | null;
  rewardTransactionReference?: string | null;
  createdAt: string;
  updatedAt: string;
  campaign?: Campaign | null;
}

export interface Wallet {
  id: number;
  userId: number;
  availableBalance: number;
  pendingBalance: number;
  escrowBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface WalletTransaction {
  id: number;
  walletId: number;
  userId: number;
  type: string;
  amount: number;
  balanceAfter: number;
  referenceType?: string | null;
  referenceId?: string | null;
  description?: string | null;
  createdAt: string;
}

export interface Withdrawal {
  id: number;
  collaboratorId: number;
  walletId: number;
  amount: number;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  status: WithdrawalStatus;
  adminNote?: string | null;
  rejectReason?: string | null;
  requestedAt: string;
  reviewedByAdminId?: number | null;
  reviewedAt?: string | null;
  paidAt?: string | null;
}

export interface CampaignQuote {
  targetResponses: number;
  answerCount: number;
  unitPricePerAnswer: number;
  rewardPerResponse: number;
  rewardBudget: number;
  platformFeeRate: number;
  platformFeeAmount: number;
  totalAmount: number;
}

export interface CampaignPayment {
  id: number;
  campaignId: number;
  customerId: number;
  paymentCode: string;
  targetResponses: number;
  answerCount: number;
  unitPricePerAnswer: number;
  rewardPerResponse: number;
  rewardBudget: number;
  platformFeeRate: number;
  platformFeeAmount: number;
  totalAmount: number;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  qrImageUrl?: string | null;
  transferContent: string;
  proofImageUrl?: string | null;
  customerNote?: string | null;
  status: WalletPaymentStatus;
  verifiedByAdminId?: number | null;
  verifiedAt?: string | null;
  rejectReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminRevenueSummary {
  totalPaidAmount: number;
  totalRewardBudget: number;
  totalPlatformFeeAmount: number;
  paidPaymentCount: number;
  pendingVerifyPaymentCount: number;
}

export interface UserProfile {
  userId: number;
  userName: string;
  email: string;
  identityCard?: string | null;
  sex?: string | null;
  phoneNumber?: string | null;
  dateOfBirth?: string | null;
  address?: string | null;
  fullName?: string | null;
}

export interface PagedResponse<T> {
  items: T[];
  totalRecords: number;
  pageIndex: number;
  pageSize: number;
  totalPages: number;
}
