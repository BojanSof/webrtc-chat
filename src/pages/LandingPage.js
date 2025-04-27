import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function LandingPage() {
  const [roomId, setRoomId] = useState('');
  const navigate = useNavigate();

  const handleCreateRoom = () => {
    const newRoomId = Math.floor(100000 + Math.random() * 900000).toString();
    navigate(`/room/${newRoomId}`);
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (roomId.length === 6 && /^\d+$/.test(roomId)) {
      navigate(`/room/${roomId}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            WebRTC Chat
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Create a new room or join an existing one
          </p>
        </div>
        <div className="mt-8 space-y-6">
          <button
            onClick={handleCreateRoom}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Create New Room
          </button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or</span>
            </div>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleJoinRoom}>
            <div>
              <label htmlFor="room-id" className="sr-only">
                Room ID
              </label>
              <input
                id="room-id"
                name="room-id"
                type="text"
                required
                pattern="[0-9]{6}"
                maxLength={6}
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Enter 6-digit room code"
              />
            </div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Join Room
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LandingPage; 