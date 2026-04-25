import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { adminAPI } from '../api/database';

const initialState = {
  users: [],
  loading: false,
  error: null,
};

export const fetchAllUsers = createAsyncThunk(
  'admin/fetchUsers',
  async (token, { rejectWithValue }) => {
    try {
      return await adminAPI.getAllUsers(token);
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

export const blockUser = createAsyncThunk(
  'admin/blockUser',
  async ({ token, userId }, { dispatch }) => {
    await adminAPI.blockUser(token, userId);
    dispatch(fetchAllUsers(token));
    return userId;
  }
);

export const unblockUser = createAsyncThunk(
  'admin/unblockUser',
  async ({ token, userId }, { dispatch }) => {
    await adminAPI.unblockUser(token, userId);
    dispatch(fetchAllUsers(token));
    return userId;
  }
);

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllUsers.pending, (state) => { state.loading = true; })
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to fetch users';
      });
  },
});

export default adminSlice.reducer;
