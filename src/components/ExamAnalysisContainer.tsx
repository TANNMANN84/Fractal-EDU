// src/components/ExamAnalysisContainer.tsx

import React from 'react';
import { useAppContext } from '@/context/AppContext';
import SetupSection from './setup/SetupSection';
import DataEntryView from './entry/DataEntryView';
import AnalysisDashboard from './analysis/AnalysisDashboard';
import { Exam } from '@/types';

const ExamAnalysisContainer = () => {
  const { state, dispatch } = useAppContext();
  const { exams, activeExamId } = state;
  const activeExam = activeExamId ? exams.find(e => e.id === activeExamId) : null;

  const handleCreateNewExam = () => {
    const newExamName = window.prompt("Enter a name for the new exam:", "New Exam");
    if (newExamName) {
      const newExam: Exam = {
        id: crypto.randomUUID(),
        name: newExamName,
        questions: [],
        students: [],
        selectedSyllabus: '',
        structureLocked: false,
      };
      dispatch({ type: 'ADD_EXAM', payload: newExam });
      // No need to dispatch SET_ACTIVE_EXAM here, ADD_EXAM handles it
    }
  };

  // If an exam is active, show the appropriate view (Setup, Data Entry, or Analysis)
  if (activeExam) {
    const structureLocked = activeExam.structureLocked;
    const handleEditSetup = () => {
      dispatch({ type: 'SET_STRUCTURE_LOCKED', payload: { examId: activeExam.id, locked: false } });
    };
    return (
      // Wrap the content in a div to easily place the back button
      <div className="relative">
        {/* Back Button - Positioned top-right within the active exam view */}
        <button
          onClick={() => dispatch({ type: 'SET_ACTIVE_EXAM', payload: null })}
          className="absolute top-0 right-0 mt-1 mr-1 px-3 py-1 text-xs font-medium rounded-md text-gray-300 bg-gray-600 hover:bg-gray-500 z-10" // Added z-index
        >
          &larr; Back to Dashboard
        </button>

        {/* Existing conditional rendering for exam content */}
        {!structureLocked ? (
          <SetupSection onFinalize={() => {}} />
        ) : (
          <>
            <DataEntryView onEditSetup={handleEditSetup} />
            <AnalysisDashboard />
          </>
        )}
      </div>
    );
  }

  // If no exam is active, show the exam dashboard
  return (
    <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-white">Exam Dashboard</h2>
        <button onClick={handleCreateNewExam} className="px-4 py-2 text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">
          + Create New Exam
        </button>
      </div>
      <div className="space-y-3">
        {exams.length > 0 ? (
          exams.map(exam => (
            <div key={exam.id} className="p-4 bg-gray-700/50 rounded-lg flex justify-between items-center">
              <span className="text-lg font-semibold text-white">{exam.name}</span>
              <button onClick={() => dispatch({ type: 'SET_ACTIVE_EXAM', payload: exam.id })} className="px-4 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                Select
              </button>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-400 py-8">No exams found. Create a new exam or import one using the Session Management tools.</p>
        )}
      </div>
    </div>
  );
};

export default ExamAnalysisContainer;
