import React, { useRef, useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { AppState, Exam } from '../types';
import * as syncService from '../services/syncService';

const SessionManager: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const importInputRef = useRef<HTMLInputElement>(null);
    const [confirmReset, setConfirmReset] = useState(false);
    const templateImportRef = useRef<HTMLInputElement>(null);
    const sharedAnalysisImportRef = useRef<HTMLInputElement>(null);

    const handleSaveToCloud = async () => {
        await syncService.saveDataToCloud(state);
    };

    const handleLoadFromCloud = async () => {
        const loadedState = await syncService.loadDataFromCloud();
        if (loadedState) {
            if (window.confirm('Are you sure you want to load this backup? This will overwrite all current data in your session.')) {
                dispatch({ type: 'SET_STATE', payload: loadedState });
                alert('Backup loaded successfully.');
            }
        }
    };

    const handleExportExamTemplate = () => {
        const activeExam = state.activeExamId ? state.exams.find(e => e.id === state.activeExamId) : null;
        if (!activeExam) { alert("Please select an exam first."); return; }
        const examTemplate = {
            questions: activeExam.questions,
            selectedSyllabus: activeExam.selectedSyllabus,
        };
        const defaultFileName = `exam-template-${new Date().toISOString().slice(0, 10)}.json`;
        const fileName = window.prompt('Enter a filename for the exam template:', defaultFileName);

        if (!fileName) {
            return;
        }

        const jsonString = JSON.stringify(examTemplate, null, 2);
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

    const handleImportExamTemplate = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedState = JSON.parse(e.target?.result as string);
                if ('questions' in importedState && 'selectedSyllabus' in importedState) {
                    const newExam: Exam = {
                        id: crypto.randomUUID(),
                        name: file.name.replace(/\.json$/i, '') || 'Imported Template',
                        questions: importedState.questions,
                        selectedSyllabus: importedState.selectedSyllabus,
                        students: [],
                        structureLocked: false,
                    };
                    dispatch({ type: 'ADD_EXAM', payload: newExam });
                    dispatch({ type: 'SET_ACTIVE_EXAM', payload: newExam.id }); // Set the new exam as active
                    dispatch({ type: 'SET_APP_MODE', payload: 'exam' }); // Switch to exam mode
                    alert("Exam structure imported successfully.");
                } else {
                    throw new Error("Invalid exam template file format.");
                }
            } catch (error) {
                console.error('Error importing file:', error);
                alert("Failed to import exam template. Make sure it's a valid template file.");
            }
        };
        reader.readAsText(file);
        event.target.value = ''; // Reset input
    };

    const handleExportSharedAnalysis = () => {
        const activeExam = state.activeExamId ? state.exams.find(e => e.id === state.activeExamId) : null;
        if (!activeExam) { alert("Please select an exam to share."); return; }
        const sharedData = {
            name: activeExam.name,
            questions: activeExam.questions,
            selectedSyllabus: activeExam.selectedSyllabus,
            students: activeExam.students,
        };
        const defaultFileName = `shared-analysis-${new Date().toISOString().slice(0, 10)}.json`;
        const fileName = window.prompt('Enter a filename for the shared analysis:', defaultFileName);

        if (!fileName) {
            return;
        }

        const jsonString = JSON.stringify(sharedData, null, 2);
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

    const handleImportSharedAnalysis = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target?.result as string);
                if ('questions' in importedData && 'selectedSyllabus' in importedData && 'students' in importedData) {
                    const newExam: Exam = {
                        id: crypto.randomUUID(),
                        name: importedData.name || file.name.replace(/\.json$/i, '') || 'Imported Analysis',
                        questions: importedData.questions,
                        selectedSyllabus: importedData.selectedSyllabus,
                        students: importedData.students,
                        structureLocked: true, // Shared analysis is always locked
                    };
                    dispatch({ type: 'ADD_EXAM', payload: newExam });
                    dispatch({ type: 'SET_ACTIVE_EXAM', payload: newExam.id }); // Set the new exam as active
                    dispatch({ type: 'SET_APP_MODE', payload: 'exam' });
                    alert("Shared analysis imported successfully.");
                } else {
                    throw new Error("Invalid shared analysis file format.");
                }
            } catch (error) { alert("Failed to import shared analysis file."); }
        };
        reader.readAsText(file);
        event.target.value = '';
    };

    const handleReset = () => {
        if (confirmReset) {
            localStorage.removeItem('examTrackerAutoSession');
            // A full page reload is the simplest way to reset all state,
            // including component-local state that isn't in the context.
            window.location.reload(); 
        } else {
            setConfirmReset(true);
            setTimeout(() => setConfirmReset(false), 3000);
        }
    };


    return (
        <details className="bg-gray-800 border border-gray-700 rounded-lg shadow-md mb-8 open:ring-1 open:ring-white/10 open:shadow-lg transition-all">
            <summary className="p-4 cursor-pointer text-lg font-semibold text-white">
                Session Management
            </summary>
            <div className="p-4 border-t border-gray-600">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    <button onClick={handleSaveToCloud} className="px-3 py-1.5 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700" title="Save a complete backup of all application data to a file.">Save Backup to File</button>
                    <button onClick={handleLoadFromCloud} className="px-3 py-1.5 text-sm font-medium rounded-md text-white bg-blue-500 hover:bg-blue-600" title="Load a complete backup file to restore all application data.">Load Backup from File</button>
                    {state.appMode === 'exam' && (
                        <>
                            <button onClick={handleExportExamTemplate} className="px-3 py-1.5 text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600" title="Export the current exam structure (questions and syllabus) to a shareable file.">Export Exam Template</button>
                            <button onClick={() => templateImportRef.current?.click()} className="px-3 py-1.5 text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 cursor-pointer" title="Import an exam structure from a file. This will not affect your student data.">
                                Import Exam Template
                            </button>
                            <input type="file" ref={templateImportRef} className="hidden" accept=".json" onChange={handleImportExamTemplate} />

                            <button onClick={handleExportSharedAnalysis} className="px-3 py-1.5 text-sm font-medium rounded-md text-teal-300 bg-teal-800 hover:bg-teal-700" title="Export the current exam and all its student results to a single file for sharing.">Share Analysis</button>
                            <button onClick={() => sharedAnalysisImportRef.current?.click()} className="px-3 py-1.5 text-sm font-medium rounded-md text-teal-300 bg-teal-800 hover:bg-teal-700 cursor-pointer" title="Load a shared analysis file. This will replace the current exam and its students.">
                                Load Shared Analysis
                            </button>
                            <input type="file" ref={sharedAnalysisImportRef} className="hidden" accept=".json" onChange={handleImportSharedAnalysis} />
                        </>
                    )}
                    <button onClick={handleReset} className={`px-3 py-1.5 text-sm font-medium rounded-md text-white transition-colors ${confirmReset ? 'bg-yellow-600 hover:bg-yellow-500' : 'bg-red-800 hover:bg-red-700'}`} title="Clear all data and start a new exam">
                        {confirmReset ? 'Confirm Reset?' : 'Reset All Data'}
                    </button>
                </div>
            </div>
        </details>
    );
};

export default SessionManager;