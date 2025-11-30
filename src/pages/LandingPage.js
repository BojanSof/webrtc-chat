import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';

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
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 dark:bg-gray-900">
      <div className="relative max-w-md w-full space-y-6 px-8 pt-6 pb-8 bg-white rounded-xl shadow-lg dark:bg-gray-800 dark:text-gray-100">
        <div className="absolute top-4 right-4">
          <ThemeToggle className="shadow-none bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600" />
        </div>
        <div className="text-center">
          <img
            src="/icon.png"
            alt="Chatrix logo"
            className="mx-auto h-24 w-24"
          />
          <h2 className="mt-3 text-3xl font-extrabold text-gray-900 dark:text-white">
            Chatrix - WebRTC Chat
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
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
              <div className="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500 dark:bg-gray-800 dark:text-gray-300">
                Or
              </span>
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
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-400"
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
