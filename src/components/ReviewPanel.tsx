// src/components/ReviewPanel.tsx
import { useState, useEffect } from 'react';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import ReceiptForm from './ReceiptForm';
import { uploadImageToStorage } from '../services/storage';
import type { ReceiptData } from '../types/gemini';
import { getStorage, ref, deleteObject } from 'firebase/storage';


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
  }, [editing]);

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
            className="px-3 py-1 text-sm rounded bg-blue-500 text-white"
          >
            {editing ? 'Cancel' : 'Edit'}
          </button>
          <button
            onClick={handleDelete}
            className="px-3 py-1 text-sm rounded bg-red-500 text-white"
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
            <p><strong>Supplier:</strong> {receipt.supplier || 'N/A'}</p>
            <p><strong>Total:</strong> {receipt.totalAmount || 'N/A'}</p>
            <p><strong>Date:</strong> {receipt.receiptDate || 'N/A'}</p>
            <p><strong>Category:</strong> {receipt.category || 'N/A'}</p>
            <p><strong>Invoice:</strong> {receipt.invoiceNumber || 'N/A'}</p>
            <p><strong>cu Invoice:</strong> {receipt.cuInvoice || 'N/A'}</p>
            <p><strong>Tax:</strong> {receipt.taxAmount || 'N/A'}</p>
            <h4 className="font-semibold mt-4 mb-2">Items</h4>
            <ul className="space-y-1 text-sm">
              {receipt.items?.map((item: any, index: number) => (
                <li key={index}>
                  - {item.name} ({item.quantity} @ {item.price})
                </li>
              ))}
            </ul>
          </div>
          {receipt.imageUrl && (
            <div>
              <img
                src={receipt.imageUrl}
                alt="Receipt"
                className="rounded border max-w-full h-auto"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReviewPanel;
