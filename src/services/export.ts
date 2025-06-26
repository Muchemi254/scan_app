// src/services/export.ts
import { utils, writeFile } from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export const exportToExcel = (data: any[], fileName: string) => {
  const worksheet = utils.json_to_sheet(data);
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, 'Receipts');
  writeFile(workbook, fileName);
};

export const exportToPDF = (data: any[], fileName: string) => {
  const doc = new jsPDF();
  
  // Add title
  doc.text('Receipts Export', 14, 16);
  
  // Prepare data for the table
  const tableData = data.map(receipt => [
    receipt.supplier || 'N/A',
    receipt.receiptDate || 'N/A',
    receipt.totalAmount || 'N/A',
    receipt.items?.length || 0
  ]);

  // Add table
  (doc as any).autoTable({
    head: [['Supplier', 'Date', 'Total', 'Items']],
    body: tableData,
    startY: 20
  });

  doc.save(fileName);
};