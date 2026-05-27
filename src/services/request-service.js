import { apiClient } from '../lib/api-client';

export async function sendRequest(status, toUserId) {
  const response = await apiClient.post(`/request/send/${status}/${toUserId}`);
  return response.data;
}

export async function reviewRequest(status, requestId) {
  const response = await apiClient.post(
    `/request/review/${status}/${requestId}`
  );
  return response.data;
}
