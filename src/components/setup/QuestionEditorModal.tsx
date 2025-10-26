import React, { useState, useEffect, useMemo } from 'react';
import { produce, Draft } from 'immer';
import { useAppContext } from '../../context/AppContext';
import { Question } from '../../types';
import { createQuestionObject, findQuestionById, findQuestionAndParent, getQuestionPath, toRomanNumeral, updateParentQuestionData, getAllQuestionsFlat } from '../../utils/helpers';
import { syllabusData, wsOutcomes } from '../../data/syllabusData';
import Modal from '../Modal';

interface AccordionSectionProps {
  title: string;
  children: React.ReactNode;
}

const AccordionSection: React.FC<AccordionSectionProps> = ({ title, children }) => (
    <details className="bg-gray-800 border border-gray-700 rounded-lg" name="accordion">
        <summary className="p-3 cursor-pointer font-medium text-gray-300 flex items-center gap-2">
            <span className="chevron w-5 h-5 text-gray-400 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
            </span>
            <span>{title}</span>
        </summary>
        <div className="p-3 border-t border-gray-700">{children}</div>
    </details>
);

interface QuestionEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    questionId: string | null;
    parentId: string | null;
}

const QuestionEditorModal: React.FC<QuestionEditorModalProps> = ({ isOpen, onClose, questionId, parentId }) => {
    const { state, dispatch } = useAppContext();
    const [question, setQuestion] = useState<Question | null>(null);

    const { isNew, fullTitle } = useMemo(() => {
        let isNew = false;
        let title = "Edit Question";
        let path: Question[] | null = [];
        if (questionId) {
            path = getQuestionPath(questionId, state.questions);
        } else if (parentId && question) {
            isNew = true;
            path = getQuestionPath(parentId, state.questions);
            if (path) path.push(question);
        } else if (question) {
            isNew = true;
            path = [question];
        }

        if (path && path.length > 0) {
            title = `${isNew ? 'Adding' : 'Editing'} Question ${path[0].number}`;
            for (let i = 1; i < path.length; i++) {
                title += `(${path[i].number})`;
            }
        }
        return { isNew, fullTitle: title };
    }, [questionId, parentId, state.questions, question]);

    useEffect(() => {
        if (isOpen) {
            if (questionId) {
                const existingQuestion = findQuestionById(questionId, state.questions);
                setQuestion(existingQuestion ? JSON.parse(JSON.stringify(existingQuestion)) : null);
            } else {
                const parent = parentId ? findQuestionById(parentId, state.questions) : null;
                let newNumber;
                if (parent) {
                    const parentLevel = findQuestionAndParent(parent.id, state.questions)?.parent ? 2 : 1;
                    const nextIndex = parent.subQuestions.length;
                    newNumber = parentLevel === 1 ? String.fromCharCode(97 + nextIndex) : toRomanNumeral(nextIndex + 1);
                } else {
                    newNumber = (state.questions.length + 1).toString();
                }
                setQuestion(createQuestionObject(newNumber));
            }
        } else {
            setQuestion(null);
        }
    }, [isOpen, questionId, parentId, state.questions]);
    
    const handleFieldChange = (field: keyof Question, value: any) => {
        if (!question) return;
        setQuestion(produce(question, (draft: Draft<Question>) => {
            (draft as any)[field] = value;
            if (field === 'type' && value === 'mcq') {
                draft.maxMarks = 1;
            }
        }));
    };

    const handleCheckboxChange = (field: 'module' | 'contentArea' | 'outcome' | 'cognitiveVerb', value: string) => {
        if (!question) return;
        const currentValues = question[field] || [];
        const newValues = currentValues.includes(value) ? currentValues.filter(v => v !== value) : [...currentValues, value];
        handleFieldChange(field, newValues);
    };

    const handleSave = (continueToNext = false) => {
        if (!question) return;

        const updatedQuestions = produce(state.questions, (draft: Draft<Question[]>) => {
            if (isNew) {
                if (parentId) {
                    const parent = findQuestionById(parentId, draft);
                    parent?.subQuestions.push(question);
                } else {
                    draft.push(question);
                }
            } else {
                const { parent } = findQuestionAndParent(questionId!, draft) || {};
                if (parent) {
                    const index = parent.subQuestions.findIndex((q: Draft<Question>) => q.id === questionId);
                    if (index > -1) parent.subQuestions[index] = question;
                } else {
                    const index = draft.findIndex((q: Draft<Question>) => q.id === questionId);
                    if (index > -1) draft[index] = question;
                }
            }
        });
        
        const finalQuestions = updateParentQuestionData(updatedQuestions);
        dispatch({ type: 'SET_QUESTIONS', payload: finalQuestions });
        
        if (continueToNext) {
            const allFlatQuestions = getAllQuestionsFlat(finalQuestions);
            const currentIndex = allFlatQuestions.findIndex(q => q.id === question.id);
            if (currentIndex > -1 && currentIndex < allFlatQuestions.length - 1) {
                const nextQuestion = allFlatQuestions[currentIndex + 1];
                 setQuestion(JSON.parse(JSON.stringify(nextQuestion)));
                 // Need to update questionId for the title
                 // This is tricky. A better approach might be to lift the editing state to the parent.
                 // For now, we close and the user can click the next one.
                 // A simple solution:
                 onClose();
                 // A more complex solution would require a callback to the parent to open the next modal.
            } else {
                onClose();
            }

        } else {
             onClose();
        }
    };
    
    if (!question) return null;

    const { parent } = questionId ? findQuestionAndParent(questionId, state.questions) || {} : { parent: null };
    const isMainQuestionInState = !parent;

    const renderSyllabusCheckboxes = () => {
        const syllabus = state.selectedSyllabus ? syllabusData[state.selectedSyllabus] : null;
        if (!syllabus) return <p className="text-sm text-gray-500">No syllabus selected.</p>;
        
        const CheckboxList = ({ items, field }: { items: string[], field: 'module' | 'contentArea' | 'outcome' | 'cognitiveVerb' }) => (
            <div className="w-full mt-1 rounded-md p-2 h-32 overflow-y-auto">
                {items.map(item => (
                    <label key={item} className="flex items-center space-x-2 text-sm p-1 rounded-md hover:bg-gray-700/50">
                        <input type="checkbox" checked={question[field]?.includes(item)} onChange={() => handleCheckboxChange(field, item)} className="rounded border-gray-500 bg-gray-600 text-indigo-500 shadow-sm focus:ring-indigo-500"/>
                        <span>{item}</span>
                    </label>
                ))}
            </div>
        );

        const selectedModules = syllabus.modules.filter((m: any) => question.module?.includes(m.name));
        const contentAreas = [...new Set<string>(selectedModules.flatMap((m: { contentAreas: string[] }) => m.contentAreas))];
        const outcomes = Array.from(new Set<string>(selectedModules.flatMap((m: { outcomes: string[] }) => {
            const isYr11 = parseInt(m.outcomes[0].split('-')[0], 10) === 11;
            const relevantWs = isYr11 ? wsOutcomes.yr11 : wsOutcomes.yr12;
            return [...relevantWs, ...m.outcomes].map(o => `${syllabus.prefix}${o}`);
        }))).sort();
        const cognitiveVerbs = ['Analyse', 'Calculate', 'Describe', 'Discuss', 'Evaluate', 'Explain', 'Identify', 'Justify', 'Outline', 'Predict'];

        return (
            <div className="space-y-2">
                <AccordionSection title="Module(s)"><CheckboxList items={syllabus.modules.map((m:any) => m.name)} field="module" /></AccordionSection>
                <AccordionSection title="Content Area(s)">{selectedModules.length > 0 ? <CheckboxList items={contentAreas} field="contentArea" /> : <p className="text-sm text-gray-500 p-2">Select module(s) to see options.</p>}</AccordionSection>
                <AccordionSection title="Syllabus Outcome(s)">{selectedModules.length > 0 ? <CheckboxList items={outcomes} field="outcome" /> : <p className="text-sm text-gray-500 p-2">Select module(s) to see options.</p>}</AccordionSection>
                <AccordionSection title="Cognitive Verb(s)"><CheckboxList items={cognitiveVerbs} field="cognitiveVerb" /></AccordionSection>
            </div>
        );
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={fullTitle} className="max-w-4xl">
             <div className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 pb-4 border-b border-gray-700">
                    <div>
                        <label className="text-xs font-medium text-gray-400">Question Number / Part Label</label>
                        <input type="text" value={question.number} onChange={(e) => handleFieldChange('number', e.target.value)} disabled={isNew ? false : isMainQuestionInState} className="mt-1 w-full rounded-md bg-gray-600 border-gray-500 shadow-sm p-2 text-white disabled:opacity-50"/>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-400">Question Type</label>
                        <select value={question.type} onChange={(e) => handleFieldChange('type', e.target.value)} className="mt-1 w-full rounded-md bg-gray-600 border-gray-500 shadow-sm p-2 text-white">
                            <option value="marks">Standard Marks</option>
                            <option value="mcq">Multiple Choice</option>
                        </select>
                    </div>
                     <div>
                        <label className="text-xs font-medium text-gray-400">Max Marks</label>
                         {question.subQuestions.length > 0 ? 
                            <div className="h-10 flex items-center justify-center bg-gray-800 rounded-md text-gray-400 text-sm mt-1">Calculated</div> :
                            <input type="number" value={question.maxMarks} onChange={(e) => handleFieldChange('maxMarks', parseFloat(e.target.value))} min="0" step="0.5" disabled={question.type === 'mcq'} className="mt-1 w-full rounded-md bg-gray-600 border-gray-500 shadow-sm p-2 text-white disabled:opacity-50"/>
                         }
                    </div>
                    {question.type === 'mcq' && (
                        <div>
                            <label className="text-xs font-medium text-gray-400">Correct Answer</label>
                            <input type="text" value={question.correctAnswer} onChange={(e) => handleFieldChange('correctAnswer', e.target.value.toUpperCase())} placeholder="e.g., C" className="mt-1 w-full rounded-md bg-gray-600 border-gray-500 shadow-sm p-2 text-white uppercase"/>
                        </div>
                    )}
                    <div className="md:col-span-4">
                        <label className="text-xs font-medium text-gray-400">Specifics/Notes</label>
                        <input type="text" value={question.notes} onChange={(e) => handleFieldChange('notes', e.target.value)} className="mt-1 w-full rounded-md bg-gray-600 border-gray-500 shadow-sm p-2 text-white"/>
                    </div>
                </div>
                {question.subQuestions.length > 0 ? 
                    <div className="text-center p-4 bg-gray-800 rounded-md text-gray-400 text-sm">Syllabus details for this question are managed by its sub-questions.</div> :
                    renderSyllabusCheckboxes()
                }
             </div>
             <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-600">
                <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600">Cancel</button>
                <button onClick={() => handleSave(true)} className="px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-500 hover:bg-blue-600">Save & Continue to Next Question</button>
                <button onClick={() => handleSave(false)} className="px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">Save & Close</button>
            </div>
        </Modal>
    );
};

export default QuestionEditorModal;