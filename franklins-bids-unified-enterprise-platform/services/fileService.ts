

declare const jspdf: any;
declare const XLSX: any;

/**
 * Generates a branded PDF document from AI response content.
 */
export const generatePDF = async (title: string, content: string) => {
  // Access jsPDF from the UMD global bundle
  // Fix: Cast window to any to access globally available jspdf object from script tag
  const { jsPDF } = (window as any).jspdf;
  const doc = new jsPDF();
  
  // Strip common markdown characters for cleaner reading
  const cleanContent = content
    .replace(/#+\s/g, '')
    .replace(/\*\*/g, '')
    .replace(/```[a-z]*\n/g, '')
    .replace(/```/g, '')
    .replace(/\[TRAINED_ARTIFACT:.*?\]/g, '[ATTACHMENT]');
  
  // Header Branding
  doc.setFillColor(0, 0, 0);
  doc.rect(0, 0, 210, 25, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("YUR AI // NEURAL TRANSMISSION", 15, 16);
  
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`TIMESTAMP: ${new Date().toLocaleString()}`, 155, 16);

  // Body Content
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(10);
  
  const splitText = doc.splitTextToSize(cleanContent, 180);
  let y = 40;
  
  // Handle multi-page content
  splitText.forEach((line: string) => {
    if (y > 280) {
      doc.addPage();
      y = 20;
    }
    doc.text(line, 15, y);
    y += 6;
  });
  
  doc.save(`YUR_TRANSMISSION_${Date.now()}.pdf`);
};

/**
 * Extracts tabular data from chat responses and generates an Excel spreadsheet.
 */
export const generateExcel = (title: string, content: string) => {
  const lines = content.split('\n').filter(l => l.trim().length > 0);
  
  // Filter and parse lines for potential data structure
  const rows = lines
    .filter(line => {
      // Exclude markdown table separator lines like |---|---|
      const isSeparator = line.includes('|') && line.replace(/[\|\-\s]/g, '').length === 0;
      return !isSeparator;
    })
    .map(line => {
      if (line.includes('|')) {
        // Handle Markdown Tables
        return line
          .split('|')
          .map(cell => cell.trim())
          .filter((cell, idx, arr) => {
            // Remove leading/trailing empty cells from the | cell | split
            if (idx === 0 || idx === arr.length - 1) return cell.length > 0;
            return true;
          });
      }
      if (line.includes(':') && !line.startsWith('http')) {
        // Handle Key: Value pairs
        return line.split(':').map(c => c.trim());
      }
      return [line];
    });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "NEURAL_DATA");
  
  XLSX.writeFile(wb, `YUR_DATA_EXPORT_${Date.now()}.xlsx`);
};

/**
 * Copies plain text to user clipboard with visual system log.
 */
export const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Copy failed', err);
    return false;
  }
};