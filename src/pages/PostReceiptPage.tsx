import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, storage } from '../services/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import ReceiptForm from '../components/ReceiptForm';

const PostReceiptPage = ({ userId }: { userId: string | null }) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleSubmit = async (data: any) => {
    if (!userId) return;

    setLoading(true);
    try {
      let imageUrl = '';
      if (imageFile) {
        const storageRef = ref(
          storage,
          `receipts/${userId}/${Date.now()}_${imageFile.name}`
        );
        await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(storageRef);
      }

      const doc = {
        ...data,
        imageUrl,
        status: 'processed',
        timestamp: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, `users/${userId}/receipts`), doc);
      navigate('/receipts');
    } catch (error) {
      console.error('Failed to post receipt:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-xl font-semibold mb-4 text-blue">!!!USE THIS WHEN SCANNING FAILS</h1>
      <h2 className="text-xl font-semibold mb-4">📝 Manually Post Receipt</h2>
      
      <ReceiptForm
        initialData={{}}
        onSubmit={handleSubmit}
        onImageChange={(file) => setImageFile(file)}
        loading={loading}
      />
    </div>
  );
};

export default PostReceiptPage;
