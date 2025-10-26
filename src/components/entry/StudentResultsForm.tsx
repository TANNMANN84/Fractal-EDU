import React, { useMemo, useEffect, useRef } from 'react';
import { produce } from 'immer';
import { useAppContext } from '../../context/AppContext';
import { getLeafQuestions, getColorForScore, createStudentObject } from '../../utils/helpers';
import { Student } from '../../types';

const StudentResultsForm: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const activeStudent = state.examStudents.find(s => s.id === state.selectedStudentId);
    const formRef = useRef<HTMLDivElement>(null);
    
    const leafQuestions = useMemo(() => getLeafQuestions(state.questions), [state.questions]);
    
    const { totalScore, totalMax } = useMemo(() => { // Added Question type
        if (!activeStudent) return { totalScore: 0, totalMax: 0 }; 
        const totalMax = leafQuestions.reduce((sum, q) => sum + Number(q.maxMarks || 0), 0);
        const totalScore = leafQuestions.reduce((sum, q) => sum + (activeStudent.responses[q.id] || 0), 0);
        return { totalScore, totalMax };
    }, [activeStudent, leafQuestions]);


    const handleStudentFieldChange = (field: 'lastName' | 'firstName' | 'tags', value: string) => {
        if (!activeStudent) return;
        const updatedStudent = produce(activeStudent, draft => {
            if (field === 'tags') {
                draft.tags = value.split(',').map(tag => tag.trim()).filter(Boolean);
            } else {
                draft[field] = value;
            }
        });
        dispatch({ type: 'UPDATE_STUDENT', payload: { student: updatedStudent, mode: 'exam' }});
    };
    
    const handleScoreChange = (questionId: string, value: string) => {
        if (!activeStudent) return;
        const question = leafQuestions.find(q => q.id === questionId);
        if (!question) return;

        const score = value === '' ? null : parseFloat(value);
        const updatedStudent = produce(activeStudent, draft => {
            if (score === null) {
                delete draft.responses[questionId];
            } else {
                draft.responses[questionId] = Math.max(0, Math.min(score, Number(question.maxMarks)));
            }
        });
        dispatch({ type: 'UPDATE_STUDENT', payload: { student: updatedStudent, mode: 'exam' } });
    };
    
    const handleMcqChange = (questionId: string, value: string) => {
        if (!activeStudent) return;
        const question = leafQuestions.find(q => q.id === questionId);
        if (!question) return;

        const answer = value.toUpperCase();
        const updatedStudent = produce(activeStudent, draft => {
            if (answer === '') {
                delete draft.mcqResponses[questionId];
                delete draft.responses[questionId];
            } else {
                draft.mcqResponses[questionId] = answer; // Store the MCQ answer
                draft.responses[questionId] = answer === question.correctAnswer ? 1 : 0; // Store the score (1 or 0) in responses
            }
        });
        dispatch({ type: 'UPDATE_STUDENT', payload: { student: updatedStudent, mode: 'exam' } });
    };

    const navigateStudent = (direction: 'next' | 'prev') => {
        const currentIndex = state.examStudents.findIndex(s => s.id === state.selectedStudentId);
        if (direction === 'next') {
            if (currentIndex < state.examStudents.length - 1) {
                dispatch({ type: 'SET_SELECTED_STUDENT', payload: state.examStudents[currentIndex + 1].id });
            } else {
                dispatch({ type: 'ADD_STUDENT', payload: { mode: 'exam' }});
            }
        } else {
            if (currentIndex > 0) {
                 dispatch({ type: 'SET_SELECTED_STUDENT', payload: state.examStudents[currentIndex - 1].id });
            }
        }
    };
    
    useEffect(() => {
        // Focus the first input when student changes
        const firstInput = formRef.current?.querySelector('input[data-question-index="0"]');
        (firstInput as HTMLInputElement)?.focus();
        (firstInput as HTMLInputElement)?.select();
    }, [activeStudent?.id]);


    if (!activeStudent) return null;
    
    const perc = totalMax > 0 ? (totalScore / totalMax * 100) : 0;
    const scoreColor = perc >= 80 ? 'text-green-400' : perc < 50 ? 'text-red-400' : 'text-yellow-400';

    return (
        <div className="bg-gray-900/50 p-6 rounded-lg" ref={formRef}>
            <div className="flex flex-col sm:flex-row gap-4 mb-6 pb-6 border-b border-gray-700">
                <div className="flex-1"> 
                    <label className="block text-sm font-medium text-gray-400">Last Name</label>
                    <input type="text" value={activeStudent.lastName || ''} onChange={e => handleStudentFieldChange('lastName', e.target.value)} className="mt-1 w-full bg-gray-700 p-2 rounded-md" />
                </div>
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-400">First Name</label>
                    <input type="text" value={activeStudent.firstName || ''} onChange={e => handleStudentFieldChange('firstName', e.target.value)} className="mt-1 w-full bg-gray-700 p-2 rounded-md" />
                </div>
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-400">Tags (comma-separated)</label>
                    <input type="text" value={(activeStudent.tags || []).join(', ')} onChange={e => handleStudentFieldChange('tags', e.target.value)} className="mt-1 w-full bg-gray-700 p-2 rounded-md" />
                </div>
                 <div className="flex-shrink-0 text-right">
                    <label className="block text-sm font-medium text-gray-400">Total Score</label>
                     <div className={`text-lg font-bold mt-1 ${scoreColor}`}>{`${totalScore.toFixed(1)} / ${totalMax.toFixed(1)} (${perc.toFixed(1)}%)`}</div>
                </div>
            </div>

            <div className="space-y-1 max-h-[50vh] overflow-y-auto pr-2">
                {leafQuestions.map((q, index) => {
                    const tooltipText = `Type: ${q.type === 'mcq' ? `MCQ (Ans: ${q.correctAnswer})` : 'Standard'}\nModule: ${q.module?.join(', ') || 'N/A'}\nContent: ${q.contentArea?.join(', ') || 'N/A'}\nOutcome: ${q.outcome?.join(', ') || 'N/A'}\nVerb: ${q.cognitiveVerb?.join(', ') || 'N/A'}\nNotes: ${q.notes || 'N/A'}`;
                    
                    return (
                        <div key={q.id} className="flex items-center gap-4 py-2 border-b border-gray-700">
                            <div className="flex-shrink-0 w-24 text-sm font-semibold text-gray-300 tooltip">
                                {q.displayNumber?.replace('Q', 'Q ')}
                                <span className="tooltiptext" dangerouslySetInnerHTML={{__html: tooltipText.replace(/\n/g, '<br>')}} />
                            </div>
                            <div className="flex-grow">
                                {q.type === 'mcq' ? (
                                     <input 
                                        type="text" 
                                        maxLength={1} 
                                        className="w-full p-2 text-center text-sm rounded-md text-white border-gray-600 bg-gray-700 uppercase"
                                        value={activeStudent.mcqResponses[q.id] || ''} 
                                        onChange={e => handleMcqChange(q.id, e.target.value)}
                                        data-question-index={index}
                                    />
                                ) : (
                                    <input 
                                        type="number" 
                                        step="0.5" 
                                        className="w-full p-2 text-center text-sm rounded-md text-white border-gray-600 bg-gray-700"
                                        value={activeStudent.responses[q.id] ?? ''} 
                                        min="0" max={q.maxMarks || 0}
                                        onChange={e => handleScoreChange(q.id, e.target.value)}
                                        onBlur={e => handleScoreChange(q.id, e.target.value)} // Ensure clamped value is saved
                                        data-question-index={index}
                                    />
                                )}
                            </div>
                            <div className={`w-16 text-center p-2 rounded-md ${getColorForScore(activeStudent.responses[q.id], q.maxMarks)}`}>
                                / {q.maxMarks || 0}
                            </div>
                        </div>
                    )
                })}
            </div>

            <div className="flex justify-between mt-6 pt-6 border-t border-gray-700">
                <button onClick={() => navigateStudent('prev')} className="px-4 py-2 text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-500 disabled:opacity-50" disabled={state.examStudents.findIndex(s => s.id === state.selectedStudentId) === 0}>Previous</button>
                <button onClick={() => navigateStudent('next')} className="px-4 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">Save & Next</button>
            </div>
        </div>
    );
};

export default StudentResultsForm;