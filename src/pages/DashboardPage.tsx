import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';

const DashboardPage = ({ userId }: { userId: string | null }) => {
  const [processedCount, setProcessedCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [batchTitles, setBatchTitles] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) return;

    const ref = collection(db, `users/${userId}/receipts`);

    const unsubscribe = onSnapshot(ref, snapshot => {
      const all = snapshot.docs.map(doc => doc.data());
      const total = all.length;
      const processed = all.filter(r => r.status === 'processed').length;
      const needsReview = all.filter(r => r.status === 'needs_review').length;

      const batches = Array.from(
        new Set(
          all
            .map(r => (r.batchTitle || '').trim())
            .filter(title => title.length > 0)
        )
      );

      setTotalCount(total);
      setProcessedCount(processed);
      setReviewCount(needsReview);
      setBatchTitles(batches);
    });

    return () => unsubscribe();
  }, [userId]);

  const cards = [
    {
      title: 'Total Receipts',
      count: totalCount,
      link: '/receipts',
      color: 'bg-indigo-100 text-indigo-800',
    },
    {
      title: 'Processed',
      count: processedCount,
      link: '/receipts',
      color: 'bg-green-100 text-green-800',
    },
    {
      title: 'Needs Review',
      count: reviewCount,
      link: '/review',
      color: 'bg-yellow-100 text-yellow-800',
    },
    {
      title: 'Receipt Batches',
      count: batchTitles.length,
      link: '#',
      onClick: () => setShowModal(true),
      color: 'bg-blue-100 text-blue-800',
    }
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6">📊 Receipt Dashboard</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, i) => (
          <div
            key={i}
            className={`p-6 rounded shadow hover:shadow-md transition cursor-pointer ${card.color}`}
            onClick={card.onClick || (() => navigate(card.link))}
          >
            <h3 className="text-lg font-semibold mb-2">{card.title}</h3>
            <p className="text-3xl font-bold">{card.count}</p>
          </div>
        ))}
      </div>

      {/* Modal for batches */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md max-h-[80vh] overflow-y-auto shadow-lg relative">
            <button
              className="absolute top-2 right-3 text-red-500 hover:text-gray-700"
              onClick={() => setShowModal(false)}
            >
              ❌
            </button>
            <h3 className="text-xl font-semibold mb-4">📦 Receipt Batches</h3>
            {batchTitles.length === 0 && <p>No batches available.</p>}
            <ul className="space-y-2">
              {batchTitles.map((batch, i) => (
                <li
                  key={i}
                  className="cursor-pointer p-2 border rounded hover:bg-gray-100 text-sm"
                  onClick={() => {
                    navigate(`/receipts?batch=${encodeURIComponent(batch)}`);
                    setShowModal(false);
                  }}
                >
                  {batch}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
