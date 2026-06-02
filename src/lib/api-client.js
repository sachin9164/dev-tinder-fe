import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export { API_BASE_URL };

export function parseApiError(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error?.code ||
    error?.message ||
    'Something went wrong'
  );
}
