import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Question } from '../../types';
import QuestionEditorModal from '../../components/setup/QuestionEditorModal';
import { findQuestionAndParent, updateParentQuestionData } from '../../utils/helpers';

interface QuestionItemProps {
    question: Question;
    level: number;
    index: number;
    onEdit: (id: string) => void;
    onAddSub: (parentId: string) => void;
    onRemove: (id: string) => void;
}

const QuestionItem: React.FC<QuestionItemProps> = ({ question, level, index, onEdit, onAddSub, onRemove }) => {
    const isMainQuestion = level === 1;
    const hasSubQuestions = question.subQuestions.length > 0;
    const bgColor = isMainQuestion ? (index % 2 === 0 ? 'bg-gray-800/50' : 'bg-gray-900/30') : '';

    return (
        <div className={`question-level-${level} mt-2`}>
            <div className={`${bgColor} border border-gray-700 rounded-lg`}>
                <div className="flex w-full items-center gap-3 bg-gray-700/50 p-2 rounded-md">
                    <span className="font-semibold text-gray-300">{isMainQuestion ? `Q${question.number}` : `Part ${question.number}`}</span>
                    <span className="flex-1 text-sm text-gray-400 truncate">{question.notes || ''}</span>
                    <span className="text-sm font-semibold text-gray-300 rounded-md bg-gray-600 px-2 py-1">
                        {hasSubQuestions ? `Total: ${question.maxMarks}` : `Marks: ${question.maxMarks}`}
                    </span>
                    <div className="flex items-center space-x-1">
                        <button onClick={() => onEdit(question.id)} className="p-1.5 rounded-full hover:bg-gray-600 text-gray-300" title="Edit">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/><path fillRule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"/></svg>
                        </button>
                        {level < 3 && (
                            <button onClick={() => onAddSub(question.id)} className="p-1.5 rounded-full hover:bg-gray-600 text-indigo-400" title="Add Sub-part">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8"/></svg>
                            </button>
                        )}
                        <button onClick={() => onRemove(question.id)} className="p-1.5 rounded-full hover:bg-gray-600 text-red-400" title="Remove">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/></svg>
                        </button>
                    </div>
                </div>
                 <div className={`sub-questions-container ${level === 1 ? 'pl-4' : 'pl-2'}`}>
                    {hasSubQuestions && question.subQuestions.map((subQ, subIndex) => (
                        <QuestionItem key={subQ.id} question={subQ} level={level + 1} index={subIndex} {...{ onEdit, onAddSub, onRemove }} />
                    ))}
                </div>
            </div>
        </div>
    );
};


const QuestionStructure: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const [editingQuestion, setEditingQuestion] = useState<{ id: string | null; parentId: string | null }>({ id: null, parentId: null });

    const checkSyllabus = () => {
        if (!state.selectedSyllabus) {
            alert("Please select a syllabus first.");
            return false;
        }
        return true;
    };

    const handleEdit = (id: string) => {
        if (!checkSyllabus()) return;
        setEditingQuestion({ id, parentId: null });
    };

    const handleAddSub = (parentId: string) => {
        if (!checkSyllabus()) return;
        setEditingQuestion({ id: null, parentId });
    };

    const handleRemove = (id: string) => {
        const isMain = !findQuestionAndParent(id, state.questions)?.parent;
        const remove = (targetId: string, qs: Question[]): Question[] => {
            return qs.filter(q => {
                if (q.id === targetId) return false;
                q.subQuestions = remove(targetId, q.subQuestions);
                return true;
            });
        };
        
        let updatedQuestions = remove(id, state.questions);
        if (isMain) {
            updatedQuestions = updatedQuestions.map((q, i) => ({ ...q, number: (i + 1).toString() }));
        }
        
        const finalQuestions = updateParentQuestionData(updatedQuestions);
        dispatch({ type: 'SET_QUESTIONS', payload: finalQuestions });
    };

    const handleModalClose = () => {
        setEditingQuestion({ id: null, parentId: null });
        const finalQuestions = updateParentQuestionData(state.questions);
        dispatch({ type: 'SET_QUESTIONS', payload: finalQuestions });
    };

    return (
        <div>
            {state.questions.map((q: Question, index: number) => (
            <QuestionItem
                key={q.id}
                question={q}
                level={1}
                index={index}
                onEdit={handleEdit}
                onAddSub={handleAddSub}
                onRemove={handleRemove}
            />
            ))}
            {(editingQuestion.id || editingQuestion.parentId) && (
            <QuestionEditorModal
                isOpen={true}
                onClose={handleModalClose}
                questionId={editingQuestion.id}
                parentId={editingQuestion.parentId}
            />
            )}
        </div>
    );
};

export default QuestionStructure;