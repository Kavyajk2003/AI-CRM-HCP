import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  viewMode: 'form',
  crmData: {
    hcp_name: '',
    interaction_type: '',
    interaction_date: '',
    sentiment: '',
    discussion_notes: '',
    materials_shared: '',
    samples_distributed: '',
    outcomes: '',
    follow_up: '',
    summary: '',
    next_best_action: []
  },
  historyData: []
};

export const crmSlice = createSlice({
  name: 'crm',
  initialState,
  reducers: {
    updateCrmData: (state, action) => {
      // Merge new data from AI into existing state
      state.crmData = { ...state.crmData, ...action.payload };
    },
    setViewMode: (state, action) => {
      state.viewMode = action.payload;
    },
    setHistoryData: (state, action) => {
      state.historyData = action.payload;
    }
  }
});

export const { updateCrmData, setViewMode, setHistoryData } = crmSlice.actions;
export default crmSlice.reducer;