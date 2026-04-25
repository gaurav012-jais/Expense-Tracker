import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth';

export const login = createAsyncThunk('auth/login', async (credentials, thunkAPI) => {
  try {
    const response = await axios.post(`${API_URL}/login`, credentials);
    if (response.data.token && !response.data.requires2FA) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data || { error: 'Login failed' });
  }
});

export const verify2FALogin = createAsyncThunk('auth/verify2FALogin', async (credentials, thunkAPI) => {
  try {
    const response = await axios.post(`${API_URL}/login-2fa`, credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data || { error: '2FA verification failed' });
  }
});

export const register = createAsyncThunk('auth/register', async (userData, thunkAPI) => {
  try {
    const response = await axios.post(`${API_URL}/register`, userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data || { error: 'Registration failed' });
  }
});

export const adminLogin = createAsyncThunk('auth/adminLogin', async (credentials, thunkAPI) => {
  try {
    const response = await axios.post(`${API_URL}/admin/login`, credentials);
    if (response.data.token && !response.data.requires2FA) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data || { error: 'Admin login failed' });
  }
});

export const adminRegister = createAsyncThunk('auth/adminRegister', async (userData, thunkAPI) => {
  try {
    const response = await axios.post(`${API_URL}/admin/register`, userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data || { error: 'Admin registration failed' });
  }
});

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  loading: false,
  error: null,
  requires2FA: false,
  tempEmail: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      localStorage.removeItem('token');
      state.user = null;
      state.token = null;
      state.requires2FA = false;
      state.tempEmail = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    clear2FA: (state) => {
      state.requires2FA = false;
      state.tempEmail = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => { state.loading = true; })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.requires2FA) {
          state.requires2FA = true;
          state.tempEmail = action.payload.email;
        } else {
          state.user = action.payload.user;
          state.token = action.payload.token;
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Login failed';
      })
      .addCase(register.pending, (state) => { state.loading = true; })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Registration failed';
      })
      .addCase(verify2FALogin.pending, (state) => { state.loading = true; })
      .addCase(verify2FALogin.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.requires2FA = false;
        state.tempEmail = null;
      })
      .addCase(verify2FALogin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Invalid 2FA code';
      })
      .addCase(adminLogin.pending, (state) => { state.loading = true; })
      .addCase(adminLogin.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.requires2FA) {
          state.requires2FA = true;
          state.tempEmail = action.payload.email;
        } else {
          state.user = action.payload.user;
          state.token = action.payload.token;
        }
      })
      .addCase(adminLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Admin login failed';
      })
      .addCase(adminRegister.pending, (state) => { state.loading = true; })
      .addCase(adminRegister.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(adminRegister.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Admin registration failed';
      });
  },
});

export const { logout, clearError, clear2FA } = authSlice.actions;
export default authSlice.reducer;