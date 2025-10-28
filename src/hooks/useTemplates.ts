import { useState, useCallback } from 'react';
import { Template } from '@/types';
import { useAppContext } from '@/context/AppContext';

export const useTemplates = () => {
    const { state, dispatch } = useAppContext();
    const [templates, setTemplates] = useState<Record<string, Template>>(() =>
        JSON.parse(localStorage.getItem('examTrackerTemplates') || '{}')
    );

    const saveTemplatesToStorage = useCallback((newTemplates: Record<string, Template>) => {
        localStorage.setItem('examTrackerTemplates', JSON.stringify(newTemplates));
        setTemplates(newTemplates);
    }, []);

    const saveTemplate = (name: string) => {
        if (!name.trim()) {
            alert('Please provide a template name.');
            return false;
        }
        const activeExam = state.activeExamId ? state.exams.find(e => e.id === state.activeExamId) : null;
        if (!activeExam || activeExam.questions.length === 0) {
            alert('Cannot save an empty structure as a template.');
            return false;
        }
        const newTemplates = { ...templates, [name]: { questions: activeExam.questions, selectedSyllabus: activeExam.selectedSyllabus } };
        saveTemplatesToStorage(newTemplates);
        return true;
    };

    const loadTemplate = (name: string, examId: string) => {
        const template = templates[name];
        if (template) {
            dispatch({ type: 'SET_QUESTIONS', payload: { examId, questions: template.questions } });
            dispatch({ type: 'SET_SYLLABUS', payload: { examId, syllabus: template.selectedSyllabus } });
        }
    };

    const deleteTemplate = (name: string) => {
        const newTemplates = { ...templates };
        delete newTemplates[name];
        saveTemplatesToStorage(newTemplates);
    };

    return { templates, saveTemplate, loadTemplate, deleteTemplate };
};