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
    <div className="bg-white rounded shadow p-3 sm:p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
        <h2 className="text-base sm:text-lg font-bold truncate">
          {receipt.supplier || 'Receipt'}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setEditing(prev => !prev)}
            className="flex-1 sm:flex-none px-3 py-1.5 sm:py-1 text-xs sm:text-sm rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50"
            disabled={loading}
          >
            {editing ? 'Cancel' : 'Edit'}
          </button>
          <button
            onClick={handleDelete}
            className="flex-1 sm:flex-none px-3 py-1.5 sm:py-1 text-xs sm:text-sm rounded bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>

      {editing ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          {/* Form Section */}
          <div className="order-2 xl:order-1">
            <ReceiptForm
              initialData={receipt}
              onSubmit={handleUpdate}
              onImageChange={setNewImage}
              loading={loading}
            />
          </div>

          {/* Image Viewer Section */}
          <div className="order-1 xl:order-2 xl:sticky xl:top-4 xl:self-start">
            {receipt.imageUrl || newImage ? (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm sm:text-base">
                  {newImage ? 'New Image Preview' : 'Current Image'}
                </h4>
                <ImageViewer
                  imageUrl={
                    newImage
                      ? URL.createObjectURL(newImage)
                      : receipt.imageUrl!
                  }
                  altText={`Receipt from ${receipt.supplier || 'Unknown'}`}
                />
              </div>
            ) : (
              <div className="border rounded p-4 text-sm text-gray-500 text-center">
                No receipt image available
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          {/* Details Section */}
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-3 text-sm sm:text-base">Receipt Information</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2 gap-2 text-xs sm:text-sm">
                <p><strong>Supplier:</strong> <span className="break-words">{receipt.supplier || 'N/A'}</span></p>
                <p><strong>Total:</strong> {receipt.totalAmount || 'N/A'}</p>
                <p><strong>Date:</strong> {receipt.receiptDate || 'N/A'}</p>
                <p><strong>Category:</strong> {receipt.category || 'N/A'}</p>
                <p><strong>Invoice:</strong> {receipt.invoiceNumber || 'N/A'}</p>
                <p><strong>CU Invoice:</strong> {receipt.cuInvoice || 'N/A'}</p>
                <p><strong>Tax:</strong> {receipt.taxAmount || 'N/A'}</p>
                <p><strong>KRA PIN:</strong> {receipt.kraPin || 'N/A'}</p>
              </div>
            </div>

            {receipt.items && receipt.items.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 text-sm sm:text-base">Items</h4>
                <div className="max-h-48 sm:max-h-64 overflow-y-auto border rounded p-2 sm:p-3">
                  <ul className="space-y-2">
                    {receipt.items.map((item: any, index: number) => (
                      <li key={index} className="text-xs sm:text-sm flex flex-col sm:flex-row sm:justify-between gap-1 pb-2 border-b last:border-b-0">
                        <span className="font-medium break-words">{item.name}</span>
                        <span className="text-gray-600 whitespace-nowrap">
                          {item.quantity} × {item.price}
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
            <div className="xl:sticky xl:top-4 xl:self-start">
              <h4 className="font-semibold mb-2 text-sm sm:text-base">Receipt Image</h4>
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