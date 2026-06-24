import axios from 'axios';
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const api = axios.create({ baseURL: API_BASE, headers: { 'Content-Type': 'application/json' }, timeout: 30000 });
api.interceptors.request.use((config) => { const t = localStorage.getItem('hps_access_token'); if (t) config.headers.Authorization = `Bearer ${t}`; return config; });
api.interceptors.response.use((r) => r, async (err) => {
  if (!err.response) {
    // Backend is offline. Wait 3 seconds and retry.
    await new Promise((resolve) => setTimeout(resolve, 3000));
    return api(err.config);
  }
  if (err.response?.status === 401 && !err.config._retry && !err.config.url?.includes('login')) {
    err.config._retry = true;
    try {
      const rt = localStorage.getItem('hps_refresh_token');
      if (!rt) throw new Error();
      const res = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken: rt });
      localStorage.setItem('hps_access_token', res.data.data.accessToken);
      localStorage.setItem('hps_refresh_token', res.data.data.refreshToken);
      err.config.headers.Authorization = `Bearer ${res.data.data.accessToken}`;
      return api(err.config);
    } catch {
      localStorage.removeItem('hps_access_token');
      localStorage.removeItem('hps_refresh_token');
      localStorage.removeItem('hps_user');
      window.location.href = '/login';
    }
  }
  return Promise.reject(err);
});
export default api;
