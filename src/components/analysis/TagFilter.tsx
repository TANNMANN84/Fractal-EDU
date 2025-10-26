// src/components/analysis/TagFilter.tsx

import React, { useContext, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Student } from '../../types';

const TagFilter: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const { examStudents, activeTags } = state;

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    examStudents.forEach((s: Student) => {
      s.tags?.forEach((tag: string) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort(); // Use examStudents instead of students
  }, [examStudents]);

  const toggleTag = (tag: string) => {
    dispatch({
      type: 'SET_ACTIVE_TAGS',
      payload: activeTags.includes(tag)
        ? activeTags.filter((t) => t !== tag)
        : [...activeTags, tag],
    });
  };

  if (allTags.length === 0) {
    return null; // Don't show if no tags are in use
  }

  return (
    <div id="tag-filter-container" className="mb-4">
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
        {activeTags.length > 0 && (
          <button
            onClick={() => dispatch({ type: 'SET_ACTIVE_TAGS', payload: [] })}
            className="px-3 py-1 text-sm font-medium rounded-full text-red-400 hover:bg-red-900/50"
          >
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
};

export default TagFilter;