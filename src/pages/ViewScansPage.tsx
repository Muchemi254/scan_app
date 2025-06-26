// src/pages/ViewScansPage.tsx
import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import ReviewPanel from '../components/ReviewPanel';
import type { ReceiptData } from '../types/gemini';
import ExportPage from './ExportPage';

const isMissing = (val: any) =>
  !val || val === 'N/A' || val.toString().trim() === '';

const isComplete = (receipt: any) =>
  !isMissing(receipt.receiptDate) &&
  !isMissing(receipt.totalAmount) &&
  !isMissing(receipt.supplier) &&
  !isMissing(receipt.category) &&
  receipt.status === 'processed';

const ViewScansPage = ({ userId }: { userId: string | null }) => {
  const [receipts, setReceipts] = useState<ReceiptData[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const [filters, setFilters] = useState({
    category: '',
    supplier: '',
    status: '',
    isZeroRated: '',
    priceMin: '',
    priceMax: '',
    dateStart: '',
    dateEnd: '',
  });

  const uniqueSuppliers = [...new Set(receipts.map(r => r.supplier).filter(Boolean))];
  const uniqueCategories = [...new Set(receipts.map(r => r.category).filter(Boolean))];

  useEffect(() => {
    if (!userId) return;

    const ref = collection(db, `users/${userId}/receipts`);
    const batchParam = new URLSearchParams(window.location.search).get('batch');

    const unsubscribe = onSnapshot(ref, (snapshot) => {
      let all = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as ReceiptData[];

      if (batchParam) {
        all = all.filter(r => (r.batchTitle || '').trim() === batchParam);
      }

      setReceipts(all);
      setLoading(false);
      if (!selectedId && all.length > 0) {
        setSelectedId(all[0].id);
      }
    });

    return () => unsubscribe();
  }, [userId]);

  const handleSelect = (id: string) => {
    if (isEditing) {
      const confirmSwitch = confirm('You have unsaved changes. Discard and switch?');
      if (!confirmSwitch) return;
    }
    setSelectedId(id);
  };

  const filteredReceipts = receipts.filter(r => {
    const categoryMatch = filters.category ? r.category === filters.category : true;
    const supplierMatch = filters.supplier ? r.supplier === filters.supplier : true;
    const statusMatch = filters.status
      ? filters.status === 'processed'
        ? isComplete(r)
        : !isComplete(r)
      : true;
    const zeroRatedMatch =
      filters.isZeroRated !== ''
        ? r.items?.some(i => i.isZeroRated === (filters.isZeroRated === 'true'))
        : true;
    const priceMatch = (() => {
      const total = Number(r.totalAmount) || 0;
      const min = filters.priceMin ? Number(filters.priceMin) : 0;
      const max = filters.priceMax ? Number(filters.priceMax) : Infinity;
      return total >= min && total <= max;
    })();
    const dateMatch = (() => {
      const date = new Date(r.receiptDate || '');
      const start = filters.dateStart ? new Date(filters.dateStart) : null;
      const end = filters.dateEnd ? new Date(filters.dateEnd) : null;
      return (!start || date >= start) && (!end || date <= end);
    })();

    return categoryMatch && supplierMatch && statusMatch && zeroRatedMatch && priceMatch && dateMatch;
  });

  const selected = filteredReceipts.find((r) => r.id === selectedId);

  return (
    <div className="h-[calc(100vh-4rem)] bg-white shadow rounded overflow-hidden flex flex-col">
      {/* Top Filter Bar */}
      <div className="p-4 border-b flex flex-wrap gap-3 items-center">
        <select
          className="border p-2 rounded"
          value={filters.supplier}
          onChange={(e) => setFilters(f => ({ ...f, supplier: e.target.value }))}
        >
          <option value="">All Suppliers</option>
          {uniqueSuppliers.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select
          className="border p-2 rounded"
          value={filters.category}
          onChange={(e) => setFilters(f => ({ ...f, category: e.target.value }))}
        >
          <option value="">All Categories</option>
          {uniqueCategories.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select
          className="border p-2 rounded"
          value={filters.status}
          onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
        >
          <option value="">All Status</option>
          <option value="processed">✅ Processed</option>
          <option value="needs_review">⚠️ Needs Review</option>
        </select>

        <select
          className="border p-2 rounded"
          value={filters.isZeroRated}
          onChange={(e) => setFilters(f => ({ ...f, isZeroRated: e.target.value }))}
        >
          <option value="">All Tax Types</option>
          <option value="true">Zero Rated</option>
          <option value="false">Taxed</option>
        </select>

        <input
          type="number"
          placeholder="Min Price"
          value={filters.priceMin}
          onChange={(e) => setFilters(f => ({ ...f, priceMin: e.target.value }))}
          className="border p-2 rounded w-24"
        />

        <input
          type="number"
          placeholder="Max Price"
          value={filters.priceMax}
          onChange={(e) => setFilters(f => ({ ...f, priceMax: e.target.value }))}
          className="border p-2 rounded w-24"
        />

        <input
          type="date"
          value={filters.dateStart}
          onChange={(e) => setFilters(f => ({ ...f, dateStart: e.target.value }))}
          className="border p-2 rounded"
        />

        <input
          type="date"
          value={filters.dateEnd}
          onChange={(e) => setFilters(f => ({ ...f, dateEnd: e.target.value }))}
          className="border p-2 rounded"
        />

        <button
          onClick={() => setShowExportModal(true)}
          className="ml-auto bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          📤 Export Filtered ({filteredReceipts.length})
        </button>
      </div>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 border-r p-4 overflow-y-auto">
          <ul className="space-y-2">
            {filteredReceipts.map((r) => {
              const statusColor = isComplete(r) ? 'bg-green-500' : 'bg-red-500';
              return (
                <li
                  key={r.id}
                  className={`cursor-pointer p-2 rounded text-sm flex justify-between items-center ${
                    r.id === selectedId ? 'bg-blue-100 text-blue-800 font-medium' : 'hover:bg-gray-100'
                  }`}
                  onClick={() => handleSelect(r.id)}
                >
                  <div>
                    {r.supplier || 'Unknown'}
                    <br />
                    <span className="text-xs text-gray-500">{r.receiptDate || 'No Date'}</span>
                  </div>
                  <span className={`inline-block w-3 h-3 rounded-full ${statusColor}`} />
                </li>
              );
            })}
          </ul>
        </div>

        {/* Right Panel */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && <p>Loading scans...</p>}
          {!loading && selected ? (
            <ReviewPanel
              userId={userId!}
              receipt={selected}
              setIsEditing={setIsEditing}
            />
          ) : (
            <p>No scan selected.</p>
          )}
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full shadow-lg relative">
            <button
              onClick={() => setShowExportModal(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-black"
            >
              ✕
            </button>
            <ExportPage 
              userId={userId}
              customReceipts={filteredReceipts}
              onClose={() => setShowExportModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewScansPage;