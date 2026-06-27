const WITHDRAWALS_KEY = 'sureVey_withdrawals';

export type WithdrawStatus = 'pending' | 'completed';

export interface WithdrawRequest {
  id: string;
  helperId: string;
  helperName: string;
  helperEmail: string;
  amount: number;
  bankQrImage: string; // base64 data URL
  requestedAt: string;
  status: WithdrawStatus;
  completedAt?: string;
}

export const getAllWithdrawRequests = (): WithdrawRequest[] => {
  const stored = localStorage.getItem(WITHDRAWALS_KEY);
  return stored ? JSON.parse(stored) : [];
};

const saveWithdrawRequests = (requests: WithdrawRequest[]): void => {
  localStorage.setItem(WITHDRAWALS_KEY, JSON.stringify(requests));
};

export const createWithdrawRequest = (
  data: Omit<WithdrawRequest, 'id' | 'requestedAt' | 'status'>
): WithdrawRequest => {
  const requests = getAllWithdrawRequests();
  const newRequest: WithdrawRequest = {
    ...data,
    id: `withdraw_${Date.now()}`,
    requestedAt: new Date().toISOString(),
    status: 'pending',
  };
  requests.push(newRequest);
  saveWithdrawRequests(requests);
  return newRequest;
};

export const completeWithdrawRequest = (id: string): WithdrawRequest | null => {
  const requests = getAllWithdrawRequests();
  const index = requests.findIndex(r => r.id === id);
  if (index === -1) return null;

  requests[index] = {
    ...requests[index],
    status: 'completed',
    completedAt: new Date().toISOString(),
  };
  saveWithdrawRequests(requests);
  return requests[index];
};

// Sum of amounts from completed withdrawal requests for a helper
export const getHelperWithdrawnTotal = (helperId: string): number =>
  getAllWithdrawRequests()
    .filter(r => r.helperId === helperId && r.status === 'completed')
    .reduce((sum, r) => sum + r.amount, 0);

export const getHelperAvailableBalance = (
  helperId: string,
  totalEarned: number
): number => Math.max(0, totalEarned - getHelperWithdrawnTotal(helperId));
