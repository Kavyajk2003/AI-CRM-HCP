import { configureStore } from '@reduxjs/toolkit';
import crmReducer from './crmSlice';
import chatReducer from './chatSlice';

export const store = configureStore({
  reducer: {
    crm: crmReducer,
    chat: chatReducer,
  },
});