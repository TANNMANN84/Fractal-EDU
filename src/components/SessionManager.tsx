import React, { useRef, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { AppState } from '../types';
import * as syncService from '../services/syncService';

const SessionManager: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const importInputRef = useRef<HTMLInputElement>(null);
    const [confirmReset, setConfirmReset] = useState(false);

    const handleSaveToCloud = async () => {
        await syncService.saveDataToCloud(state);
    };

    const handleLoadFromCloud = async () => {
        const loadedState = await syncService.loadDataFromCloud();
        if (loadedState) {
            dispatch({ type: 'SET_STATE', payload: loadedState });
        }
    };

    const handleExportJson = () => {
        const jsonString = JSON.stringify(state, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `exam-session-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleImportJson = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedState = JSON.parse(e.target?.result as string);
                // Simple validation
                if ('questions' in importedState && 'students' in importedState) {
                    dispatch({ type: 'SET_STATE', payload: importedState as AppState });
                } else {
                    throw new Error("Invalid file format");
                }
            } catch (error) {
                console.error('Error importing file:', error);
                alert("Failed to import file. Make sure it's a valid session file.");
            }
        };
        reader.readAsText(file);
        event.target.value = ''; // Reset input
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
        <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg shadow-md mb-8">
            <h2 className="text-xl font-semibold mb-3 text-white">Session Management</h2>
            <div className="flex flex-wrap gap-2">
                <button onClick={handleSaveToCloud} className="px-3 py-1.5 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700" title="Save a backup of your current state to the cloud">Save to Cloud</button>
                <button onClick={handleLoadFromCloud} className="px-3 py-1.5 text-sm font-medium rounded-md text-white bg-blue-500 hover:bg-blue-600" title="Load a previously saved backup from the cloud">Load from Cloud</button>
                <button onClick={handleExportJson} className="px-3 py-1.5 text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600">Export as File</button>
                <button onClick={() => importInputRef.current?.click()} className="px-3 py-1.5 text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 cursor-pointer">
                    Import from File
                </button>
                <input type="file" ref={importInputRef} className="hidden" accept=".json" onChange={handleImportJson} />
                <button onClick={handleReset} className={`px-3 py-1.5 text-sm font-medium rounded-md text-white transition-colors ${confirmReset ? 'bg-yellow-600 hover:bg-yellow-500' : 'bg-red-800 hover:bg-red-700'}`} title="Clear all data and start a new exam">
                    {confirmReset ? 'Confirm Reset?' : 'Reset All Data'}
                </button>
            </div>
        </div>
    );
};

export default SessionManager;