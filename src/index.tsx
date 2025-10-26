// src/index.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// FIX: AppProvider is a named export
import { AppProvider } from './context/AppContext'; 
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>,
);