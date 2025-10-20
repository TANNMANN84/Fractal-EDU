import { useState, useEffect } from 'react';
import Header from './components/Header';
import SessionManager from './components/SessionManager';
import SetupSection from './components/setup/SetupSection';
import DataEntryView from './components/entry/DataEntryView';
import { useAppContext } from './context/AppContext';
import useDebounce from './hooks/useDebounce';

function App() {
  const { state, dispatch } = useAppContext();
  const [view, setView] = useState<'setup' | 'data'>('setup');
  const [saveIndicator, setSaveIndicator] = useState({ visible: false, text: '' });

  const debouncedState = useDebounce(state, 1000);

  useEffect(() => {
    const savedStateRaw = localStorage.getItem('examTrackerAutoSession');
    if (savedStateRaw) {
      try {
        const savedState = JSON.parse(savedStateRaw);
        dispatch({ type: 'SET_STATE', payload: savedState });
        if (savedState.questions.length > 0) {
          setView('data');
        }
      } catch (e) {
        console.error("Failed to parse auto-saved session:", e);
      }
    }
  }, [dispatch]);

  useEffect(() => {
    if (debouncedState) {
      setSaveIndicator({ visible: true, text: 'Saving...' });
      localStorage.setItem('examTrackerAutoSession', JSON.stringify(debouncedState));
      const timer = setTimeout(() => setSaveIndicator({ visible: true, text: 'Saved ✔' }), 500);
      const hideTimer = setTimeout(() => setSaveIndicator({ visible: false, text: '' }), 2000);
      return () => {
        clearTimeout(timer);
        clearTimeout(hideTimer);
      };
    }
  }, [debouncedState]);

  const handleFinalizeSetup = () => {
    if (state.questions.length === 0) {
      alert("Please add at least one question to the exam structure.");
      return;
    }
    dispatch({ type: 'SET_STRUCTURE_LOCKED', payload: true });
    setView('data');
  };

  const handleEditSetup = () => {
    dispatch({ type: 'SET_STRUCTURE_LOCKED', payload: false });
    setView('setup');
  };

  return (
    <>
      <div 
        className={`fixed bottom-4 right-4 bg-gray-800 text-white text-sm py-2 px-4 rounded-lg shadow-lg border border-gray-600 transition-opacity duration-500 ${saveIndicator.visible ? 'opacity-100' : 'opacity-0'}`}
      >
        {saveIndicator.text}
      </div>

      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <Header />
        <main>
          <SessionManager />
          {view === 'setup' ? (
            <SetupSection onFinalize={handleFinalizeSetup} />
          ) : (
            <DataEntryView onEditSetup={handleEditSetup} />
          )}
        </main>
      </div>
    </>
  );
}

export default App;