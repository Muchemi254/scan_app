// src/pages/ViewScansPage.tsx
import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import ReviewPanel from '../components/ReviewPanel';
import type { ReceiptData } from '../types/gemini';

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

    useEffect(() => {
    if (!userId) return;

    const ref = collection(db, `users/${userId}/receipts`);
    const batchParam = new URLSearchParams(window.location.search).get('batch');

    const unsubscribe = onSnapshot(ref, (snapshot) => {
      let all = snapshot.docs.map((doc) => ({
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

  const selected = receipts.find((r) => r.id === selectedId);

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white shadow rounded overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 border-r p-4 overflow-y-auto">
        <h2 className="text-lg font-bold mb-4">
  📁 {new URLSearchParams(window.location.search).get('batch') || 'All Scans'}
</h2>
        <ul className="space-y-2">
          {receipts.map((r) => {
            const statusColor = isComplete(r)
              ? 'bg-green-500'
              : 'bg-red-500';
            return (
              <li
                key={r.id}
                className={`cursor-pointer p-2 rounded text-sm flex justify-between items-center ${
                  r.id === selectedId
                    ? 'bg-blue-100 text-blue-800 font-medium'
                    : 'hover:bg-gray-100'
                }`}
                onClick={() => handleSelect(r.id)}
              >
                <div>
                  {r.supplier || 'Unknown'}
                  <br />
                  <span className="text-xs text-gray-500">
                    {r.receiptDate || 'No Date'}
                  </span>
                </div>
                <span
                  className={`inline-block w-3 h-3 rounded-full ${statusColor}`}
                />
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
  );
};

export default ViewScansPage;
