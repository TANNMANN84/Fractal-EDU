import StudentList from '@/components/entry/StudentList';
import StudentResultsForm from '@/components/entry/StudentResultsForm';
import AnalysisDashboard from '@/components/analysis/AnalysisDashboard';
import { useAppContext } from '@/context/AppContext';
import { Student, Question } from '@/types';

interface DataEntryViewProps {
    onEditSetup: () => void;
}

const DataEntryView = ({ onEditSetup }: DataEntryViewProps) => {
    const { state } = useAppContext();
    
    const handleExportCsv = () => {
        // 1. Get header row
        const headers = ['Student Name', ...state.questions.map((q: Question) => `Q${q.number}`)];
        
        // 2. Get data rows
        const rows = state.students.map((student: Student) => {
            const studentRow = [(student as any).name ?? student.id];
            const results = (state as any).results;
            state.questions.forEach((q: Question) => {
                const result = results?.[student.id]?.[q.id];
                studentRow.push(result !== undefined ? String(result.score) : '');
            });
            return studentRow.join(',');
        });

        // 3. Combine headers and rows
        const csvContent = [headers.join(','), ...rows].join('\n');

        // 4. Create a blob and trigger download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'student_results.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div>
            <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg shadow-md mb-8">
                <div className="flex justify-between items-center mb-4 border-b border-gray-600 pb-3">
                    <h2 className="text-2xl font-semibold text-white">2. Enter Student Results</h2>
                    <div className="flex items-center gap-4">
                        <button onClick={onEditSetup} className="inline-flex items-center px-3 py-1.5 border border-gray-600 text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">Edit Setup</button>
                        <button onClick={handleExportCsv} className="inline-flex items-center px-3 py-1.5 border border-gray-600 text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">Export as CSV</button>
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-1 bg-gray-900/50 p-4 rounded-lg h-fit">
                        <StudentList />
                    </div>
                    <div className="lg:col-span-3">
                        {state.selectedStudentId ? <StudentResultsForm /> : 
                            <div className="flex items-center justify-center h-full bg-gray-900/50 rounded-lg min-h-[300px]">
                                <p className="text-gray-500">{state.students.length > 0 ? "Select a student to enter results." : "Add a student to begin."}</p>
                            </div>
                        }
                    </div>
                </div>
            </div>

            <AnalysisDashboard />
        </div>
    );
};

export default DataEntryView;