import { apiRequest } from "./httpClient";
import type { Wallet, WalletTransaction, Withdrawal } from "./types";

export const walletApi = {
  get: () => apiRequest<Wallet>("/wallet/api/wallet"),
  transactions: () => apiRequest<WalletTransaction[]>("/wallet/api/wallet/transactions"),
  withdrawals: () => apiRequest<Withdrawal[]>("/wallet/api/withdrawals/me"),
  createWithdrawal: (data: { amount: number; bankName: string; bankAccountName: string; bankAccountNumber: string }) =>
    apiRequest<Withdrawal>("/wallet/api/withdrawals", { method: "POST", bodyJson: data }),
};
