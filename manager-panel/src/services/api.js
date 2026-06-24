import axios from 'axios';
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const api = axios.create({ baseURL: API_BASE, headers: { 'Content-Type': 'application/json' }, timeout: 30000 });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hps_access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use((r) => r, async (error) => {
  if (error.response?.status === 401 && !error.config._retry && !error.config.url?.includes('login')) {
    error.config._retry = true;
    try {
      const rt = localStorage.getItem('hps_refresh_token');
      if (!rt) throw new Error('No refresh token');
      const res = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken: rt });
      localStorage.setItem('hps_access_token', res.data.data.accessToken);
      localStorage.setItem('hps_refresh_token', res.data.data.refreshToken);
      error.config.headers.Authorization = `Bearer ${res.data.data.accessToken}`;
      return api(error.config);
    } catch {
      localStorage.removeItem('hps_access_token');
      localStorage.removeItem('hps_refresh_token');
      localStorage.removeItem('hps_user');
      window.location.href = '/login';
    }
  }
  return Promise.reject(error);
});
export default api;
