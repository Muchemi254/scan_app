// src/pages/ReviewPage.tsx
import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import type { ReceiptData } from '../types/gemini';
import ReviewPanel from '../components/ReviewPanel';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const ReviewPage = ({ userId }: { userId: string | null }) => {
  const [receipts, setReceipts] = useState<ReceiptData[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showList, setShowList] = useState(false); // Hidden by default on mobile

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
  }, [userId, selectedId]);

  const handleSelect = (newId: string) => {
    if (isEditing) {
      const confirmSwitch = confirm(
        'You have unsaved changes. Do you want to discard them and switch receipts?'
      );
      if (!confirmSwitch) return;
    }
    setSelectedId(newId);
    // Auto-hide list on mobile after selection
    if (window.innerWidth < 1024) {
      setShowList(false);
    }
  };

  const toggleList = () => {
    setShowList(!showList);
  };

  const selected = receipts.find(r => r.id === selectedId);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (receipts.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">📋</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No Receipts to Review</h2>
          <p className="text-gray-600">All receipts have been reviewed!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)] bg-white shadow rounded overflow-hidden">
      {/* Mobile Header with Toggle */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b bg-white sticky top-0 z-20">
        <h2 className="text-lg font-bold">📝 To Review ({receipts.length})</h2>
        <button
          onClick={toggleList}
          className="flex items-center gap-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
          aria-label={showList ? "Hide list" : "Show list"}
        >
          {showList ? (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Hide</span>
            </>
          ) : (
            <>
              <span>List</span>
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>

      {/* Sidebar - Toggleable on mobile, always visible on desktop */}
      <div
        className={`${
          showList ? 'block' : 'hidden'
        } lg:block w-full lg:w-64 border-b lg:border-b-0 lg:border-r bg-white overflow-y-auto absolute lg:relative inset-0 lg:inset-auto z-10 lg:z-0`}
      >
        <div className="p-4">
          {/* Desktop header */}
          <div className="hidden lg:block">
            <h2 className="text-lg font-bold mb-4">📝 To Review</h2>
          </div>
          
          {/* Mobile header inside list */}
          <div className="lg:hidden flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Select Receipt</h2>
            <button
              onClick={toggleList}
              className="text-gray-500 hover:text-gray-700 p-2"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          </div>

          <ul className="space-y-2">
            {receipts.map((r) => (
              <li
                key={r.id}
                className={`cursor-pointer p-3 rounded text-sm transition-colors ${
                  r.id === selectedId
                    ? 'bg-blue-100 text-blue-800 font-medium'
                    : 'hover:bg-gray-100'
                } ${isEditing ? 'opacity-50' : ''}`}
                onClick={() => handleSelect(r.id)}
              >
                <div className="font-medium">{r.supplier || 'Unknown'}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {r.receiptDate || 'No Date'}
                </div>
                {r.totalAmount && (
                  <div className="text-xs text-gray-600 mt-1">
                    {r.totalAmount}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right panel - Main content */}
      <div className={`flex-1 overflow-y-auto p-4 sm:p-6 ${showList ? 'hidden lg:block' : 'block'}`}>
        {!loading && selected ? (
          <ReviewPanel userId={userId!} receipt={selected} setIsEditing={setIsEditing} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">No receipt selected.</p>
          </div>
        )}
      </div>

      {/* Floating Toggle Button for Mobile (when list is hidden) */}
      {!showList && (
        <button
          onClick={toggleList}
          className="lg:hidden fixed bottom-24 right-4 z-30 flex items-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-all"
        >
          <span className="text-sm font-medium">List</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default ReviewPage;