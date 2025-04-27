import { configureStore } from '@reduxjs/toolkit';
import connectionReducer from './slices/connectionSlice';
import chatReducer from './slices/chatSlice';
import fileTransferReducer from './slices/fileTransferSlice';

export const store = configureStore({
  reducer: {
    connection: connectionReducer,
    chat: chatReducer,
    fileTransfer: fileTransferReducer,
  },
});

export default store; 