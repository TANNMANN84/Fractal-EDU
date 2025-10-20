import React, { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import QuestionStructure from '@/components/setup/QuestionStructure';
import ExamBuilderModal from '@/components/setup/ExamBuilderModal';
import { useTemplates } from '@/hooks/useTemplates';

interface SetupSectionProps {
    onFinalize: () => void;
}

const SetupSection = ({ onFinalize }: SetupSectionProps) => {
    const { state, dispatch } = useAppContext(); // Keep this for syllabus and lock state
    const [isExamBuilderOpen, setIsExamBuilderOpen] = useState(false);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [newTemplateName, setNewTemplateName] = useState('');
    const { templates, saveTemplate, loadTemplate, deleteTemplate } = useTemplates();

    const handleSyllabusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        dispatch({ type: 'SET_SYLLABUS', payload: e.target.value });
    };

    const handleLockToggle = () => {
        dispatch({ type: 'SET_STRUCTURE_LOCKED', payload: !state.structureLocked });
    };

    const handleSaveTemplate = () => {
        if (saveTemplate(newTemplateName)) {
            setNewTemplateName('');
        }
    };

    const handleLoadTemplate = (name: string) => {
        loadTemplate(name);
        setIsTemplateModalOpen(false);
    };
    

    return (
        <>
            <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg shadow-md mb-8">
                <div className="flex flex-wrap justify-between items-center mb-4 border-b border-gray-600 pb-3 gap-2">
                    <h2 className="text-2xl font-semibold text-white">1. Exam Structure Setup</h2>
                    <button 
                        onClick={handleLockToggle} 
                        className={`px-3 py-1.5 text-sm font-medium rounded-md text-white transition-colors ${state.structureLocked ? 'bg-green-600 hover:bg-green-500' : 'bg-yellow-600 hover:bg-yellow-500'}`}
                    >
                        {state.structureLocked ? 'Unlock Structure' : 'Lock Structure'}
                    </button>
                </div>

                <div className={`transition-opacity ${state.structureLocked ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="mb-6">
                        <label htmlFor="syllabus-select" className="block text-sm font-medium text-gray-300">Pre-populate Topics (NSW Science Syllabus)</label>
                        <select
                            id="syllabus-select"
                            value={state.selectedSyllabus}
                            onChange={handleSyllabusChange}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-gray-700 border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md text-white"
                        >
                            <option value="" disabled>Select a Syllabus...</option>
                            <option value="chemistry">Chemistry</option>
                            <option value="biology">Biology</option>
                            <option value="physics">Physics</option>
                            <option value="investigating">Investigating Science</option>
                            <option value="ees">Earth & Environmental Science</option>
                        </select>
                    </div>

                    <div className="space-y-2 min-h-[100px]">
                        <QuestionStructure />
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-700 space-y-6">
                        <button onClick={() => setIsExamBuilderOpen(true)} className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            Build Exam Structure
                        </button>
                         <div className="flex flex-wrap justify-between items-center gap-4">
                           <div>
                                <button onClick={() => setIsTemplateModalOpen(true)} className="inline-flex items-center px-3 py-1.5 border border-gray-600 text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600">Manage Templates</button>
                           </div>
                          <button onClick={onFinalize} className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                                Finalise and Proceed
                          </button>
                     </div>
                    </div>
                </div>
            </div>
            
            <ExamBuilderModal isOpen={isExamBuilderOpen} onClose={() => setIsExamBuilderOpen(false)} />

            {/* Template Modal */}
            {isTemplateModalOpen && (
                 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm" onClick={() => setIsTemplateModalOpen(false)}>
                    <div className="bg-gray-800 border-gray-700 rounded-lg shadow-xl m-4 w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <div className="p-6">
                             <h3 className="text-xl font-semibold text-white mb-4">Manage Templates</h3>
                             <div className="space-y-2 max-h-60 overflow-y-auto">
                                 {Object.keys(templates).length === 0 ? <p className="text-gray-400">No saved templates.</p> :
                                  Object.keys(templates).map(name => (
                                     <div key={name} className="flex justify-between items-center p-2 bg-gray-700 rounded-md">
                                         <span>{name}</span>
                                         <div>
                                             <button onClick={() => handleLoadTemplate(name)} className="text-blue-400 hover:text-blue-300 px-2">Load</button>
                                             <button onClick={() => deleteTemplate(name)} className="text-red-400 hover:text-red-300 px-2">Delete</button>
                                         </div>
                                     </div>
                                 ))}
                             </div>
                             <div className="mt-4 flex gap-2">
                                 <input type="text" value={newTemplateName} onChange={e => setNewTemplateName(e.target.value)} placeholder="New template name..." className="block w-full rounded-md bg-gray-600 border-gray-500 p-2 text-white" />
                                 <button onClick={handleSaveTemplate} className="px-3 py-1.5 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">Save New</button>
                             </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default SetupSection;