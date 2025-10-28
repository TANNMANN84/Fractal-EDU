// src/components/analysis/TagFilter.tsx

import React, { useMemo, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Student } from '../../types';

const TagFilter: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const activeExam = state.activeExamId ? state.exams.find(e => e.id === state.activeExamId) : null;
  const examStudents = activeExam?.students || [];
  const { activeTags } = state;
  const [selectedClass, setSelectedClass] = useState('all');

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    examStudents.forEach((s: Student) => {
      s.tags?.forEach((tag: string) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [examStudents]);

  const allClassNames = useMemo(() => {
    const classSet = new Set<string>();
    examStudents.forEach((s: Student) => {
      if (s.className) classSet.add(s.className);
    });
    return Array.from(classSet).sort();
  }, [examStudents]);

  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newClass = e.target.value;
    setSelectedClass(newClass);
    const classTags = newClass === 'all' ? [] : [newClass];
    // For simplicity, we'll treat the class as a special tag.
    // This assumes class names won't conflict with other tags.
    dispatch({ type: 'SET_ACTIVE_TAGS', payload: classTags });
  };

  const toggleTag = (tag: string) => {
    dispatch({
      type: 'SET_ACTIVE_TAGS',
      payload: activeTags.includes(tag)
        ? activeTags.filter((t) => t !== tag)
        : [...activeTags, tag],
    });
  };

  if (allTags.length === 0 && allClassNames.length === 0) {
    return null; // Don't show if no tags are in use
  }

  return (
    <div id="tag-filter-container" className="mb-4">
      <div className="flex flex-wrap gap-x-6 gap-y-2 items-center">
        {allClassNames.length > 0 && (
          <div className="flex items-center gap-2">
            <label htmlFor="class-filter-exam" className="text-sm font-medium text-gray-400">Filter by Class:</label>
            <select id="class-filter-exam" value={selectedClass} onChange={handleClassChange} className="bg-gray-700 text-white text-sm rounded-md p-1 border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500">
              <option value="all">All Students</option>
              {allClassNames.map(name => <option key={name} value={name}>{name}</option>)}
            </select>
          </div>
        )}

        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm font-medium text-gray-400">Filter by Tag:</span>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1 text-sm font-medium rounded-full ${
                  activeTags.includes(tag)
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {activeTags.length > 0 && !allClassNames.includes(activeTags[0]) && (
            <button
              onClick={() => dispatch({ type: 'SET_ACTIVE_TAGS', payload: [] })}
              className="px-3 py-1 text-sm font-medium rounded-full text-red-400 hover:bg-red-900/50"
            >
              Clear Tag Filters
            </button>
          )}
      </div>
    </div>
  );
};

export default TagFilter;