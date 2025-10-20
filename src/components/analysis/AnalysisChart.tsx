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
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

type ChartType = 'bar' | 'pie';

interface AnalysisChartProps {
    chartId: string;
    title: string;
    data: any; // Simplified for this example
}

const AnalysisChart: React.FC<AnalysisChartProps> = ({ chartId, title, data }) => {
    const [view] = useState<'bars' | ChartType>('bars');

    const chartData = {
        labels: Object.keys(data),
        datasets: [{
            label: '% Mastery',
            data: Object.values(data).map((d: any) => d.total > 0 ? (d.scored / d.total * 100) : 0),
            backgroundColor: Object.keys(data).map((_, i) => `hsl(${210 + i * (150 / Object.keys(data).length)}, 60%, 60%)`),
        }]
    };

    const options = {
        responsive: true,
        plugins: {
            legend: { position: 'top' as const, labels: { color: '#d1d5db' } },
            title: { display: true, text: title, color: '#d1d5db' },
        },
        scales: view !== 'pie' ? {
            y: { beginAtZero: true, max: 100, ticks: { color: '#9ca3af' }, grid: { color: '#374151' } },
            x: { ticks: { color: '#9ca3af' }, grid: { color: '#374151' } }
        } : {},
    };
    
    // The full logic for rendering bars vs charts and handling different data types
    // would be implemented here. This is a simplified version.

    return (
        <div id={chartId} className="bg-gray-800/50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-3">{title}</h3>
            {/* Chart view toggle and rendering logic would go here */}
            <div className="p-2 rounded-md bg-gray-900/50">
                {view === 'bar' && <Bar options={options} data={chartData} />}
                {view === 'pie' && <Pie options={options} data={chartData} />}
                {/* Default to a bar chart for now */}
                {view === 'bars' && <Bar options={options} data={chartData} />}
            </div>
        </div>
    );
};

export default AnalysisChart;
