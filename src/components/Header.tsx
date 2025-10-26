// src/components/Header.tsx

import React from 'react';
import { useAppContext } from '../context/AppContext';
import { AppMode } from '../types';

const Header: React.FC = () => {
  const { state, dispatch } = useAppContext();

  const setMode = (mode: AppMode) => {
    dispatch({ type: 'SET_APP_MODE', payload: mode });
  };

  return (
    <header className="text-center mb-4">
      <h1 className="text-3xl sm:text-4xl font-bold text-white">
        Fractal EDU
      </h1>
      <p className="mt-2 text-md text-gray-400">
        Examination & Growth Analysis Tool
      </p>

      {/* --- ADDED MODE TOGGLE --- */}
      <div className="mt-4 flex justify-center rounded-md shadow-sm bg-gray-700 p-1 w-fit mx-auto">
        <button
          onClick={() => setMode('exam')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            state.appMode === 'exam'
              ? 'text-white bg-indigo-600'
              : 'text-gray-300 hover:bg-gray-600'
          }`}
        >
          Exam Analysis
        </button>
        <button
          onClick={() => setMode('rapidTest')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            state.appMode === 'rapidTest'
              ? 'text-white bg-indigo-600'
              : 'text-gray-300 hover:bg-gray-600'
          }`}
        >
          Pre/Post Test
        </button>
      </div>
      {/* --- END ADD --- */}
    </header>
  );
};

export default Header;