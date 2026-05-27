import { apiClient } from '../lib/api-client';

export async function getProfile() {
  const response = await apiClient.get('/profile/view');
  return response.data;
}

export async function updateProfile(payload) {
  const response = await apiClient.patch('/profile/edit', payload);
  return response.data;
}

export async function getFeed(params = { page: 1, limit: 10 }) {
  const response = await apiClient.get('/user/feed', { params });
  return response.data;
}

export async function getReceivedRequests() {
  const response = await apiClient.get('/user/requests/received');
  return response.data;
}

export async function getConnections() {
  const response = await apiClient.get('/user/requests/connections');
  return response.data;
}
