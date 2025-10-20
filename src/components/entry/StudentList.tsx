import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import Modal from '../../components/Modal';
import { createStudentObject } from '../../utils/helpers';
import { Student } from '../../types';

const StudentList: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const [isBulkAddOpen, setIsBulkAddOpen] = useState(false);
    const [bulkText, setBulkText] = useState('');

    const handleSelectStudent = (id: string) => {
        dispatch({ type: 'SET_SELECTED_STUDENT', payload: id });
    };

    const handleAddStudent = () => {
        dispatch({ type: 'ADD_STUDENT' });
    };

    const handleRemoveStudent = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        dispatch({ type: 'REMOVE_STUDENT', payload: id });
    };
    
    const handleToggleDeleteMode = () => {
        dispatch({ type: 'SET_DELETE_MODE', payload: !state.deleteMode });
    };

    const processBulkAdd = () => {
        const names = bulkText.split('\n').filter(name => name.trim() !== '');
        const newStudents: Student[] = names.map(name => {
            const newStudent = createStudentObject();
            if (name.includes(',')) {
                const parts = name.split(',');
                newStudent.lastName = parts[0].trim();
                newStudent.firstName = parts.slice(1).join(' ').trim();
            } else {
                const parts = name.split(' ');
                newStudent.firstName = parts[0].trim();
                newStudent.lastName = parts.slice(1).join(' ').trim();
            }
            return newStudent;
        });

        if (newStudents.length > 0) {
            dispatch({ type: 'BULK_ADD_STUDENTS', payload: newStudents });
        }
        setBulkText('');
        setIsBulkAddOpen(false);
    };


    return (
        <>
            <h3 className="text-lg font-semibold mb-3 text-white">Class List</h3>
            <div className="space-y-1 mb-4 max-h-96 overflow-y-auto">
                {state.students.map(s => (
                    <div
                        key={s.id}
                        onClick={() => handleSelectStudent(s.id)}
                        className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${s.id === state.selectedStudentId ? 'bg-indigo-600 text-white' : 'hover:bg-gray-700'}`}
                    >
                        <span>{s.lastName || s.firstName ? `${s.lastName || ''}, ${s.firstName || ''}`.trim() : 'Unnamed Student'}</span>
                        {state.deleteMode && (
                            <button onClick={(e) => handleRemoveStudent(e, s.id)} className="text-red-400 hover:text-red-300" title="Remove Student">✕</button>
                        )}
                    </div>
                ))}
            </div>
            <div className="space-y-2 pt-4 border-t border-gray-700">
                <div className="flex gap-2">
                    <button onClick={handleAddStudent} className="flex-1 inline-flex justify-center items-center px-3 py-1.5 border border-gray-600 text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600">Add Student</button>
                    <button onClick={() => setIsBulkAddOpen(true)} className="flex-1 inline-flex justify-center items-center px-3 py-1.5 border border-gray-600 text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600">Bulk Add</button>
                </div>
                <div className="flex items-center justify-center gap-2 pt-2">
                    <label className="text-sm font-medium text-red-400">Delete Mode:</label>
                    <button onClick={handleToggleDeleteMode} type="button" role="switch" aria-checked={state.deleteMode} className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent ${state.deleteMode ? 'bg-red-600' : 'bg-gray-600'} transition-colors duration-200 ease-in-out`}>
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${state.deleteMode ? 'translate-x-5' : 'translate-x-0'}`}></span>
                    </button>
                </div>
            </div>

            <Modal isOpen={isBulkAddOpen} onClose={() => setIsBulkAddOpen(false)} title="Bulk Add Students">
                <p className="text-sm text-gray-400 mb-2">Paste a list of names, one per line. Supported formats: "LastName, FirstName" or "FirstName LastName".</p>
                <textarea 
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    className="w-full h-40 p-2 rounded-md bg-gray-600 text-white border border-gray-500"
                    placeholder="Doe, John&#10;Jane Smith"
                ></textarea>
                <div className="mt-4 flex justify-end gap-2">
                    <button onClick={() => setIsBulkAddOpen(false)} className="px-3 py-1.5 text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600">Cancel</button>
                    <button onClick={processBulkAdd} className="px-3 py-1.5 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">Add Students</button>
                </div>
            </Modal>
        </>
    );
};

export default StudentList;