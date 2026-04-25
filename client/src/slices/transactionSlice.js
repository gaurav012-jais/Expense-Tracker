import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../api/axios';

export const fetchTransactions = createAsyncThunk('transactions/fetchAll', async (params = {}, thunkAPI) => {
  try {
    const response = await API.get('/transactions', { params });
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data || { error: 'Failed to fetch transactions' });
  }
});

export const addTransaction = createAsyncThunk('transactions/add', async (data, thunkAPI) => {
  try {
    const response = await API.post('/transactions', data);
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data || { error: 'Failed to add transaction' });
  }
});

export const updateTransaction = createAsyncThunk('transactions/update', async ({ id, data }, thunkAPI) => {
  try {
    const response = await API.put(`/transactions/${id}`, data);
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data || { error: 'Failed to update transaction' });
  }
});

export const deleteTransaction = createAsyncThunk('transactions/delete', async (id, thunkAPI) => {
  try {
    await API.delete(`/transactions/${id}`);
    return id;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data || { error: 'Failed to delete transaction' });
  }
});

const transactionSlice = createSlice({
  name: 'transactions',
  initialState: {
    items: [],
    total: 0,
    currentPage: 1,
    totalPages: 1,
    loading: false,
    error: null,
  },
  reducers: {
    clearTransactions: (state) => {
      state.items = [];
      state.total = 0;
    },
    setPage: (state, action) => {
      state.currentPage = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTransactions.pending, (state) => { state.loading = true; })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.transactions || [];
        state.total = action.payload.pagination?.total || 0;
        state.totalPages = action.payload.pagination?.pages || 1;
        state.currentPage = action.payload.pagination?.page || 1;
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to fetch transactions';
      })
      .addCase(addTransaction.fulfilled, (state, action) => {
        state.items.unshift(action.payload.transaction);
        state.total += 1;
      })
      .addCase(updateTransaction.fulfilled, (state, action) => {
        const index = state.items.findIndex(t => t._id === action.payload.transaction._id);
        if (index !== -1) {
          state.items[index] = action.payload.transaction;
        }
      })
      .addCase(deleteTransaction.fulfilled, (state, action) => {
        state.items = state.items.filter(t => t._id !== action.payload);
        state.total -= 1;
      });
  }
});

export const { clearTransactions, setPage } = transactionSlice.actions;
export default transactionSlice.reducer;