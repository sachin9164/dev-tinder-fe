import { apiClient } from '../lib/api-client';

export async function getChatByUserId(toUserId) {
  const response = await apiClient.get(`/chat/${toUserId}`);
  return response.data;
}