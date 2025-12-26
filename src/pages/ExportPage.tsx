// src/pages/ExportPage.tsx
import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { exportToExcel, exportToPDF } from '../services/export';
import { generateSummary } from '../services/gemini';

interface ExportPageProps {
  userId: string | null;
  customReceipts?: any[];
  onClose?: () => void;
}

const ExportPage = ({ userId, customReceipts, onClose }: ExportPageProps) => {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState('');
  const [fileName, setFileName] = useState('receipts_export');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const allowedFields = [
    'receiptDate',
    'supplier',
    'invoiceNumber',
    'category',
    'kraPin',
    'cuInvoice',
    'status',
  ];

  const fetchReceipts = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, `users/${userId}/receipts`));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const filtered = data.filter(receipt => {
        const date = new Date(receipt.receiptDate);
        const afterStart = dateRange.start ? date >= new Date(dateRange.start) : true;
        const beforeEnd = dateRange.end ? date <= new Date(dateRange.end) : true;
        return afterStart && beforeEnd;
      });

      setReceipts(filtered);
    } catch (error) {
      console.error("Error fetching receipts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customReceipts) {
      setReceipts(customReceipts);
    } else {
      fetchReceipts();
    }
  }, [userId, dateRange.start, dateRange.end, customReceipts]);

  const flattenReceipts = () => {
    const rows: any[] = [];

    receipts.forEach(receipt => {
      const base = Object.fromEntries(
        allowedFields.map(field => [field, receipt[field] || ''])
      );

      if (Array.isArray(receipt.items)) {
        receipt.items.forEach((item: any) => {
          const quantity = parseFloat(item.quantity) || 0;
          const price = parseFloat(item.price) || 0;
          const tax = parseFloat(item.tax) || 0;
          const isZeroRated = item.isZeroRated === true;
          const itemTotal = quantity * (price + tax);

          rows.push({
            ...base,
            'Item Name': item.name || '',
            'Quantity': quantity,
            'Price': Number(price.toFixed(3)),
            'Tax': Number(tax.toFixed(3)),
            'Zero Rated': isZeroRated,
            'Total': Number(itemTotal.toFixed(3)),
          });
        });
      } else {
        rows.push({ ...base, 'Item Name': '', 'Quantity': '', 'Price': '', 'Tax': '', 'Zero Rated': '', 'Total': '' });
      }
    });

    return rows;
  };

  const handleExportExcel = () => {
    const rows = flattenReceipts();
    exportToExcel(rows, `${fileName}.xlsx`);
    onClose?.();
  };

  const handleExportPDF = () => {
    const rows = flattenReceipts();
    exportToPDF(rows, `${fileName}.pdf`);
    onClose?.();
  };

  const handleGenerateSummary = async () => {
    if (!receipts.length) return;

    setLoading(true);
    try {
      const result = await generateSummary(receipts);
      setSummary(result);
    } catch (error) {
      console.error("Error generating summary:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Export Receipts</h2>
        {onClose && (
          <button onClick={onClose} className="text-gray-500 hover:text-black">
            ✕
          </button>
        )}
      </div>

      {!customReceipts && (
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Date Range Filter</h3>
          <div className="flex gap-4">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="border p-2 rounded"
            />
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="border p-2 rounded"
            />
          </div>
        </div>
      )}

      <div className="mb-4">
        <label className="block mb-1 font-medium">Export File Name</label>
        <input
          type="text"
          placeholder="receipts_export"
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
          className="border p-2 rounded w-full max-w-md"
        />
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <button
          onClick={handleExportExcel}
          className="px-4 py-2 bg-green-600 text-white rounded"
          disabled={loading || !receipts.length}
        >
          Export to Excel
        </button>
        <button
          onClick={handleExportPDF}
          className="px-4 py-2 bg-red-600 text-white rounded"
          disabled={loading || !receipts.length}
        >
          Export to PDF
        </button>
        <button
          onClick={handleGenerateSummary}
          className="px-4 py-2 bg-blue-600 text-white rounded"
          disabled={loading || !receipts.length}
        >
          Generate AI Summary
        </button>
      </div>

      {summary && (
        <div className="mt-4 p-4 bg-gray-50 rounded border">
          <h3 className="font-semibold mb-2">AI Spending Summary</h3>
          <p className="whitespace-pre-line">{summary}</p>
        </div>
      )}
    </div>
  );
};

export default ExportPage;