// src/services/firestore.ts
import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const saveReceipt = async (userId: string, data: any) => {
  const receiptsRef = collection(db, `users/${userId}/receipts`);
  return await addDoc(receiptsRef, {
    ...data,
    timestamp: serverTimestamp()
  });
};