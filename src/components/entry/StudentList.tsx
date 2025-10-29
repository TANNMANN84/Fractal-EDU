import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import Modal from '../../components/Modal';
import { createStudentObject } from '../../utils/helpers';
import { Student, AppMode } from '../../types';

interface StudentListProps {
    studentList: Student[];
    mode: AppMode;
    isSelectable?: boolean; // Is the list for selecting a student (exam mode) or just display (rapid test mode)
}

const StudentList: React.FC<StudentListProps> = ({ studentList, mode, isSelectable = true }) => {
    const { state, dispatch } = useAppContext();
    const [isBulkAddOpen, setIsBulkAddOpen] = useState(false);
    const [bulkText, setBulkText] = useState('');
    const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
    const [editingStudent, setEditingStudent] = useState<Partial<Student> | null>(null);
    const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());

    const handleSelectStudent = (id: string) => {
        // Only allow selection in exam mode or if explicitly selectable
        if (isSelectable && editingStudentId !== id) {
            dispatch({ type: 'SET_SELECTED_STUDENT', payload: id });
        }
    };

    const handleAddStudent = () => {
        const newStudent = createStudentObject();
        dispatch({ type: 'ADD_STUDENT', payload: { mode: mode, student: newStudent } });
        // Enter edit mode for the new student
        setEditingStudentId(newStudent.id);
        setEditingStudent({ lastName: '', firstName: '', className: '' });
        setTimeout(() => {
            // Focus the new input field's first input
            (document.querySelector(`#student-edit-input-${newStudent.id} input`) as HTMLInputElement)?.focus();
        }, 100);
    };

    const handleRemoveStudent = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        dispatch({ type: 'REMOVE_STUDENT', payload: { studentId: id, mode } });
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
            dispatch({ type: 'BULK_ADD_STUDENTS', payload: { students: newStudents, mode } });
        }
        setBulkText('');
        setIsBulkAddOpen(false);
    };

    const handleEditClick = (e: React.MouseEvent, student: Student) => {
        e.stopPropagation();
        setSelectedStudents(new Set()); // Clear multi-selection
        setEditingStudentId(student.id);
        setEditingStudent({ ...student });
    };

    const handleCancelEdit = () => {
        setEditingStudentId(null);
        setEditingStudent(null);
    };

    const handleSaveEdit = (studentId: string) => {
        const student = studentList.find(s => s.id === studentId);
        if (!student || !editingStudent) return;

        const updatedStudent: Student = {
            ...student,
            lastName: editingStudent.lastName || '',
            firstName: editingStudent.firstName || '',
            className: editingStudent.className?.trim() || '',
        };

        dispatch({ type: 'UPDATE_STUDENT', payload: { student: updatedStudent, mode } });
        handleCancelEdit();
    };

    const handleMultiSelectToggle = (studentId: string) => {
        const newSelection = new Set(selectedStudents);
        if (newSelection.has(studentId)) {
            newSelection.delete(studentId);
        } else {
            newSelection.add(studentId);
        }
        setSelectedStudents(newSelection);
    };

    const handleMoveSelected = () => {
        if (selectedStudents.size === 0) {
            alert('Please select students to move.');
            return;
        }
        const newClassName = prompt('Enter the new class name for the selected students:');
        if (newClassName !== null) { // Allow empty string to unassign
            studentList.forEach(student => {
                if (selectedStudents.has(student.id)) {
                    const updatedStudent = { ...student, className: newClassName.trim() };
                    dispatch({ type: 'UPDATE_STUDENT', payload: { student: updatedStudent, mode } });
                }
            });
            setSelectedStudents(new Set());
        }
    };

    const studentsByClass = useMemo(() => {
        const grouped: { [className: string]: Student[] } = {};
        studentList.forEach(student => {
            const className = student.className || 'Unassigned';
            if (!grouped[className]) {
                grouped[className] = [];
            }
            grouped[className].push(student);
        });
        // Sort class names, putting "Unassigned" last
        const sortedClassNames = Object.keys(grouped).sort((a, b) => {
            if (a === 'Unassigned') return 1;
            if (b === 'Unassigned') return -1;
            return a.localeCompare(b);
        });

        const result: Array<[string, Student[]]> = [];
        sortedClassNames.forEach(className => {
            result.push([className, grouped[className].sort((a,b) => a.lastName.localeCompare(b.lastName))]);
        });
        return result;

    }, [studentList]);

    // Focus input when editing starts
    useEffect(() => {
        if (editingStudentId) {
            document.getElementById(`student-edit-input-${editingStudentId}`)?.focus();
        }
    }, [editingStudentId]);

    // Determine cursor style based on mode
    const cursorClass = isSelectable ? 'cursor-pointer' : 'cursor-default';

    return (
        <>
            <h3 className="text-lg font-semibold mb-3 text-white">Class List</h3>
            <div className="space-y-2 mb-4 max-h-96 overflow-y-auto">
                {studentsByClass.map(([className, students]) => (
                    // --- Wrap each class group in <details> ---
                    <details key={className} className="bg-gray-700/30 rounded-md border border-gray-700/50 group" open> {/* Default to open */}
                        <summary className="flex items-center justify-between p-2 cursor-pointer list-none hover:bg-gray-700/50 rounded-t-md">
                            <h4 className="text-sm font-bold text-indigo-300">
                                {className} ({students.length})
                            </h4>
                            {/* Chevron icon */}
                            <span className="text-gray-400 group-open:rotate-90 transition-transform duration-200">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                            </span>
                        </summary>
                        {/* Student list within the details element */}
                        <div className="border-t border-gray-700/50">
                            {students.map(s => (
                                <div
                                    key={s.id}
                                    onClick={() => handleSelectStudent(s.id)}
                                    // Removed border-t/b/l/r, added border-b inside details
                                    className={`flex items-center justify-between p-2 transition-colors border-b border-gray-800/50 last:border-b-0 ${cursorClass} ${ editingStudentId === s.id ? 'bg-gray-700' : (s.id === state.selectedStudentId && isSelectable) ? 'bg-indigo-600 text-white' : 'hover:bg-gray-700/40' }`}
                                >
                                    <div className="flex items-center gap-2 flex-grow min-w-0"> {/* Added min-w-0 */}
                                        {/* Conditionally render checkbox only in exam mode or if selectable */}
                                        {isSelectable && (
                                            <input
                                                type="checkbox"
                                                checked={selectedStudents.has(s.id)}
                                                onChange={(e) => { e.stopPropagation(); handleMultiSelectToggle(s.id); }} // Stop propagation
                                                onClick={(e) => e.stopPropagation()} // Stop propagation on click too
                                                className="form-checkbox h-4 w-4 text-indigo-600 bg-gray-800 border-gray-600 rounded focus:ring-indigo-500 flex-shrink-0" // Added flex-shrink-0
                                            />
                                        )}
                                        {editingStudentId === s.id ? (
                                            <div id={`student-edit-input-${s.id}`} className="flex gap-2 w-full">
                                                <input type="text" value={editingStudent?.lastName || ''} onChange={e => setEditingStudent(p => ({...p, lastName: e.target.value}))} className="w-full bg-gray-600 text-white p-1 rounded-md text-sm" placeholder="Last Name" autoFocus />
                                                <input type="text" value={editingStudent?.firstName || ''} onChange={e => setEditingStudent(p => ({...p, firstName: e.target.value}))} className="w-full bg-gray-600 text-white p-1 rounded-md text-sm" placeholder="First Name" />
                                                {/* Allow saving class name here too */}
                                                <input type="text" value={editingStudent?.className || ''} onChange={e => setEditingStudent(p => ({...p, className: e.target.value}))} onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(s.id)} onBlur={() => handleSaveEdit(s.id)} className="w-full bg-gray-600 text-white p-1 rounded-md text-sm" placeholder="Class Name" />
                                            </div>
                                        ) : (
                                            // Added truncate for long names
                                            <span className="truncate">{s.lastName || s.firstName ? `${s.lastName || ''}, ${s.firstName || ''}`.trim() : 'Unnamed Student'}</span>
                                        )}
                                    </div>
                                    {editingStudentId !== s.id && (
                                        <div className="flex items-center gap-1 flex-shrink-0"> {/* Reduced gap */}
                                            {!state.deleteMode && (
                                                <button onClick={(e) => handleEditClick(e, s)} className="text-gray-400 hover:text-white text-xs opacity-50 hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-gray-600" title="Edit Student">✏️</button>
                                            )}
                                            {state.deleteMode && (
                                                <button onClick={(e) => handleRemoveStudent(e, s.id)} className="text-red-400 hover:text-red-300 p-0.5 rounded hover:bg-red-900/50" title="Remove Student">✕</button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </details>
                ))}
            </div>
            {/* --- Action buttons remain the same --- */}
            <div className="space-y-2 pt-4 border-t border-gray-700">
                <div className="flex gap-2">
                    <button onClick={handleAddStudent} className="flex-1 inline-flex justify-center items-center px-3 py-1.5 border border-gray-600 text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600">Add Student</button>
                    <button onClick={() => setIsBulkAddOpen(true)} className="flex-1 inline-flex justify-center items-center px-3 py-1.5 border border-gray-600 text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600">Bulk Add</button>
                </div>
                {/* Conditionally show move button only if selectable */}
                {isSelectable && selectedStudents.size > 0 && (
                    <button onClick={handleMoveSelected} className="w-full inline-flex justify-center items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                        Move {selectedStudents.size} Selected to Class...
                    </button>
                )}
                <div className="flex items-center justify-center gap-2 pt-2">
                    <label className="text-sm font-medium text-red-400">Delete Mode:</label>
                    <button onClick={handleToggleDeleteMode} type="button" role="switch" aria-checked={state.deleteMode} className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent ${state.deleteMode ? 'bg-red-600' : 'bg-gray-600'} transition-colors duration-200 ease-in-out`}>
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${state.deleteMode ? 'translate-x-5' : 'translate-x-0'}`}></span>
                    </button>
                </div>
            </div>

            {/* --- Modal remains the same --- */}
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
