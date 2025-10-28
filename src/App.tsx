// src/App.tsx

import React, { Suspense, lazy } from 'react';
import { useAppContext } from './context/AppContext';
import Header from './components/Header';
import SessionManager from './components/SessionManager';
import RapidTestDashboard from './components/rapid-test/RapidTestDashboard';
const ExamAnalysisContainer = lazy(() => import('./components/ExamAnalysisContainer'));

const App: React.FC = () => {
  const { state } = useAppContext();
  const { appMode } = state;

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <Header />
      <SessionManager />
      <Suspense fallback={<div className="text-center p-8">Loading...</div>}>
        <main>
          {appMode === 'rapidTest' ? (
            <RapidTestDashboard />
          ) : (
            <ExamAnalysisContainer />
          )}
        </main>
      </Suspense>
    </div>
  );
};

export default App;