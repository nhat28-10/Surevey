import { adminApi } from "../../api/adminApi";
import { campaignApi } from "../../api/campaignApi";
import { participationApi } from "../../api/participationApi";
import type { Campaign, CampaignPayment, Participation, Submission, WalletTransaction, Withdrawal } from "../../api/types";
import { walletApi } from "../../api/walletApi";
import type { User } from "../types/auth";

export type AppNotificationType = "campaign" | "payment" | "submission" | "wallet" | "system";
export type AppNotificationTone = "blue" | "green" | "amber" | "red" | "slate";

export interface AppNotification {
  id: string;
  type: AppNotificationType;
  tone: AppNotificationTone;
  title: string;
  description: string;
  createdAt: string;
  href: string;
  read: boolean;
}

const READ_STORAGE_PREFIX = "surevey.notifications.read.";

export async function getNotificationsForUser(user: User): Promise<AppNotification[]> {
  const readIds = getReadIds(user.id);
  const notifications = user.role === "Admin"
    ? await getAdminNotifications()
    : user.role === "Customer"
      ? await getCustomerNotifications()
      : await getCollaboratorNotifications();

  return notifications
    .map(notification => ({ ...notification, read: readIds.has(notification.id) }))
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .slice(0, 80);
}

export function markNotificationRead(userId: string, id: string) {
  const readIds = getReadIds(userId);
  readIds.add(id);
  saveReadIds(userId, readIds);
  window.dispatchEvent(new Event("notifications-changed"));
}

export function markAllNotificationsRead(userId: string, ids: string[]) {
  const readIds = getReadIds(userId);
  ids.forEach(id => readIds.add(id));
  saveReadIds(userId, readIds);
  window.dispatchEvent(new Event("notifications-changed"));
}

function getReadIds(userId: string) {
  try {
    const raw = localStorage.getItem(`${READ_STORAGE_PREFIX}${userId}`);
    return new Set<string>(raw ? JSON.parse(raw) as string[] : []);
  } catch {
    return new Set<string>();
  }
}

function saveReadIds(userId: string, ids: Set<string>) {
  localStorage.setItem(`${READ_STORAGE_PREFIX}${userId}`, JSON.stringify(Array.from(ids).slice(-300)));
}

async function getCustomerNotifications(): Promise<AppNotification[]> {
  const campaigns = await campaignApi.myCampaigns();
  const submissionsByCampaign = await Promise.allSettled(
    campaigns.slice(0, 8).map(async campaign => ({
      campaign,
      submissions: await campaignApi.submissions(campaign.id),
    })),
  );

  const notifications: AppNotification[] = [];

  campaigns.forEach(campaign => {
    notifications.push(...campaignNotifications(campaign));
  });

  submissionsByCampaign.forEach(result => {
    if (result.status !== "fulfilled") return;
    const { campaign, submissions } = result.value;
    notifications.push(...customerSubmissionNotifications(campaign, submissions));
  });

  return notifications;
}

async function getCollaboratorNotifications(): Promise<AppNotification[]> {
  const [participationsResult, transactionsResult, withdrawalsResult] = await Promise.allSettled([
    participationApi.mine(),
    walletApi.transactions(),
    walletApi.withdrawals(),
  ]);

  const participations = participationsResult.status === "fulfilled" ? participationsResult.value : [];
  const transactions = transactionsResult.status === "fulfilled" ? transactionsResult.value : [];
  const withdrawals = withdrawalsResult.status === "fulfilled" ? withdrawalsResult.value : [];

  return [
    ...participations.flatMap(collaboratorParticipationNotifications),
    ...transactions.slice(0, 20).flatMap(walletTransactionNotifications),
    ...withdrawals.slice(0, 20).flatMap(collaboratorWithdrawalNotifications),
  ];
}

async function getAdminNotifications(): Promise<AppNotification[]> {
  const [paymentsResult, campaignsResult, withdrawalsResult] = await Promise.allSettled([
    adminApi.payments(),
    adminApi.pendingCampaigns(),
    adminApi.withdrawals(),
  ]);

  const payments = paymentsResult.status === "fulfilled" ? paymentsResult.value : [];
  const campaigns = campaignsResult.status === "fulfilled" ? campaignsResult.value : [];
  const withdrawals = withdrawalsResult.status === "fulfilled" ? withdrawalsResult.value : [];

  return [
    ...payments.flatMap(adminPaymentNotifications),
    ...campaigns.flatMap(adminCampaignNotifications),
    ...withdrawals.flatMap(adminWithdrawalNotifications),
  ];
}

function campaignNotifications(campaign: Campaign): AppNotification[] {
  const href = `/customer/campaign/${campaign.id}`;
  const items: AppNotification[] = [];

  if (campaign.status === "ACTIVE") {
    items.push({
      id: `customer-campaign-active-${campaign.id}`,
      type: "campaign",
      tone: "green",
      title: "Campaign đã được duyệt",
      description: `${campaign.title} đang hiển thị trên marketplace.`,
      createdAt: campaign.updatedAt,
      href,
      read: false,
    });
  }

  if (campaign.status === "COMPLETED" || (campaign.targetResponses > 0 && campaign.approvedResponses >= campaign.targetResponses)) {
    items.push({
      id: `customer-campaign-completed-${campaign.id}`,
      type: "campaign",
      tone: "green",
      title: "Campaign đã đủ response",
      description: `${campaign.title} đã đạt ${campaign.approvedResponses}/${campaign.targetResponses} response.`,
      createdAt: campaign.updatedAt,
      href,
      read: false,
    });
  }

  if (campaign.status === "REJECTED") {
    items.push({
      id: `customer-campaign-rejected-${campaign.id}`,
      type: "campaign",
      tone: "red",
      title: "Campaign bị từ chối",
      description: campaign.rejectReason || `${campaign.title} cần chỉnh sửa trước khi gửi duyệt lại.`,
      createdAt: campaign.updatedAt,
      href,
      read: false,
    });
  }

  if (campaign.paymentStatus === "PAYMENT_VERIFYING") {
    items.push({
      id: `customer-payment-verifying-${campaign.id}`,
      type: "payment",
      tone: "amber",
      title: "Thanh toán đang chờ xác minh",
      description: `${campaign.title} đang chờ Admin kiểm tra bằng chứng thanh toán.`,
      createdAt: campaign.updatedAt,
      href,
      read: false,
    });
  }

  return items;
}

function customerSubmissionNotifications(campaign: Campaign, submissions: Submission[]): AppNotification[] {
  const pending = submissions.filter(submission => submission.status === "PENDING");
  const latestPending = pending.sort(sortByUpdatedDesc)[0];
  if (!latestPending) return [];

  return [{
    id: `customer-submission-pending-${campaign.id}-${latestPending.id}`,
    type: "submission",
    tone: "blue",
    title: "Có submission mới cần duyệt",
    description: `${campaign.title} có ${pending.length} submission đang chờ kiểm tra.`,
    createdAt: latestPending.createdAt,
    href: `/customer/campaign/${campaign.id}`,
    read: false,
  }];
}

function collaboratorParticipationNotifications(participation: Participation): AppNotification[] {
  const campaignTitle = participation.campaign?.title || `Campaign #${participation.campaignId}`;
  const href = "/collaborator/activities";

  if (participation.status === "APPROVED") {
    return [{
      id: `collaborator-participation-approved-${participation.id}`,
      type: "submission",
      tone: "green",
      title: "Submission đã được duyệt",
      description: `${campaignTitle} đã được Customer duyệt, ví sẽ ghi nhận thưởng nếu đủ điều kiện.`,
      createdAt: participation.updatedAt,
      href,
      read: false,
    }];
  }

  if (participation.status === "REJECTED") {
    return [{
      id: `collaborator-participation-rejected-${participation.id}`,
      type: "submission",
      tone: "red",
      title: "Submission bị từ chối",
      description: `${campaignTitle} cần xem lại yêu cầu hoặc lý do từ Customer.`,
      createdAt: participation.updatedAt,
      href,
      read: false,
    }];
  }

  if (participation.status === "SUBMITTED") {
    return [{
      id: `collaborator-participation-submitted-${participation.id}`,
      type: "submission",
      tone: "amber",
      title: "Submission đang chờ duyệt",
      description: `${campaignTitle} đã nộp và đang chờ Customer kiểm tra.`,
      createdAt: participation.submittedAt || participation.updatedAt,
      href,
      read: false,
    }];
  }

  return [];
}

function walletTransactionNotifications(transaction: WalletTransaction): AppNotification[] {
  if (transaction.amount <= 0) return [];

  return [{
    id: `collaborator-wallet-transaction-${transaction.id}`,
    type: "wallet",
    tone: "green",
    title: "Ví vừa ghi nhận tiền",
    description: `${transaction.amount.toLocaleString("vi-VN")} đ từ ${transaction.description || transaction.type}.`,
    createdAt: transaction.createdAt,
    href: "/collaborator/activities",
    read: false,
  }];
}

function collaboratorWithdrawalNotifications(withdrawal: Withdrawal): AppNotification[] {
  if (withdrawal.status === "PENDING") {
    return [{
      id: `collaborator-withdrawal-pending-${withdrawal.id}`,
      type: "wallet",
      tone: "amber",
      title: "Yêu cầu rút tiền đang chờ duyệt",
      description: `${withdrawal.amount.toLocaleString("vi-VN")} đ đang chờ Admin xử lý.`,
      createdAt: withdrawal.requestedAt,
      href: "/collaborator/activities",
      read: false,
    }];
  }

  if (withdrawal.status === "PAID") {
    return [{
      id: `collaborator-withdrawal-paid-${withdrawal.id}`,
      type: "wallet",
      tone: "green",
      title: "Yêu cầu rút tiền đã hoàn tất",
      description: `${withdrawal.amount.toLocaleString("vi-VN")} đ đã được đánh dấu chuyển tiền.`,
      createdAt: withdrawal.paidAt || withdrawal.reviewedAt || withdrawal.requestedAt,
      href: "/collaborator/activities",
      read: false,
    }];
  }

  if (withdrawal.status === "REJECTED") {
    return [{
      id: `collaborator-withdrawal-rejected-${withdrawal.id}`,
      type: "wallet",
      tone: "red",
      title: "Yêu cầu rút tiền bị từ chối",
      description: withdrawal.rejectReason || `${withdrawal.amount.toLocaleString("vi-VN")} đ chưa được duyệt.`,
      createdAt: withdrawal.reviewedAt || withdrawal.requestedAt,
      href: "/collaborator/activities",
      read: false,
    }];
  }

  return [];
}

function adminPaymentNotifications(payment: CampaignPayment): AppNotification[] {
  if (payment.status !== "PENDING_VERIFY" && payment.status !== "PENDING") return [];

  return [{
    id: `admin-payment-${payment.status.toLowerCase()}-${payment.id}`,
    type: "payment",
    tone: "amber",
    title: "Thanh toán cần xác minh",
    description: `${payment.paymentCode} - ${payment.totalAmount.toLocaleString("vi-VN")} đ.`,
    createdAt: payment.updatedAt,
    href: "/admin",
    read: false,
  }];
}

function adminCampaignNotifications(campaign: Campaign): AppNotification[] {
  return [{
    id: `admin-campaign-pending-${campaign.id}`,
    type: "campaign",
    tone: "blue",
    title: "Campaign đang chờ duyệt",
    description: `${campaign.title} cần Admin kiểm tra trước khi lên marketplace.`,
    createdAt: campaign.updatedAt,
    href: "/admin",
    read: false,
  }];
}

function adminWithdrawalNotifications(withdrawal: Withdrawal): AppNotification[] {
  if (withdrawal.status !== "PENDING" && withdrawal.status !== "APPROVED") return [];

  return [{
    id: `admin-withdrawal-${withdrawal.status.toLowerCase()}-${withdrawal.id}`,
    type: "wallet",
    tone: withdrawal.status === "APPROVED" ? "green" : "amber",
    title: withdrawal.status === "APPROVED" ? "Rút tiền đã duyệt, chờ chuyển" : "Yêu cầu rút tiền mới",
    description: `${withdrawal.amount.toLocaleString("vi-VN")} đ - ${withdrawal.bankName}.`,
    createdAt: withdrawal.reviewedAt || withdrawal.requestedAt,
    href: "/admin",
    read: false,
  }];
}

function sortByUpdatedDesc(left: Submission, right: Submission) {
  return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
}
