import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode
} from 'react';

type ScanStatus = {
  name: string;
  status: 'pending' | 'processing' | 'done' | 'needs_review' | 'failed';
  message?: string;
};

type ScannerContextType = {
  images: File[];
  logs: ScanStatus[];
  failedImages: File[];
  loading: boolean;
  error: string;
  setImages: (images: File[]) => void;
  setLogs: (logs: ScanStatus[]) => void;
  setFailedImages: (images: File[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string) => void;
  updateLog: (index: number, update: Partial<ScanStatus>) => void;
  addLog: (log: ScanStatus) => void;
  clearAll: () => void;
  isProcessing: boolean;
};

const ScannerContext = createContext<ScannerContextType | undefined>(undefined);

export const useScannerContext = () => {
  const context = useContext(ScannerContext);
  if (!context) {
    throw new Error('useScannerContext must be used within a ScannerProvider');
  }
  return context;
};

type ScannerProviderProps = {
  children: ReactNode;
};

const STORAGE_KEY = 'scanner-context';

export const ScannerProvider: React.FC<ScannerProviderProps> = ({ children }) => {
  const [images, setImages] = useState<File[]>([]);
  const [logs, setLogs] = useState<ScanStatus[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    try {
      return saved ? JSON.parse(saved)?.logs || [] : [];
    } catch {
      return [];
    }
  });

  const [failedImages, setFailedImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    try {
      return saved ? JSON.parse(saved)?.error || '' : '';
    } catch {
      return '';
    }
  });

  const updateLog = (index: number, update: Partial<ScanStatus>) => {
    setLogs(prevLogs =>
      prevLogs.map((log, i) => (i === index ? { ...log, ...update } : log))
    );
  };

  const addLog = (log: ScanStatus) => {
    setLogs(prevLogs => [...prevLogs, log]);
  };

  const clearAll = () => {
    setImages([]);
    setLogs([]);
    setFailedImages([]);
    setLoading(false);
    setError('');
    localStorage.removeItem(STORAGE_KEY);
  };

  const isProcessing = loading || logs.some(log => log.status === 'processing');

  // 🔁 Persist logs and error in localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ logs, error }));
  }, [logs, error]);

  const value: ScannerContextType = {
    images,
    logs,
    failedImages,
    loading,
    error,
    setImages,
    setLogs,
    setFailedImages,
    setLoading,
    setError,
    updateLog,
    addLog,
    clearAll,
    isProcessing,
  };

  return (
    <ScannerContext.Provider value={value}>
      {children}
    </ScannerContext.Provider>
  );
};
