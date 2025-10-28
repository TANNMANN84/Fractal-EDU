// src/components/analysis/AnalysisDashboard.tsx

import React from 'react';
import { generateExamAnalysisReport } from '@/utils/pdfUtils';

// Import all the components
import ProblemQuestionsSummary from './ProblemQuestionsSummary';
import TagFilter from './TagFilter';
import ClassAnalysisCharts from './ClassAnalysisCharts';
import IndividualAnalysis from './IndividualAnalysis';
import DistractorAnalysis from './DistractorAnalysis';
import QuestionAnalysis from './QuestionAnalysis';

const AnalysisDashboard: React.FC = () => {
  // --- 2. CREATE HANDLER ---
  const handleGenerateClassReport = () => {
    // false = not an individual report, 'Class Performance' is the title
    generateExamAnalysisReport(false, 'Class Performance Analysis');
  };

  return (
    <>
      <div className="flex justify-between items-center border-b border-gray-600 pb-3 mb-4">
        <h2 className="text-2xl font-semibold text-white">3. Performance Analysis</h2>
        {/* --- 3. ADD ONCLICK --- */}
        <button
          onClick={handleGenerateClassReport}
          className="px-3 py-1.5 text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600"
        >
          Generate PDF Report
        </button>
      </div>

      <div id="analysis-content" className="space-y-12">
        <ProblemQuestionsSummary />
        <TagFilter />
        <ClassAnalysisCharts />
        {/* ... rest of the components ... */}
        <IndividualAnalysis />
        <DistractorAnalysis />
        <QuestionAnalysis />
      </div>
    </>
  );
};

export default AnalysisDashboard;