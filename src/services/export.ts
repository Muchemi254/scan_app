// src/services/export.ts
import { utils, writeFile, type WorkBook, type WorkSheet } from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const sanitizeData = (data: any[]) => {
  return data.map(row => {
    const cleanedRow: any = {};
    for (const key in row) {
      const value = row[key];
      if (typeof value === 'string') {
        // Try to convert to number if it's numeric
        const num = parseFloat(value);
        cleanedRow[key] = isNaN(num) ? value.trim() : num;
      } else {
        cleanedRow[key] = value ?? '';
      }
    }
    return cleanedRow;
  });
};

export const exportToExcel = (data: any[], fileName: string) => {
  const sanitizedData = sanitizeData(data);

  try {
    const worksheet: WorkSheet = utils.json_to_sheet(sanitizedData, { skipHeader: false });
    const workbook: WorkBook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Receipts');
    writeFile(workbook, fileName, { bookType: 'xlsx', type: 'binary' });
  } catch (error) {
    console.error('Excel export error:', error);
    alert('Failed to export Excel file. Check data format.');
  }
};

export const exportToPDF = (data: any[], fileName: string) => {
  const doc = new jsPDF();
  doc.text('Receipts Export', 14, 16);

  const hasItems = data.some(receipt => 'Item Name' in receipt);
  const head = hasItems
    ? [['Supplier', 'Date', 'Invoice #', 'Item', 'Qty', 'Price', 'Tax', 'Total']]
    : [['Supplier', 'Date', 'Total', 'Items']];

  const tableData = data.map(receipt => {
    if (hasItems) {
      return [
        receipt.supplier || 'N/A',
        receipt.receiptDate || 'N/A',
        receipt.invoiceNumber || 'N/A',
        receipt['Item Name'] || '',
        receipt.Quantity ?? '',
        receipt.Price ?? '',
        receipt.Tax ?? '',
        receipt.Total ?? '',
      ];
    } else {
      return [
        receipt.supplier || 'N/A',
        receipt.receiptDate || 'N/A',
        receipt.totalAmount || 'N/A',
        receipt.items?.length || 0
      ];
    }
  });

  (doc as any).autoTable({
    head,
    body: tableData,
    startY: 20,
    styles: { fontSize: 8, cellWidth: 'wrap' },
    headStyles: { fillColor: [0, 102, 204] },
  });

  doc.save(fileName);
};
