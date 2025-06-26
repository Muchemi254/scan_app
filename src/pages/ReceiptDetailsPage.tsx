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
  status: 'processed' // <-- mark as finished
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

  if (loading) return <div>Loading...</div>;
  if (!receipt) return <div>Receipt not found</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{receipt.supplier || 'Receipt Details'}</h2>
        <div className="flex gap-2">
          <button 
            onClick={() => setEditing(!editing)} 
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            {editing ? 'Cancel' : 'Edit'}
          </button>
          <button 
            onClick={handleDelete} 
            className="px-4 py-2 bg-red-500 text-white rounded"
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-2">Details</h3>
            <p><strong>Supplier:</strong> {receipt.supplier || 'N/A'}</p>
            <p><strong>Total:</strong> {receipt.totalAmount || 'N/A'}</p>
            <p><strong>Date:</strong> {receipt.receiptDate || 'N/A'}</p>
            <p><strong>Category:</strong> {receipt.category || 'N/A'}</p>
            
            <h3 className="font-semibold mt-4 mb-2">Items</h3>
            <ul className="space-y-1">
              {receipt.items?.map((item: any, index: number) => (
                <li key={index}>
                  - {item.name} (Qty: {item.quantity}) @ {item.price}
                </li>
              ))}
            </ul>
          </div>
          
          {receipt.imageUrl && (
            <div>
              <h3 className="font-semibold mb-2">Receipt Image</h3>
              <img 
                src={receipt.imageUrl} 
                alt="Receipt" 
                className="max-w-full h-auto rounded border"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReceiptDetailsPage;