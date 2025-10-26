// src/App.tsx

import React from 'react';
import { useAppContext } from './context/AppContext';
import Header from './components/Header';
import SessionManager from './components/SessionManager';
import SetupSection from './components/setup/SetupSection';
import DataEntryView from './components/entry/DataEntryView';
import RapidTestDashboard from './components/rapid-test/RapidTestDashboard';

/**
 * Renders the main content based on appMode and structureLocked state.
 */
const AppContent: React.FC = () => {
  const { state } = useAppContext();

  // --- Pre/Post Test Mode ---
  if (state.appMode === 'rapidTest') {
    return (
      <main>
        <RapidTestDashboard />
      </main>
    );
  }

  // --- Exam Analysis Mode ---
  // SetupSection handles its own visibility based on structureLocked.
  // DataEntryView handles its own visibility based on structureLocked.
  // We pass dummy functions just to satisfy the prop types, as the
  // components now use the context state for their rendering logic.
  return (
    <main>
      <SetupSection onFinalize={() => {}} />
      <DataEntryView onEditSetup={() => {}} />
    </main>
  );
};

const App: React.FC = () => {
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <Header />
      <SessionManager />
      <AppContent />
    </div>
  );
};

export default App;