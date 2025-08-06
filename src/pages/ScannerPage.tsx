import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fileToBase64 } from '../utils/helpers';
import { extractReceiptData } from '../services/gemini';
import { uploadImageToStorage } from '../services/storage';
import { saveReceipt } from '../services/firestore';
import { useScannerContext } from '../contexts/ScannerContext';

const ScannerPage = ({ userId }: { userId: string | null }) => {
  const {
    images,
    logs,
    failedImages,
    loading,
    error,
    batchTitle,
    setImages,
    setLogs,
    setFailedImages,
    setLoading,
    setError,
    setBatchTitle,
    updateLog,
    clearAll,
    isProcessing,
    hasActiveSession,
  } = useScannerContext();
  const navigate = useNavigate();

  // Check if there are any incomplete logs from previous sessions
  const hasIncompleteWork = hasActiveSession;

  useEffect(() => {
    const originalTitle = document.title;
    document.title = isProcessing ? `⏳ Processing... - ${originalTitle}` : originalTitle;
    return () => { document.title = originalTitle; };
  }, [isProcessing]);

  // Clean up stale pending logs on component mount
  useEffect(() => {
    if (hasIncompleteWork && images.length === 0) {
      // Clear stale logs if no images are selected
      setLogs([]);
    }
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setImages(files);
      setLogs(files.map(f => ({ name: f.name, status: 'pending' })));
      setFailedImages([]);
      setError('');
    }
  };

  const isMissing = (val: any) =>
    val === undefined || val === null || val === 'N/A' || val === '' || (typeof val === 'string' && val.trim() === '');

  const hasMissingFields = (data: any): boolean => {
    const requiredFields = ['supplier', 'receiptDate', 'totalAmount', 'taxAmount', 'category', 'invoiceNumber', 'kraPin', 'cuInvoice'];
    for (const key of requiredFields) {
      if (isMissing(data[key])) return true;
    }

    const items = data.items;
    if (!Array.isArray(items) || items.length === 0) return true;

    for (const item of items) {
      if (
        isMissing(item.name) ||
        isMissing(item.quantity) ||
        isMissing(item.price) ||
        (!item.isZeroRated && isMissing(item.tax))
      ) {
        return true;
      }
    }

    return false;
  };

  const processImages = async () => {
    if (!userId || images.length === 0 || !batchTitle?.trim()) {
      alert("Please enter a batch title before processing.");
      return;
    }

    setLoading(true);
    setError('');
    const failed: File[] = [];

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      updateLog(i, { status: 'processing' });

      try {
        const base64Image = await fileToBase64(image);
        const extractedData = await extractReceiptData(base64Image, image.type);
        const imageUrl = await uploadImageToStorage(userId, image);

        const dataToSave = {
          ...extractedData,
          imageUrl,
          batchTitle: batchTitle?.trim() || '',
          timestamp: new Date().toISOString(),
        };

        const hasMissing = hasMissingFields(dataToSave);

        await saveReceipt(userId, {
          ...dataToSave,
          status: hasMissing ? 'needs_review' : 'processed',
        });

        updateLog(i, {
          status: hasMissing ? 'needs_review' : 'done',
          message: hasMissing ? 'Missing fields - saved for review' : 'Saved successfully'
        });

      } catch (err) {
        console.error(`Error processing ${image.name}`, err);
        updateLog(i, {
          status: 'failed',
          message: 'Failed to process'
        });
        failed.push(image);
      }
    }

    setFailedImages(failed);
    setLoading(false);
  };

  const retryFailed = () => {
    setImages(failedImages);
    setLogs(failedImages.map(f => ({ name: f.name, status: 'pending' })));
    setFailedImages([]);
    setError('');
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all processing data?')) {
      clearAll();
    }
  };

  // Check if processing is truly complete
  const isProcessingComplete = logs.length > 0 && 
    logs.every(log => log.status === 'done' || log.status === 'needs_review' || log.status === 'failed') &&
    !loading && 
    failedImages.length === 0;

  return (
    <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl mx-auto mt-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">📄 Scan Receipts</h2>
        {(logs.length > 0 || isProcessing) && (
          <button
            onClick={handleClearAll}
            disabled={loading}
            className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">🏷️ Batch Title</label>
        <input
          type="text"
          value={batchTitle || ''}
          onChange={(e) => setBatchTitle(e.target.value)}
          placeholder="e.g. June Market Run"
          className="w-full px-4 py-2 border rounded"
          disabled={loading}
        />
      </div>

      {isProcessing && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-blue-700 text-sm">
          <div className="flex items-center">
            <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2"></div>
            Processing in progress... You can navigate away and come back to check status.
          </div>
        </div>
      )}

      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleImageChange}
        disabled={loading}
        className="block w-full text-sm text-gray-700
                   file:mr-4 file:py-2 file:px-4
                   file:rounded-full file:border-0
                   file:text-sm file:font-semibold
                   file:bg-indigo-50 file:text-indigo-700
                   hover:file:bg-indigo-100 mb-4
                   disabled:opacity-50 disabled:cursor-not-allowed"
      />

      <button
        onClick={processImages}
        disabled={loading || !userId || images.length === 0 || !batchTitle?.trim()}
        className={`w-full py-2 px-4 rounded-md text-white font-medium text-lg transition
                    ${loading || !userId || images.length === 0 || !batchTitle?.trim()
                      ? 'bg-indigo-300 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700'}`}
      >
        {loading ? 'Processing...' : '📤 Process Images'}
      </button>

      {error && <p className="text-red-600 text-sm mt-4">{error}</p>}

      {logs.length > 0 && (
        <div className="mt-6 space-y-2">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium text-gray-700">Processing Status</h3>
            <div className="text-xs text-gray-500">
              {logs.filter(l => l.status === 'done').length} completed, {' '}
              {logs.filter(l => l.status === 'needs_review').length} need review, {' '}
              {logs.filter(l => l.status === 'failed').length} failed
            </div>
          </div>

          {logs.map((log, i) => (
            <div
              key={i}
              className="text-sm flex justify-between items-center border p-2 rounded bg-gray-50"
            >
              <span className="truncate flex-1 mr-2">{log.name}</span>
              <span
                className={`whitespace-nowrap flex items-center ${
                  log.status === 'done' ? 'text-green-600'
                    : log.status === 'needs_review' ? 'text-yellow-600'
                    : log.status === 'failed' ? 'text-red-600'
                    : log.status === 'processing' ? 'text-blue-600'
                    : 'text-gray-600'
                }`}
              >
                {log.status === 'processing' && (
                  <div className="animate-spin h-3 w-3 border border-blue-600 border-t-transparent rounded-full mr-1"></div>
                )}
                {log.status === 'done' && '✅ '}
                {log.status === 'needs_review' && '⚠️ '}
                {log.status === 'failed' && '❌ '}
                {log.status === 'pending' && '⏳ '}
                {log.message || log.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {failedImages.length > 0 && !loading && (
        <div className="mt-4 text-right">
          <button
            onClick={retryFailed}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            🔁 Retry Failed ({failedImages.length})
          </button>
        </div>
      )}

      {isProcessingComplete && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
          ✅ All images processed successfully!
          <button
            onClick={() => navigate('/receipts')}
            className="ml-2 text-green-600 underline hover:text-green-800"
          >
            View Receipts
          </button>
        </div>
      )}
    </div>
  );
};

export default ScannerPage;