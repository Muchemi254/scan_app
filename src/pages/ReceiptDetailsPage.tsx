// src/pages/ReceiptDetailsPage.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import ReceiptForm from '../components/ReceiptForm';
import { uploadImageToStorage } from '../services/storage';

const ReceiptDetailsPage = ({ userId }: { userId: string | null }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [receipt, setReceipt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [newImage, setNewImage] = useState<File | null>(null);

  useEffect(() => {
    if (!userId || !id) return;

    const fetchReceipt = async () => {
      const docRef = doc(db, `users/${userId}/receipts`, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setReceipt({ id: docSnap.id, ...docSnap.data() });
      } else {
        navigate('/');
      }
      setLoading(false);
    };

    fetchReceipt();
  }, [userId, id, navigate]);

  const handleUpdate = async (updatedData: any) => {
    if (!userId || !id) return;

    try {
      setLoading(true);
      const docRef = doc(db, `users/${userId}/receipts`, id);
      
      // Upload new image if provided
      let imageUrl = receipt.imageUrl;
      if (newImage) {
        imageUrl = await uploadImageToStorage(userId, newImage);
      }

      await updateDoc(docRef, {
        ...updatedData,
        imageUrl,
        updatedAt: new Date(),
        status: 'processed'
      });

      setReceipt({ ...receipt, ...updatedData, imageUrl });
      setEditing(false);
      setNewImage(null);
    } catch (error) {
      console.error("Error updating receipt:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!userId || !id) return;

    try {
      setLoading(true);
      const docRef = doc(db, `users/${userId}/receipts`, id);
      await deleteDoc(docRef);
      navigate('/');
    } catch (error) {
      console.error("Error deleting receipt:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg">Loading...</div>
    </div>
  );
  
  if (!receipt) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg">Receipt not found</div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-4 sm:py-6 max-w-7xl">
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-bold truncate">
            {receipt.supplier || 'Receipt Details'}
          </h2>
          <div className="flex gap-2">
            <button 
              onClick={() => setEditing(!editing)} 
              className="flex-1 sm:flex-none px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm sm:text-base"
            >
              {editing ? 'Cancel' : 'Edit'}
            </button>
            <button 
              onClick={handleDelete} 
              className="flex-1 sm:flex-none px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm sm:text-base"
              disabled={loading}
            >
              Delete
            </button>
          </div>
        </div>

        {editing ? (
          <ReceiptForm 
            initialData={receipt} 
            onSubmit={handleUpdate} 
            onImageChange={setNewImage}
            loading={loading}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Details Section */}
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-3 text-base sm:text-lg">Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2 text-sm sm:text-base">
                  <p><strong>Supplier:</strong> {receipt.supplier || 'N/A'}</p>
                  <p><strong>Total:</strong> {receipt.totalAmount || 'N/A'}</p>
                  <p><strong>Date:</strong> {receipt.receiptDate || 'N/A'}</p>
                  <p><strong>Category:</strong> {receipt.category || 'N/A'}</p>
                </div>
              </div>
              
              {receipt.items && receipt.items.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 text-base sm:text-lg">Items</h3>
                  <div className="max-h-64 overflow-y-auto border rounded p-3">
                    <ul className="space-y-2">
                      {receipt.items.map((item: any, index: number) => (
                        <li key={index} className="text-sm sm:text-base flex flex-col sm:flex-row sm:justify-between gap-1">
                          <span className="font-medium">{item.name}</span>
                          <span className="text-gray-600">
                            Qty: {item.quantity} @ {item.price}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
            
            {/* Image Section */}
            {receipt.imageUrl && (
              <div className="lg:sticky lg:top-4 lg:self-start">
                <h3 className="font-semibold mb-3 text-base sm:text-lg">Receipt Image</h3>
                <div className="relative w-full">
                  <img 
                    src={receipt.imageUrl} 
                    alt="Receipt" 
                    className="w-full h-auto max-h-[60vh] sm:max-h-[70vh] lg:max-h-[80vh] object-contain rounded border shadow-sm"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceiptDetailsPage;