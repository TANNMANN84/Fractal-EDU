// src/components/rapid-test/RapidTestDashboard.tsx

import React, { useState, useEffect, Suspense, lazy, useMemo } from 'react'; // Added useMemo
import { useAppContext } from '../../context/AppContext';
import { RapidTest, RapidQuestion, RapidQuestionType, AppState, Student } from '../../types'; // Import necessary types
import RapidTestEditor from './RapidTestEditor';
import RapidEntryView from './RapidEntryView';
import StudentList from '../entry/StudentList';
const RapidTestAnalysis = lazy(() => import('./RapidTestAnalysis'));

// --- Helper Function to create a question based on type ---
const createRapidQuestion = (type: RapidQuestionType, defaultMarks: number): RapidQuestion => ({
  id: crypto.randomUUID(),
  prompt: '',
  type: type,
  maxMarks: defaultMarks,
  options: type === 'MCQ' ? ['A','B','C','D'] : undefined,
  correctAnswer: '',
});

// --- Helper Function to generate the diagnostic template structure ---
const createDiagnosticTemplate = (): RapidTest => {
  const questions: RapidQuestion[] = [
    ...Array(5).fill(null).map(() => createRapidQuestion('Spelling', 1)),
    ...Array(3).fill(null).map(() => createRapidQuestion('Matching', 1)), // Split into 3 questions
    ...Array(2).fill(null).map(() => createRapidQuestion('Written', 2)),
    ...Array(10).fill(null).map(() => createRapidQuestion('MCQ', 1)),
    createRapidQuestion('Marks', 3),
  ];
  questions.forEach((q, index) => {
      if (q.type === 'Spelling') q.prompt = `Spelling Word ${index + 1}`;
      // Find the index within the matching questions group
      else if (q.type === 'Matching') {
        const matchingIndex = questions.filter(qs => qs.type === 'Matching').indexOf(q);
        q.prompt = `Matching Item ${matchingIndex + 1}`;
      }
      else if (q.type === 'Written') q.prompt = `Define Term for Q${index + 1}`;
      else if (q.type === 'MCQ') q.prompt = `Multiple Choice Q${index + 1}`;
      else if (q.type === 'Marks' && questions.length - 1 === index) q.prompt = `Diagram Label Score Q${index + 1}`;
      else q.prompt = `Q${index + 1} (${q.type})`;
  });
  return {
    id: crypto.randomUUID(),
    name: 'New Diagnostic Test (Template)',
    questions: questions,
    results: [],
    tags: [] // <-- ADDED
  };
};

// --- Main Component ---
const RapidTestDashboard: React.FC = () => {
  const { state, dispatch } = useAppContext();
  // Ensure rapidTests exists on state, default to empty array if not
  const allRapidTests = state.rapidTests || [];
  const allRapidTestStudents = state.rapidTestStudents || [];

  const [editingTest, setEditingTest] = useState<RapidTest | null>(null);
  const [markingTestId, setMarkingTestId] = useState<string | null>(null);
  const [analysingTestId, setAnalysingTestId] = useState<string | null>(null); // State for analysis view

  // --- ADDED: State for Tag Filtering ---
  const [activeTags, setActiveTags] = useState<string[]>([]);

  // --- ADDED: Memo to get all unique tags ---
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    allRapidTests.forEach((test: RapidTest) => {
      test.tags?.forEach(tag => tagSet.add(tag));
    });
    allRapidTestStudents.forEach((student: Student) => {
      student.tags?.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [allRapidTests, allRapidTestStudents]);

  // --- ADDED: Handler to toggle a tag ---
  const toggleTag = (tag: string) => {
    setActiveTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  // --- ADDED: Filter tests based on active tags ---
  const filteredRapidTests = useMemo(() => {
    if (activeTags.length === 0) {
      return allRapidTests;
    }
    return allRapidTests.filter(test =>
      activeTags.every(tag => test.tags?.includes(tag))
    );
  }, [allRapidTests, activeTags]);

  // --- ADDED: Filter students based on active tags ---
  const filteredStudents = useMemo(() => {
    if (activeTags.length === 0) {
      return allRapidTestStudents;
    }
    return allRapidTestStudents.filter(student =>
      activeTags.every(tag => student.tags?.includes(tag))
    );
  }, [allRapidTestStudents, activeTags]);


  const handleCreateNew = () => {
    const newTest: RapidTest = {
      id: crypto.randomUUID(),
      name: 'New Blank Test',
      questions: [],
      results: [],
      tags: [...activeTags] // <-- ADDED: Auto-tag new test with active filters
    };
    setEditingTest(newTest);
  };

  const handleCreateFromTemplate = () => {
    const templateTest = createDiagnosticTemplate();
    templateTest.tags = [...activeTags]; // <-- ADDED: Auto-tag new test
    setEditingTest(templateTest);
  };

  const handleExportTest = (testToExport: RapidTest) => {
    // Create a clean version of the test, without results
    const testTemplate = {
      ...testToExport,
      results: [],
    };
    const defaultFileName = `rapid-test-${testToExport.name.replace(/ /g, '_')}.json`;
    const fileName = window.prompt('Enter a filename for the test template:', defaultFileName);

    if (!fileName) {
      return;
    }

    const jsonString = JSON.stringify(testTemplate, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName.endsWith('.json') ? fileName : `${fileName}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleEdit = (test: RapidTest) => { setMarkingTestId(null); setAnalysingTestId(null); setEditingTest(test); };
  const handleDelete = (testId: string) => { if (window.confirm('Delete test?')) { dispatch({ type: 'DELETE_RAPID_TEST', payload: testId }); if (editingTest?.id === testId) setEditingTest(null); if (markingTestId === testId) setMarkingTestId(null); if (analysingTestId === testId) setAnalysingTestId(null); } };
  const handleSave = (updatedTest: RapidTest) => { dispatch({ type: 'UPDATE_RAPID_TEST', payload: updatedTest }); setEditingTest(null); };
  const handleCancel = () => { setEditingTest(null); }; // Keep simple cancel for editor
  const handleStartMarking = (testId: string) => { setEditingTest(null); setAnalysingTestId(null); setMarkingTestId(testId); };
  const handleStartAnalysis = (testId: string) => { setEditingTest(null); setMarkingTestId(null); setAnalysingTestId(testId); };
  const handleBackToDashboard = () => { setMarkingTestId(null); setEditingTest(null); setAnalysingTestId(null); }; // Reset all modes

  const handleLoadTestFromFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result;
          if (typeof text !== 'string') throw new Error('File could not be read.');
          
          let testData = JSON.parse(text) as RapidTest & { yearGroup?: number }; // <-- ADDED yearGroup type

          // Basic validation
          if (testData && testData.id && testData.name && Array.isArray(testData.questions)) {
            
            // --- ADDED: Auto-migration from yearGroup ---
            if (testData.yearGroup) {
              const yearTag = `Year ${testData.yearGroup}`;
              if (!testData.tags) {
                testData.tags = [];
              }
              if (!testData.tags.includes(yearTag)) {
                testData.tags.push(yearTag);
              }
              delete testData.yearGroup; // Clean up old field
            }
            // --- END MIGRATION ---

            if (!allRapidTests.find((t: RapidTest) => t.id === testData.id)) {
              dispatch({ type: 'ADD_RAPID_TEST', payload: testData });
              alert(`Test "${testData.name}" loaded successfully!`);
            } else {
              alert(`Test "${testData.name}" is already loaded.`);
            }
          } else {
            throw new Error('Invalid test file structure.');
          }
        } catch (error: any) {
          console.error("Failed to load test from file:", error);
          alert(`Failed to load test file. ${error.message}`);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // --- Conditional Rendering Logic ---
  if (markingTestId) {
      const testToMark = allRapidTests.find((t: RapidTest) => t.id === markingTestId); // Add type
      if (!testToMark) { return ( <div className="text-red-400 p-4">Error: Test not found. <button onClick={handleBackToDashboard}>Back</button></div> ); }
      return <RapidEntryView test={testToMark} onBack={handleBackToDashboard} />; // <-- MODIFIED: Pass test object
  }
  if (analysingTestId) { // Added Analysis view placeholder
    const testToAnalyse = allRapidTests.find((t: RapidTest) => t.id === analysingTestId); // Add type
    if (!testToAnalyse) { return ( <div className="text-red-400 p-4">Error: Test not found. <button onClick={handleBackToDashboard}>Back</button></div> ); }
    return (
      <Suspense fallback={<div className="text-center p-8">Loading Analysis...</div>}>
        <RapidTestAnalysis test={testToAnalyse} onBack={handleBackToDashboard} />
      </Suspense>
    );
  }
  if (editingTest) {
    return ( <RapidTestEditor test={editingTest} onSave={handleSave} onCancel={handleBackToDashboard} /> ); // Use unified back handler
  }

  // Render Dashboard with Student List
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel 1: Student List */}
        <div className="lg:col-span-1 bg-gray-800 border border-gray-700 p-4 rounded-lg shadow-md h-fit">
            {/* --- MODIFIED: Pass filteredStudents --- */}
            <StudentList studentList={filteredStudents} mode="rapidTest" isSelectable={false} />
        </div>

        {/* Panel 2: Test Dashboard */}
        <div className="lg:col-span-2 bg-gray-800 border border-gray-700 p-6 rounded-lg shadow-md space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <h2 className="text-2xl font-semibold text-white"> Pre/Post Test Dashboard </h2>
                <div className="flex gap-2">
                    <button onClick={handleLoadTestFromFile} className="px-4 py-2 text-sm font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700" > + Load Test from File </button>
                    <button onClick={handleCreateFromTemplate} className="px-4 py-2 text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700" > + New Diagnostic Template </button>
                    <button onClick={handleCreateNew} className="px-4 py-2 text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700" > + New Blank Test </button>
                </div>
            </div>

            {/* --- ADDED: Tag Filter Section --- */}
            {allTags.length > 0 && (
              <div className="pt-2 pb-4 border-b border-gray-700">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-sm font-medium text-gray-400">Filter by Tag:</span>
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1 text-sm font-medium rounded-full ${
                        activeTags.includes(tag)
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                  {activeTags.length > 0 && (
                    <button
                      onClick={() => setActiveTags([])}
                      className="px-3 py-1 text-sm font-medium rounded-full text-red-400 hover:bg-red-900/50"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>
            )}
            {/* --- END: Tag Filter Section --- */}


            <div className="space-y-3">
                {/* --- MODIFIED: Map over filteredRapidTests --- */}
                {filteredRapidTests.length === 0 ? ( <p className="text-gray-400 text-center py-4"> {allRapidTests.length === 0 ? "No Pre/Post tests created yet." : "No tests match the selected filters."} </p> )
                 : ( filteredRapidTests.map((test: RapidTest) => ( // Added type
                    <div key={test.id} className="p-4 bg-gray-700/50 rounded-lg flex flex-wrap justify-between items-center gap-2" >
                    <div className="flex-grow">
                        <h3 className="text-lg font-semibold text-white">{test.name}</h3>
                        <p className="text-sm text-gray-400">
                           {test.questions.length} Questions
                           {/* --- ADDED: Display test tags --- */}
                           {test.tags && test.tags.length > 0 && (
                               <span className="ml-3 text-xs text-cyan-300 bg-gray-900/50 px-1.5 py-0.5 rounded-full">
                                  {test.tags.join(', ')}
                               </span>
                           )}
                        </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => handleStartMarking(test.id)} className="px-3 py-1.5 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700" title="Enter Results" > Mark </button>
                        {/* --- WIRE UP Analyse Button --- */}
                        <button onClick={() => handleStartAnalysis(test.id)} className="px-3 py-1.5 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700" title="View Growth Analysis" > Analyse </button>
                        <button onClick={() => handleExportTest(test)} className="px-3 py-1.5 text-sm font-medium rounded-md text-gray-300 bg-gray-600 hover:bg-gray-500" title="Export Test Structure">Export</button>
                        {/* --- END WIRE UP --- */}
                        <button onClick={() => handleEdit(test)} className="px-3 py-1.5 text-sm font-medium rounded-md text-gray-300 bg-gray-600 hover:bg-gray-500" title="Edit Structure" > Edit </button>
                        <button onClick={() => handleDelete(test.id)} className="px-3 py-1.5 text-sm font-medium rounded-md text-red-400 hover:bg-red-800" title="Delete Test" > Delete </button>
                    </div>
                    </div>
                ))
                )}
            </div>
        </div>
    </div>
  );
};

export default RapidTestDashboard;


// --- Keep Helper Function Definitions outside component ---
// const createRapidQuestion = (...) => { ... };
// const createDiagnosticTemplate = () => { ... };
