import { apiClient } from '../lib/api-client';

export async function signUp(payload) {
  const response = await apiClient.post('/auth/signup', payload);
  return response.data;
}

export async function login(payload) {
  const response = await apiClient.post('/auth/login', payload);
  return response.data;
}

export async function logout() {
  const response = await apiClient.post('/auth/logout');
  return response.data;
}

export async function updatePassword(payload) {
  const response = await apiClient.patch('/auth/updatepassword', payload);
  return response.data;
}
