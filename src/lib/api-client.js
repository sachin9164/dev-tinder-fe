import axios from 'axios';

const API_BASE_URL =

  `${window.location.protocol}//${window.location.host}`;
console.log('API Base URL:', API_BASE_URL);
export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export function parseApiError(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error?.code ||
    error?.message ||
    'Something went wrong'
  );
}
