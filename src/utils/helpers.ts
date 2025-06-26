// src/utils/helpers.ts
// Convert file to Base64 string
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]); // Remove data:image/... prefix
    };
    reader.onerror = error => reject(error);
  });
};

// Check if receipt data is missing critical fields
export const isMissingCriticalFields = (data: any): boolean => {
  return !data?.supplier || data.supplier === 'N/A' ||
         !data?.totalAmount || data.totalAmount === 'N/A' ||
         !data?.receiptDate || data.receiptDate === 'N/A';
};

// Generate a unique key for a receipt to prevent duplicates
export const generateReceiptKey = (data: any): string => {
  const supplier = (data.supplier || 'N/A').trim().toLowerCase();
  const total = (data.totalAmount || 'N/A').replace(/[^\d.]/g, '');
  const date = (data.receiptDate || 'N/A').trim();
  const items = (data.items || [])
    .map((i: any) => (i.name || '').trim().toLowerCase())
    .sort()
    .join('|');

  return `${supplier}-${total}-${date}-${items}`;
};

// Format currency values consistently
export const formatCurrency = (value: string | number): string => {
  const num = typeof value === 'string' ? 
    parseFloat(value.replace(/[^\d.]/g, '')) : value;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(isNaN(num) ? 0 : num);
};

// Type definition needed for Gemini responses
// src/types/gemini.ts
export interface ResponseSchema {
  type: string;
  properties: Record<string, any>;
  items?: {
    type: string;
    properties?: Record<string, any>;
  };
}