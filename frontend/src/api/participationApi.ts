import { apiRequest } from "./httpClient";
import type { Participation, Submission } from "./types";

export const participationApi = {
  mine: () => apiRequest<Participation[]>("/survey/api/me/participations"),
  submit: (participationId: number, data: {
    confirmationCode?: string;
    proofImageUrl?: string;
    contactEmail?: string;
    contactPhone?: string;
    note?: string;
  }) => apiRequest<Submission>(`/survey/api/participations/${participationId}/submissions`, {
    method: "POST",
    bodyJson: data,
  }),
};
