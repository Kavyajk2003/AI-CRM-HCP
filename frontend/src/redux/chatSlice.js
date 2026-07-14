import { createSlice } from '@reduxjs/toolkit';

const generateThreadId = () => `thread_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;

export const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    threadId: generateThreadId(),
    messages: [
      { role: 'ai', text: 'Hello! I am your AI Copilot. Log a new meeting, or ask me to retrieve history for a doctor.' }
    ],
    loading: false
  },
  reducers: {
    addUserMessage: (state, action) => {
      state.messages.push({ role: 'user', text: action.payload });
    },
    addAiMessage: (state, action) => {
      state.messages.push({ role: 'ai', text: action.payload });
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    }
  }
});

export const { addUserMessage, addAiMessage, setLoading } = chatSlice.actions;
export default chatSlice.reducer;