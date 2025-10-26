// src/utils/pdfhelper.ts

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Adds a chart element to the PDF, handling page breaks automatically.
 * @param doc - The jsPDF instance.
 * @param element - The HTMLElement to capture (e.g., a chart container).
 * @param yPos - The current Y position on the PDF page.
 * @returns The new Y position after adding the element.
 */
async function addElementToPdf(
  doc: jsPDF,
  element: HTMLElement,
  yPos: number
): Promise<number> {
  const PAGE_MARGIN = 14;
  const PAGE_HEIGHT = doc.internal.pageSize.getHeight();
  const PAGE_WIDTH = doc.internal.pageSize.getWidth();
  const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;

  // Capture the element as a canvas
  const canvas = await html2canvas(element, {
    backgroundColor: '#1f2937', // Match your dark mode background
    scale: 2, // Increase resolution
  });
  const imgData = canvas.toDataURL('image/png');

  const imgProps = doc.getImageProperties(imgData);
  const imgHeight = (imgProps.height * CONTENT_WIDTH) / imgProps.width;

  // Check if it fits on the current page
  if (yPos + imgHeight > PAGE_HEIGHT - PAGE_MARGIN) {
    doc.addPage();
    yPos = PAGE_MARGIN; // Reset to top margin
  }

  // Add the image to the PDF
  doc.addImage(imgData, 'PNG', PAGE_MARGIN, yPos, CONTENT_WIDTH, imgHeight);

  return yPos + imgHeight + 10; // Return new Y position with 10 units of padding
}

/**
 * Generates a PDF report for the class or an individual student.
 * @param isIndividual - Flag for individual report.
 * @param studentName - Name of the student (if individual).
 */
export const generatePdfReport = async (
  isIndividual: boolean,
  studentName?: string
) => {
  const doc = new jsPDF({
    orientation: 'p', // Portrait is better for stacking charts
    unit: 'mm',
    format: 'a4',
  });

  const analysisContainerId = isIndividual
    ? 'individual-analysis-content'
    : 'analysis-content';
  const container = document.getElementById(analysisContainerId);

  if (!container) {
    console.error('Analysis container not found.');
    return;
  }

  // --- 1. Add Title ---
  doc.setFontSize(22);
  doc.text(
    isIndividual
      ? `Performance Report for: ${studentName}`
      : 'Class Performance Analysis Report',
    14,
    20
  );
  doc.setFontSize(12);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);
  let currentY = 40; // Start content below header

  // --- 2. Find all chart containers ---
  // We look for the wrappers we defined in our components
  const chartWrappers = container.querySelectorAll<HTMLElement>(
    '[id$="-wrapper"]'
  );

  if (chartWrappers.length === 0) {
    console.error('No chart wrappers found to export.');
    return;
  }

  // --- 3. Add each chart individually ---
  for (const wrapper of Array.from(chartWrappers)) {
    // We need to find the parent title
    const titleEl = wrapper.closest('div.bg-gray-800\\/50')?.querySelector('h3');
    const title = titleEl ? titleEl.innerText : 'Chart';

    // Add title for the chart
    doc.setFontSize(16);
    doc.text(title, 14, currentY);
    currentY += 8;

    // Add the chart, which updates currentY
    currentY = await addElementToPdf(doc, wrapper, currentY);

    // Add a little extra space before the next chart
    currentY += 5;
  }

  // --- 4. Save the PDF ---
  const fileName = `exam-report-${
    isIndividual ? `${studentName}-` : 'class-'
  }${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
};