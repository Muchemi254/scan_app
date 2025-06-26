// src/pages/ReviewPage.tsx
import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import type { ReceiptData } from '../types/gemini';
import ReviewPanel from '../components/ReviewPanel';

const ReviewPage = ({ userId }: { userId: string | null }) => {
  const [receipts, setReceipts] = useState<ReceiptData[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, `users/${userId}/receipts`),
      where('status', '==', 'needs_review')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }) as ReceiptData);

      setReceipts(data);
      setLoading(false);

      if (!selectedId && data.length > 0) {
        setSelectedId(data[0].id);
      }
    });

    return () => unsubscribe();
  }, [userId]);

  const handleSelect = (newId: string) => {
    if (isEditing) {
      const confirmSwitch = confirm(
        'You have unsaved changes. Do you want to discard them and switch receipts?'
      );
      if (!confirmSwitch) return;
    }
    setSelectedId(newId);
  };

  const selected = receipts.find(r => r.id === selectedId);

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white shadow rounded overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 border-r p-4 overflow-y-auto">
        <h2 className="text-lg font-bold mb-4">📝 To Review</h2>
        <ul className="space-y-2">
          {receipts.map((r) => (
            <li
              key={r.id}
              className={`cursor-pointer p-2 rounded text-sm ${
                r.id === selectedId
                  ? 'bg-blue-100 text-blue-800 font-medium'
                  : 'hover:bg-gray-100'
              }`}
              onClick={() => handleSelect(r.id)}
            >
              {r.supplier || 'Unknown'}<br />
              <span className="text-xs text-gray-500">{r.receiptDate || 'No Date'}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Right panel */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading && <p>Loading...</p>}
        {!loading && selected ? (
          <ReviewPanel userId={userId} receipt={selected} setIsEditing={setIsEditing} />
        ) : (
          <p>No receipt selected.</p>
        )}
      </div>
    </div>
  );
};

export default ReviewPage;
