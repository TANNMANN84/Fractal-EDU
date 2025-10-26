// src/components/analysis/AnalysisChart.tsx

import React, { useState } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js/auto';
import { AnalysisDataItem } from '../../utils/analysisHelpers';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

type ChartView = 'bars' | 'bar' | 'pie'; // 'bars' = list, 'bar' = column chart

interface AnalysisChartProps {
  chartId: string;
  title: string;
  data: Record<string, AnalysisDataItem | number>;
  isBandChart?: boolean;
}

const AnalysisChart: React.FC<AnalysisChartProps> = ({
  chartId,
  title,
  data,
  isBandChart = false,
}) => {
  const [view, setView] = useState<ChartView>('bars');

  const sortedData = Object.entries(data).sort((a, b) =>
    a[0].localeCompare(b[0])
  );
  const labels = sortedData.map(([key]) => key);

  const getChartData = () => {
    let datasetLabel: string;
    let chartValues: number[];

    if (isBandChart) {
      datasetLabel = '# of Students';
      chartValues = sortedData.map(([, value]) => value as number);
    } else {
      datasetLabel = '% Mastery';
      chartValues = sortedData.map(([, d]) => {
        const item = d as AnalysisDataItem;
        return item.total > 0 ? (item.scored / item.total) * 100 : 0;
      });
    }

    return {
      labels,
      datasets: [
        {
          label: datasetLabel,
          data: chartValues,
          backgroundColor: labels.map(
            (_, i) => `hsl(${210 + i * (150 / labels.length)}, 60%, 60%)`
          ),
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: view === 'pie',
    plugins: {
      legend: {
        position: 'top' as const,
        display: view === 'pie' || isBandChart,
        labels: { color: '#d1d5db' },
      },
      title: {
        display: false, // We use our own title
      },
      tooltip: {
        callbacks: {
          label: (c: any) =>
            isBandChart
              ? `${c.label}: ${c.raw} students`
              : `${c.dataset.label || c.label}: ${c.raw.toFixed(1)}%`,
        },
      },
    },
    scales:
      view === 'bar'
        ? {
            y: {
              beginAtZero: true,
              max: isBandChart ? undefined : 100,
              ticks: { color: '#9ca3af' },
              grid: { color: '#374151' },
            },
            x: { ticks: { color: '#9ca3af' }, grid: { color: '#374151' } },
          }
        : {},
  };

  const renderBars = () => (
    <div className="p-2 space-y-3">
      {sortedData.map(([key, d]) => {
        if (isBandChart) {
          const count = d as number;
          const totalStudents = sortedData.reduce(
            (sum, [, val]) => sum + (val as number),
            0
          );
          const percentage = totalStudents > 0 ? (count / totalStudents) * 100 : 0;
          return (
            <div key={key} className="p-3 bg-gray-700/50 rounded-md">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-indigo-400 text-sm">{key}</span>
                <span className="text-sm font-semibold">{count} student(s)</span>
              </div>
              <div className="w-full bg-gray-600 rounded-full h-2">
                <div
                  className="bg-indigo-500 h-2 rounded-full"
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          );
        }

        const item = d as AnalysisDataItem;
        const mastery = item.total > 0 ? (item.scored / item.total) * 100 : 0;
        return (
          <div key={key} className="p-3 bg-gray-700/50 rounded-md">
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-indigo-400 text-sm">{key}</span>
              <span className="text-sm font-semibold">{mastery.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-600 rounded-full h-2">
              <div
                className="bg-indigo-500 h-2 rounded-full"
                style={{ width: `${mastery}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-400 mt-1 text-right">
              {item.scored.toFixed(1)}/{item.total.toFixed(1)} marks
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderChart = () => (
    <div className="p-2 rounded-md bg-gray-900/50">
      {view === 'bar' && <Bar options={chartOptions} data={getChartData()} />}
      {view === 'pie' && <Pie options={chartOptions} data={getChartData()} />}
    </div>
  );

  const viewButtons: { key: ChartView; label: string }[] = [
    { key: 'bars', label: 'Bars' },
    { key: 'bar', label: 'Column' },
    { key: 'pie', label: 'Pie' },
  ];

  return (
    <div className="bg-gray-800/50 p-4 rounded-lg">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          {/* We can add PDF checkbox logic here later */}
          {title}
        </h3>
        <div className="flex rounded-md shadow-sm bg-gray-700 p-0.5">
          {viewButtons.map((btn) => (
            <button
              key={btn.key}
              onClick={() => setView(btn.key)}
              className={`px-2 py-1 text-xs font-medium rounded-md ${
                view === btn.key
                  ? 'text-white bg-indigo-600'
                  : 'text-gray-300'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>
      <div id={`${chartId}-wrapper`}>
        {view === 'bars' ? renderBars() : renderChart()}
      </div>
    </div>
  );
};

export default AnalysisChart;