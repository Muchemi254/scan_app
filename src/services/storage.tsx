// src/services/storage.ts
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const uploadImageToStorage = async (userId: string, file: File) => {
  const storage = getStorage();
  const storageRef = ref(storage, `receipts/${userId}/${file.name}`);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
};