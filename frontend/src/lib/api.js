import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  withCredentials: true,
  timeout: 15000,
});

let clerkGetToken = null;

export function setClerkTokenGetter(getToken) {
  clerkGetToken = getToken;
}

api.interceptors.request.use(async (config) => {
  if (clerkGetToken) {
    try {
      const token = await clerkGetToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {}
  }
  return config;
});

export default api;
