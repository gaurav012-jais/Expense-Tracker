import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../api/axios';

export const fetchInsights = createAsyncThunk('ai/fetchInsights', async (_, thunkAPI) => {
  try {
    const response = await API.get('/ai/insights');
    return response.data.insights || [];
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data || { error: 'Failed to fetch insights' });
  }
});

export const sendMessage = createAsyncThunk('ai/sendMessage', async (message, thunkAPI) => {
  try {
    const response = await API.post('/ai/chat', { message });
    return { role: 'assistant', text: response.data.reply };
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data || { error: 'Failed to send message' });
  }
});

const aiSlice = createSlice({
  name: 'ai',
  initialState: {
    insights: [],
    messages: [],
    loading: false,
    error: null,
  },
  reducers: {
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    clearMessages: (state) => {
      state.messages = [];
    },
    clearInsights: (state) => {
      state.insights = [];
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInsights.pending, (state) => { state.loading = true; })
      .addCase(fetchInsights.fulfilled, (state, action) => {
        state.loading = false;
        state.insights = action.payload;
      })
      .addCase(fetchInsights.rejected, (state) => {
        state.loading = false;
        state.insights = [];
      })
      .addCase(sendMessage.pending, (state) => { state.loading = true; })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.loading = false;
        state.messages.push(action.payload);
      })
      .addCase(sendMessage.rejected, (state) => {
        state.loading = false;
        state.messages.push({ 
          role: 'assistant', 
          text: 'Sorry, I encountered an error. Please try again.' 
        });
      });
  }
});

export const { addMessage, clearMessages, clearInsights } = aiSlice.actions;
export default aiSlice.reducer;