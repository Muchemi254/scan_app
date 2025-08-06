// src/components/ReviewPanel.tsx
import { useState, useEffect } from 'react';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import ReceiptForm from './ReceiptForm';
import { uploadImageToStorage } from '../services/storage';
import type { ReceiptData } from '../types/gemini';
import { getStorage, ref, deleteObject } from 'firebase/storage';
import ImageViewer from './ImageViewer';


const ReviewPanel = ({
  userId,
  receipt,
  setIsEditing
}: {
  userId: string;
  receipt: ReceiptData;
  setIsEditing: (v: boolean) => void;
}) => {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newImage, setNewImage] = useState<File | null>(null);

  // Sync editing state to parent
  useEffect(() => {
    setIsEditing(editing);
  }, [editing, setIsEditing]);

  const handleUpdate = async (updatedData: any) => {
    if (!userId || !receipt.id) return;
    try {
      setLoading(true);
      let imageUrl = receipt.imageUrl;
      if (newImage) {
        imageUrl = await uploadImageToStorage(userId, newImage);
      }

      await updateDoc(doc(db, `users/${userId}/receipts`, receipt.id), {
        ...updatedData,
        imageUrl,
        updatedAt: new Date(),
        status: 'processed'
      });

      setEditing(false);
      setNewImage(null);
    } catch (error) {
      console.error("Update failed", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this receipt?')) {
      return;
    }

    if (!userId || !receipt.id) return;
    try {
      setLoading(true);
      // Delete image from storage if it exists
      if (receipt.imageUrl) {
        const storage = getStorage();
        const imageRef = ref(storage, receipt.imageUrl);
        await deleteObject(imageRef).catch((err) => {
          console.warn("⚠️ Failed to delete image from storage:", err);
        });
      }

      await deleteDoc(doc(db, `users/${userId}/receipts`, receipt.id));
    } catch (error) {
      console.error("Delete failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">{receipt.supplier || 'Receipt'}</h2>
        <div className="space-x-2">
          <button
            onClick={() => setEditing(prev => !prev)}
            className="px-3 py-1 text-sm rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors"
            disabled={loading}
          >
            {editing ? 'Cancel' : 'Edit'}
          </button>
          <button
            onClick={handleDelete}
            className="px-3 py-1 text-sm rounded bg-red-500 text-white hover:bg-red-600 transition-colors"
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete'}
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <p><strong>Supplier:</strong> {receipt.supplier || 'N/A'}</p>
              <p><strong>Total:</strong> {receipt.totalAmount || 'N/A'}</p>
              <p><strong>Date:</strong> {receipt.receiptDate || 'N/A'}</p>
              <p><strong>Category:</strong> {receipt.category || 'N/A'}</p>
              <p><strong>Invoice:</strong> {receipt.invoiceNumber || 'N/A'}</p>
              <p><strong>CU Invoice:</strong> {receipt.cuInvoice || 'N/A'}</p>
              <p><strong>Tax:</strong> {receipt.taxAmount || 'N/A'}</p>
              <p><strong>KRA PIN:</strong> {receipt.kraPin || 'N/A'}</p>
            </div>
            
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Items</h4>
              <div className="max-h-32 overflow-y-auto">
                <ul className="space-y-1 text-sm">
                  {receipt.items?.map((item: any, index: number) => (
                    <li key={index} className="flex justify-between items-center">
                      <span>{item.name}</span>
                      <span className="text-gray-600">
                        {item.quantity} × {item.price} = {item.total || 'N/A'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          
          {receipt.imageUrl && (
            <div>
              <h4 className="font-semibold mb-2">Receipt Image</h4>
              <ImageViewer 
                imageUrl={receipt.imageUrl} 
                altText={`Receipt from ${receipt.supplier || 'Unknown'}`}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReviewPanel;