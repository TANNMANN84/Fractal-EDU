// src/components/analysis/ProblemQuestionsSummary.tsx

import React, { useMemo } from 'react'; // Added React import
import { useAppContext } from '../../context/AppContext';
import { getLeafQuestions } from '../../utils/helpers';
import { Question, Student } from '../../types';

interface QuestionPerformance {
  question: Question;
  averageScore: number;
  maxMarks: number;
  percentage: number;
}

const ProblemQuestionsSummary: React.FC = () => {
  const { state } = useAppContext();
  const { examStudents, questions, activeTags } = state;

  const problemQuestions = useMemo(() => {
    const activeStudents =
      activeTags.length > 0
        ? examStudents.filter((s: Student) =>
            activeTags.every((t) => s.tags?.includes(t))
          )
        : examStudents.filter(
            (s: Student) => s.lastName && s.firstName && Object.keys(s.responses).length > 0
          );
    
    if (activeStudents.length === 0) {
      return [];
    }

    const leafQuestions = getLeafQuestions(questions);
    const performance: QuestionPerformance[] = [];

    leafQuestions.forEach((q) => {
      const maxMarks = Number(q.maxMarks || 0);
      if (maxMarks === 0) return;

      let totalScore = 0;
      activeStudents.forEach((s: Student) => {
        totalScore += s.responses[q.id] || 0;
      });

      const averageScore = totalScore / activeStudents.length;
      const percentage = (averageScore / maxMarks) * 100;

      performance.push({
        question: q,
        averageScore,
        maxMarks,
        percentage,
      });
    });

    // Sort by lowest percentage, take the bottom 3
    return performance.sort((a: QuestionPerformance, b: QuestionPerformance) => a.percentage - b.percentage).slice(0, 3);
  }, [examStudents, questions, activeTags]);

  if (problemQuestions.length === 0) {
    return null; // Don't show if no data
  }

  const questionNames = problemQuestions
    .map((pq) => pq.question.displayNumber)
    .join(', ');

  return (
    <div
      id="problem-questions-summary"
      className="mb-6 p-4 bg-gray-800/50 border border-yellow-700/50 rounded-lg"
    >
      <h4 className="font-semibold text-yellow-300">Analysis Snapshot</h4>
      <p className="text-gray-300">
        Based on current data, the cohort found the following questions most
        challenging: <span className="font-bold">{questionNames}</span>.
      </p>
    </div>
  );
};

export default ProblemQuestionsSummary;