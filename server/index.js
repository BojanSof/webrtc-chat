const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

// Store active rooms and their participants
const rooms = new Map();

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('join-room', (roomId) => {
    console.log(`Client ${socket.id} joining room ${roomId}`);
    
    // Leave any existing rooms
    for (const [existingRoomId, participants] of rooms.entries()) {
      if (participants.has(socket.id)) {
        participants.delete(socket.id);
        if (participants.size === 0) {
          rooms.delete(existingRoomId);
        }
      }
    }

    // Join new room
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }
    rooms.get(roomId).add(socket.id);
    socket.join(roomId);

    // Notify the client that they've joined the room
    socket.emit('room-joined', { roomId, socketId: socket.id });

    // If there's another participant in the room, start the WebRTC connection
    const participants = rooms.get(roomId);
    if (participants.size === 2) {
      const [firstParticipant] = participants;
      if (firstParticipant !== socket.id) {
        console.log(`Room ${roomId} has two participants, initiating WebRTC connection between ${firstParticipant} and ${socket.id}`);
        socket.to(roomId).emit('peer-joined', { peerId: socket.id });
        socket.emit('peer-joined', { peerId: firstParticipant });
      }
    }
  });

  socket.on('offer', ({ roomId, offer, from }) => {
    console.log(`Received offer from ${from} in room ${roomId}`);
    socket.to(roomId).emit('offer', { offer, from });
  });

  socket.on('answer', ({ roomId, answer, from }) => {
    console.log(`Received answer from ${from} in room ${roomId}`);
    socket.to(roomId).emit('answer', { answer, from });
  });

  socket.on('ice-candidate', ({ roomId, candidate, from }) => {
    console.log(`Received ICE candidate from ${from} in room ${roomId}`);
    socket.to(roomId).emit('ice-candidate', { candidate, from });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    // Remove the socket from any rooms it was in
    for (const [roomId, participants] of rooms.entries()) {
      if (participants.has(socket.id)) {
        participants.delete(socket.id);
        if (participants.size === 0) {
          rooms.delete(roomId);
        }
      }
    }
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 