import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { expenseAPI } from '../api/database';

const initialState = {
  expenses: [],
  totalItems: 0,
  totalPages: 0,
  currentPage: 1,
  insights: [],
  loading: false,
  error: null,
  filters: {
    category: '',
    minAmount: '',
    maxAmount: '',
    search: '',
    sortBy: 'date',
    order: 'desc',
    page: 1,
    limit: 10,
  },
};

export const fetchExpenses = createAsyncThunk(
  'expenses/fetchAll',
  async ({ token, filters }, { rejectWithValue }) => {
    try {
      return await expenseAPI.getAll(token, filters);
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

export const createExpense = createAsyncThunk(
  'expenses/create',
  async ({ token, data }, { rejectWithValue, dispatch }) => {
    try {
      const result = await expenseAPI.create(token, data);
      dispatch(fetchExpenses({ token, filters: { ...initialState.filters, page: 1 } }));
      return result;
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

export const updateExpense = createAsyncThunk(
  'expenses/update',
  async ({ token, id, data }, { rejectWithValue, dispatch }) => {
    try {
      const result = await expenseAPI.update(token, id, data);
      dispatch(fetchExpenses({ token, filters: { ...initialState.filters, page: 1 } }));
      return result;
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

export const deleteExpense = createAsyncThunk(
  'expenses/delete',
  async ({ token, id }, { rejectWithValue, dispatch }) => {
    try {
      await expenseAPI.delete(token, id);
      dispatch(fetchExpenses({ token, filters: { ...initialState.filters } }));
      return id;
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

export const fetchInsights = createAsyncThunk(
  'expenses/insights',
  async (token, { rejectWithValue }) => {
    try {
      return await expenseAPI.getInsights(token);
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

const expenseSlice = createSlice({
  name: 'expenses',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setPage: (state, action) => {
      state.filters.page = action.payload;
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchExpenses.pending, (state) => { state.loading = true; })
      .addCase(fetchExpenses.fulfilled, (state, action) => {
        state.loading = false;
        state.expenses = action.payload.data;
        state.totalPages = action.payload.totalPages;
        state.currentPage = action.payload.currentPage;
        state.totalItems = action.payload.totalItems;
      })
      .addCase(fetchExpenses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to fetch expenses';
      })
      .addCase(fetchInsights.fulfilled, (state, action) => {
        state.insights = action.payload;
      })
      .addCase(createExpense.rejected, (state, action) => {
        state.error = action.payload?.error || 'Failed to create expense';
      })
      .addCase(updateExpense.rejected, (state, action) => {
        state.error = action.payload?.error || 'Failed to update expense';
      })
      .addCase(deleteExpense.rejected, (state, action) => {
        state.error = action.payload?.error || 'Failed to delete expense';
      });
  },
});

export const { setFilters, setPage, clearFilters } = expenseSlice.actions;
export default expenseSlice.reducer;
