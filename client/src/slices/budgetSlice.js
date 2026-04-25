import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../api/axios';

export const fetchBudgets = createAsyncThunk('budgets/fetchAll', async (_, thunkAPI) => {
  try {
    const response = await API.get('/budgets');
    return response.data.budgets || [];
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data || { error: 'Failed to fetch budgets' });
  }
});

export const fetchBudgetStatus = createAsyncThunk('budgets/fetchStatus', async (_, thunkAPI) => {
  try {
    const response = await API.get('/budgets/status');
    return response.data.statuses || [];
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data || { error: 'Failed to fetch budget status' });
  }
});

export const createBudget = createAsyncThunk('budgets/create', async (data, thunkAPI) => {
  try {
    const response = await API.post('/budgets', data);
    return response.data.budget;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data || { error: 'Failed to create budget' });
  }
});

export const updateBudget = createAsyncThunk('budgets/update', async ({ id, data }, thunkAPI) => {
  try {
    const response = await API.put(`/budgets/${id}`, data);
    return response.data.budget;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data || { error: 'Failed to update budget' });
  }
});

export const deleteBudget = createAsyncThunk('budgets/delete', async (id, thunkAPI) => {
  try {
    await API.delete(`/budgets/${id}`);
    return id;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data || { error: 'Failed to delete budget' });
  }
});

const budgetSlice = createSlice({
  name: 'budgets',
  initialState: {
    items: [],
    statuses: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearBudgets: (state) => {
      state.items = [];
      state.statuses = [];
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBudgets.pending, (state) => { state.loading = true; })
      .addCase(fetchBudgets.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchBudgets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to fetch budgets';
      })
      .addCase(fetchBudgetStatus.pending, (state) => { state.loading = true; })
      .addCase(fetchBudgetStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.statuses = action.payload;
      })
      .addCase(fetchBudgetStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to fetch budget status';
      })
      .addCase(createBudget.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(updateBudget.fulfilled, (state, action) => {
        const index = state.items.findIndex(b => b._id === action.payload._id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(deleteBudget.fulfilled, (state, action) => {
        state.items = state.items.filter(b => b._id !== action.payload);
      });
  }
});

export const { clearBudgets } = budgetSlice.actions;
export default budgetSlice.reducer;