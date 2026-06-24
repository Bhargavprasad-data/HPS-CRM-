import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const login = createAsyncThunk('auth/login', async (creds, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/login', creds);
    const { accessToken, refreshToken, user } = res.data.data;
    if (user.role !== 'Accountant') return rejectWithValue('Access denied. This portal is for Accountants only.');
    localStorage.setItem('hps_access_token', accessToken);
    localStorage.setItem('hps_refresh_token', refreshToken);
    localStorage.setItem('hps_user', JSON.stringify(user));
    return user;
  } catch (err) { return rejectWithValue(err.response?.data?.message || 'Login failed'); }
});

export const logout = createAsyncThunk('auth/logout', async () => {
  try { await api.post('/auth/logout'); } catch {}
  localStorage.removeItem('hps_access_token');
  localStorage.removeItem('hps_refresh_token');
  localStorage.removeItem('hps_user');
});

const stored = localStorage.getItem('hps_user');
let initialUser = null;
if (stored) {
  try {
    const parsed = JSON.parse(stored);
    if (parsed.role === 'Accountant') {
      initialUser = parsed;
    } else {
      localStorage.removeItem('hps_access_token');
      localStorage.removeItem('hps_refresh_token');
      localStorage.removeItem('hps_user');
    }
  } catch (e) {}
}

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: initialUser,
    isAuthenticated: !!initialUser && !!localStorage.getItem('hps_access_token'),
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (s) => { s.error = null; },
    setUser: (s, a) => {
      s.user = a.payload;
      localStorage.setItem('hps_user', JSON.stringify(a.payload));
    },
  },
  extraReducers: (b) => {
    b.addCase(login.pending,   (s)    => { s.loading = true; s.error = null; })
     .addCase(login.fulfilled, (s, a) => { s.loading = false; s.user = a.payload; s.isAuthenticated = true; })
     .addCase(login.rejected,  (s, a) => { s.loading = false; s.error = a.payload; })
     .addCase(logout.fulfilled, (s)   => { s.user = null; s.isAuthenticated = false; });
  },
});
export const { clearError, setUser } = authSlice.actions;
export default authSlice.reducer;
