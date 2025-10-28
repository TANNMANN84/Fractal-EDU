// src/components/analysis/IndividualAnalysisCharts.tsx

import React, { useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { getAnalysisData } from '../../utils/analysisHelpers';
import AnalysisChart from './AnalysisChart';
import { Student, AppState } from '../../types'; // Import AppState

interface IndividualAnalysisChartsProps {
  selectedStudents: Student[];
}

const IndividualAnalysisCharts: React.FC<IndividualAnalysisChartsProps> = ({
  selectedStudents,
}) => {
  const { state } = useAppContext();
  const activeExam = state.activeExamId ? state.exams.find(e => e.id === state.activeExamId) : null;
  const questions = activeExam?.questions || [];
  const examStudents = activeExam?.students || [];

  const { moduleData, contentData, outcomeData, verbData } = useMemo(
    () => getAnalysisData(examStudents, questions, [], selectedStudents),
    [selectedStudents, examStudents, questions]
  );

  if (selectedStudents.length === 0) {
    return (
      <p className="text-center text-gray-500 py-8">
        Select a student to see their detailed analysis.
      </p>
    );
  }

  const titlePrefix =
    selectedStudents.length > 1 ? 'Comparative' : 'Individual';

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mt-4">
      <AnalysisChart
        title={`${titlePrefix} Module Performance`}
        data={moduleData}
        chartId="indivModuleChart"
      />
      <AnalysisChart
        title={`${titlePrefix} Content Area Performance`}
        data={contentData}
        chartId="indivContentChart"
      />
      <AnalysisChart
        title={`${titlePrefix} Syllabus Outcome Performance`}
        data={outcomeData}
        chartId="indivOutcomeChart"
      />
      <AnalysisChart
        title={`${titlePrefix} Cognitive Verb Performance`}
        data={verbData}
        chartId="indivVerbChart"
      />
    </div>
  );
};

export default IndividualAnalysisCharts;