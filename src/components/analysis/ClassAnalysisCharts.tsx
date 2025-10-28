// src/components/analysis/ClassAnalysisCharts.tsx

import React, { useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { getAnalysisData } from '../../utils/analysisHelpers';
import AnalysisChart from './AnalysisChart';
import BandChart from './BandChart'; // Import the new component
import { Student } from '@/types';

const ClassAnalysisCharts: React.FC = () => {
  // *** CORRECT USAGE: Call the hook ***
  const { state } = useAppContext();
  const activeExam = state.activeExamId ? state.exams.find(e => e.id === state.activeExamId) : null;
  const examStudents = activeExam?.students || [];
  const questions = activeExam?.questions || [];

  const { moduleData, contentData, outcomeData, verbData, bandData } =
    useMemo(
      () => getAnalysisData(examStudents, questions, state.activeTags),
      [examStudents, questions, state.activeTags]
    );

  const hasResponses = examStudents.some(
    (s: Student) => Object.keys(s.responses).length > 0
  );

  if (!hasResponses) {
    return (
      <p className="text-center text-gray-500 py-8">
        Analysis will appear here once you add students and enter their results.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      <AnalysisChart
        title="Class Performance by Module"
        data={moduleData}
        chartId="classModuleChart"
      />
      <AnalysisChart
        title="Class Performance by Content Area"
        data={contentData}
        chartId="classContentChart"
      />
      <AnalysisChart
        title="Class Performance by Syllabus Outcome"
        data={outcomeData}
        chartId="classOutcomeChart"
      />
      <AnalysisChart
        title="Class Performance by Cognitive Verb"
        data={verbData}
        chartId="classVerbChart"
      />
      <BandChart
        title="Class Performance Bands"
        data={bandData}
        chartId="classBandChart"
      />
    </div>
  );
};

export default ClassAnalysisCharts;