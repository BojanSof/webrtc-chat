import React from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';

function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <div className="absolute top-4 right-4">
        <ThemeToggle className="shadow-none bg-white/80 hover:bg-white dark:bg-gray-800/80 dark:hover:bg-gray-700" />
      </div>
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">404</h1>
        <p className="text-xl text-gray-600 dark:text-gray-300">Page not found</p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          Go Home
        </button>
      </div>
    </div>
  );
}

export default NotFound; 
