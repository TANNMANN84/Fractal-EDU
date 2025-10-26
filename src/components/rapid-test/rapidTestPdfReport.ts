import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { RapidTest, Student } from '../../types';

// Define interfaces for the data structures used in RapidTestAnalysis
interface AnalysisData {
  studentId: string;
  studentName: string;
  preScore: number | null;
  postScore: number | null;
  prePercentage: number | null;
  postPercentage: number | null;
  growth: number | null;
}

interface QuestionAnalysisData {
  questionId: string;
  prompt: string;
  avgPreScore: number | null;
  avgPostScore: number | null;
  avgGrowth: number | null;
  maxMarks: number;
}

interface ClassAverages {
    avgPre: number | null;
    avgPost: number | null;
    avgGrowth: number | null;
}

const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export const generateRapidTestReport = (
    test: RapidTest,
    analysisData: AnalysisData[],
    questionAnalysisData: QuestionAnalysisData[],
    classAverages: ClassAverages
) => {
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    let finalY = 20;

    // --- Title ---
    doc.setFontSize(18);
    doc.text(`Analysis for: ${test.name}`, 14, finalY);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Report generated on: ${formatDate(new Date())}`, 14, finalY + 7);
    finalY += 20;

    // --- Class Averages ---
    doc.setFontSize(14);
    doc.text('Class Averages', 14, finalY);
    finalY += 6;
    (doc as any).autoTable({
        startY: finalY,
        head: [['Avg. Pre-Test', 'Avg. Post-Test', 'Avg. Growth']],
        body: [
            [
                classAverages.avgPre !== null ? `${classAverages.avgPre.toFixed(1)}%` : 'N/A',
                classAverages.avgPost !== null ? `${classAverages.avgPost.toFixed(1)}%` : 'N/A',
                classAverages.avgGrowth !== null ? `${classAverages.avgGrowth > 0 ? '+' : ''}${classAverages.avgGrowth.toFixed(1)}%` : 'N/A'
            ]
        ],
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] }
    });
    finalY = (doc as any).lastAutoTable.finalY + 15;

    // --- Student Growth Table ---
    if (finalY > pageHeight - 30) { doc.addPage(); finalY = 20; }
    doc.setFontSize(14);
    doc.text('Student Growth', 14, finalY);
    finalY += 6;
    (doc as any).autoTable({
        startY: finalY,
        head: [['Student', 'Pre-Test Score', 'Post-Test Score', 'Growth']],
        body: analysisData.map(d => [
            d.studentName,
            d.prePercentage !== null ? `${d.prePercentage.toFixed(1)}%` : 'Not Marked',
            d.postPercentage !== null ? `${d.postPercentage.toFixed(1)}%` : 'Not Marked',
            d.growth !== null ? `${d.growth > 0 ? '+' : ''}${d.growth.toFixed(1)}%` : 'N/A'
        ]),
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] }
    });
    finalY = (doc as any).lastAutoTable.finalY + 15;

    // --- Question Breakdown Table ---
    if (finalY > pageHeight - 30) { doc.addPage(); finalY = 20; }
    doc.setFontSize(14);
    doc.text('Question Breakdown (Class Average)', 14, finalY);
    finalY += 6;
    (doc as any).autoTable({
        startY: finalY,
        head: [['Question', 'Avg. Pre-Test', 'Avg. Post-Test', 'Avg. Growth']],
        body: questionAnalysisData.map((q, i) => [
            `Q${i + 1}: ${q.prompt}`,
            q.avgPreScore !== null ? `${q.avgPreScore.toFixed(1)}%` : 'N/A',
            q.avgPostScore !== null ? `${q.avgPostScore.toFixed(1)}%` : 'N/A',
            q.avgGrowth !== null ? `${q.avgGrowth > 0 ? '+' : ''}${q.avgGrowth.toFixed(1)}%` : 'N/A'
        ]),
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] }
    });

    doc.save(`analysis_${test.name.replace(/ /g, '_')}.pdf`);
};

export const generateStudentReport = (
    test: RapidTest,
    student: Student,
    preResult: any,
    postResult: any,
    getScoreForRapidQuestion: Function
) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Detailed Report for: ${student.firstName} ${student.lastName}`, 14, 20);
    doc.setFontSize(14);
    doc.text(`Test: ${test.name}`, 14, 28);

    (doc as any).autoTable({
        startY: 40,
        head: [['Question', 'Pre-Test Answer', 'Pre-Test Score', 'Post-Test Answer', 'Post-Test Score']],
        body: test.questions.map(q => [
            q.prompt,
            preResult?.responses[q.id] ?? '-',
            preResult ? `${getScoreForRapidQuestion(q, preResult.responses[q.id])} / ${q.maxMarks}` : '-',
            postResult?.responses[q.id] ?? '-',
            postResult ? `${getScoreForRapidQuestion(q, postResult.responses[q.id])} / ${q.maxMarks}` : '-'
        ]),
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] }
    });

    doc.save(`student_report_${student.lastName}_${student.firstName}.pdf`);
};