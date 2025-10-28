// src/components/analysis/IndividualAnalysis.tsx

import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Student, AppState } from '../../types'; // Import AppState
import IndividualAnalysisCharts from './IndividualAnalysisCharts';
import { generateExamAnalysisReport } from '../../utils/pdfUtils';

const IndividualAnalysis: React.FC = () => {
  const { state } = useAppContext();
  const activeExam = state.activeExamId ? state.exams.find(e => e.id === state.activeExamId) : null;
  const examStudents = activeExam?.students || [];
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  const activeStudents = useMemo(() => {
    return examStudents
      .filter((s: Student) => s.lastName && s.firstName)
      .sort((a: Student, b: Student) => a.lastName.localeCompare(b.lastName));
  }, [examStudents]);

  const selectedStudents = useMemo(() => {
    return activeStudents.filter((s: Student) =>
      selectedStudentIds.includes(s.id)
    );
  }, [activeStudents, selectedStudentIds]);

  const handleSelectionChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const selectedOptions = Array.from(
      e.target.selectedOptions,
      (option) => option.value
    );
    setSelectedStudentIds(selectedOptions);
  };

  const getTitle = () => {
    if (selectedStudents.length > 1) {
      return 'Comparative Student Analysis';
    }
    if (selectedStudents.length === 1) {
      return 'Individual Student Analysis';
    }
    return 'Individual Student Analysis';
  };

  const handleGenerateReport = () => {
    if (selectedStudents.length === 0) return;
    const isIndividual = selectedStudents.length === 1;
    const title = isIndividual ? `Report for ${selectedStudents[0].firstName} ${selectedStudents[0].lastName}` : 'Comparative Analysis';
    generateExamAnalysisReport(isIndividual, title);
  };

  if (activeStudents.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 pt-6 border-t border-gray-700">
      <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
        <h3
          id="individual-analysis-title"
          className="text-xl font-semibold text-white"
        >
          {getTitle()}
        </h3>
        <h3
          onClick={handleGenerateReport}
          className="px-3 py-1.5 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
        >
          Generate PDF
        </h3>
      </div>
      <label
        htmlFor="student-select-for-analysis"
        className="block text-sm font-medium text-gray-400 mb-1"
      >
        Select student(s) (hold Ctrl/Cmd to select multiple)
      </label>
      <select
        id="student-select-for-analysis"
        multiple
        value={selectedStudentIds}
        onChange={handleSelectionChange}
        className="block w-full max-w-xs pl-3 pr-10 py-2 text-base bg-gray-700 border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md text-white"
      >
        {activeStudents.map((s: Student) => (
          <option key={s.id} value={s.id}>
            {s.lastName}, {s.firstName}
          </option>
        ))}
      </select>
      <div id="individual-analysis-content" className="mt-4">
        <IndividualAnalysisCharts selectedStudents={selectedStudents} />
      </div>
    </div>
  );
};

export default IndividualAnalysis;