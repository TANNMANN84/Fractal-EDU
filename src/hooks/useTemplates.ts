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
        if (state.questions.length === 0) {
            alert('Cannot save an empty structure as a template.');
            return false;
        }
        const newTemplates = { ...templates, [name]: { questions: state.questions, selectedSyllabus: state.selectedSyllabus } };
        saveTemplatesToStorage(newTemplates);
        return true;
    };

    const loadTemplate = (name: string) => {
        const template = templates[name];
        if (template) {
            dispatch({ type: 'SET_QUESTIONS', payload: template.questions });
            dispatch({ type: 'SET_SYLLABUS', payload: template.selectedSyllabus });
        }
    };

    const deleteTemplate = (name: string) => {
        const newTemplates = { ...templates };
        delete newTemplates[name];
        saveTemplatesToStorage(newTemplates);
    };

    return { templates, saveTemplate, loadTemplate, deleteTemplate };
};