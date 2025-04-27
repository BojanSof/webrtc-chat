import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  status: 'disconnected', // disconnected, connecting, connected
  roomId: null,
  peerConnection: null,
  dataChannel: null,
  iceServers: [
    {
      urls: [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302',
      ],
    },
  ],
};

const connectionSlice = createSlice({
  name: 'connection',
  initialState,
  reducers: {
    setConnectionStatus: (state, action) => {
      state.status = action.payload;
    },
    setRoomId: (state, action) => {
      state.roomId = action.payload;
    },
    setPeerConnection: (state, action) => {
      state.peerConnection = action.payload;
    },
    setDataChannel: (state, action) => {
      state.dataChannel = action.payload;
    },
    resetConnection: (state) => {
      return initialState;
    },
  },
});

export const {
  setConnectionStatus,
  setRoomId,
  setPeerConnection,
  setDataChannel,
  resetConnection,
} = connectionSlice.actions;

export default connectionSlice.reducer; 