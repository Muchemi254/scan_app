// src/App.tsx
import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { initAuth } from './services/firebase';

import ScannerPage from './pages/ScannerPage';
import DashboardPage from './pages/DashboardPage';
import ReceiptDetailsPage from './pages/ReceiptDetailsPage';
import ReviewPage from './pages/ReviewPage';
import ExportPage from './pages/ExportPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import Layout from './components/Layout';
import ViewScansPage from './pages/ViewScansPage';

import { ScannerProvider } from './contexts/ScannerContext';

const App = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = initAuth((uid) => {
      setUserId(uid);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
        <Route path="/" element={<DashboardPage userId={null} />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/dashboard" element={<DashboardPage userId={userId} />} />
          <Route path="/receipts/:id" element={<ReceiptDetailsPage userId={userId} />} />
          <Route path="/review" element={<ReviewPage userId={userId} />} />
          <Route path="/export" element={<ExportPage userId={userId} />} />
          <Route path="/receipts" element={<ViewScansPage userId={userId} />} />

          {/* 🔸 Wrap ScannerPage with ScannerProvider */}
          <Route
            path="/scanner"
            element={
              <ScannerProvider>
                <ScannerPage userId={userId} />
              </ScannerProvider>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
