import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  messages: [],
  isTyping: false,
  remoteTyping: false,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addMessage: (state, action) => {
      const newMessage = {
        id: action.payload.id || Date.now(),
        timestamp: new Date().toISOString(),
        ...action.payload,
      };

      // Check if message already exists
      const existingIndex = state.messages.findIndex(msg => msg.id === newMessage.id);
      
      if (existingIndex >= 0) {
        // Update existing message
        state.messages[existingIndex] = {
          ...state.messages[existingIndex],
          ...newMessage
        };
      } else {
        // Add new message
        state.messages.push(newMessage);
      }
    },
    setTyping: (state, action) => {
      state.isTyping = action.payload;
    },
    setRemoteTyping: (state, action) => {
      state.remoteTyping = action.payload;
    },
    clearMessages: (state) => {
      state.messages = [];
    },
  },
});

export const {
  addMessage,
  setTyping,
  setRemoteTyping,
  clearMessages,
} = chatSlice.actions;

export default chatSlice.reducer; 