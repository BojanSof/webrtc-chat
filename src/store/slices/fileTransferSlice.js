import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  activeTransfers: {},
  completedTransfers: {},
};

const fileTransferSlice = createSlice({
  name: 'fileTransfer',
  initialState,
  reducers: {
    addTransfer: (state, action) => {
      const { fileId, fileName, size, type } = action.payload;
      state.activeTransfers[fileId] = {
        fileName,
        size,
        type,
        progress: 0,
        status: 'pending',
      };
    },
    updateTransferProgress: (state, action) => {
      const { fileId, progress } = action.payload;
      if (state.activeTransfers[fileId]) {
        state.activeTransfers[fileId].progress = progress;
      }
    },
    completeTransfer: (state, action) => {
      const { fileId } = action.payload;
      if (state.activeTransfers[fileId]) {
        state.completedTransfers[fileId] = {
          ...state.activeTransfers[fileId],
          status: 'completed',
        };
        delete state.activeTransfers[fileId];
      }
    },
    failTransfer: (state, action) => {
      const { fileId } = action.payload;
      if (state.activeTransfers[fileId]) {
        state.activeTransfers[fileId].status = 'failed';
      }
    },
    clearTransfers: (state) => {
      state.activeTransfers = {};
      state.completedTransfers = {};
    },
  },
});

export const {
  addTransfer,
  updateTransferProgress,
  completeTransfer,
  failTransfer,
  clearTransfers,
} = fileTransferSlice.actions;

export default fileTransferSlice.reducer; 