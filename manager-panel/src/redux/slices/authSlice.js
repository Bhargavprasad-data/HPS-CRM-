import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const response = await api.post('/auth/login', credentials);
    const { accessToken, refreshToken, user } = response.data.data;
    if (user.role !== 'Manager') return rejectWithValue('Access denied. This portal is for Managers only.');
    localStorage.setItem('hps_access_token', accessToken);
    localStorage.setItem('hps_refresh_token', refreshToken);
    localStorage.setItem('hps_user', JSON.stringify(user));
    return user;
  } catch (error) { return rejectWithValue(error.response?.data?.message || 'Login failed'); }
});

export const logout = createAsyncThunk('auth/logout', async () => {
  try { await api.post('/auth/logout'); } catch (e) { }
  localStorage.removeItem('hps_access_token');
  localStorage.removeItem('hps_refresh_token');
  localStorage.removeItem('hps_user');
});

const storedUser = localStorage.getItem('hps_user');
const authSlice = createSlice({
  name: 'auth',
  initialState: { user: storedUser ? JSON.parse(storedUser) : null, isAuthenticated: !!localStorage.getItem('hps_access_token'), loading: false, error: null },
  reducers: {
    clearError: (state) => { state.error = null; },
    setUser: (state, action) => { state.user = action.payload; state.isAuthenticated = true; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(login.fulfilled, (state, action) => { state.loading = false; state.user = action.payload; state.isAuthenticated = true; })
      .addCase(login.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(logout.fulfilled, (state) => { state.user = null; state.isAuthenticated = false; });
  },
});
export const { clearError, setUser } = authSlice.actions;
export default authSlice.reducer;
