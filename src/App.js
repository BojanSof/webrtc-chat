import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import ChatRoom from './pages/ChatRoom';
import NotFound from './pages/NotFound';

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/room/:roomId" element={<ChatRoom />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App; 