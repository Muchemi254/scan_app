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
import PrivateRoute from './contexts/PrivateRoute';

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
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Private routes */}
        <Route element={<Layout />}>
          <Route
            path="/"
            element={
              <PrivateRoute userId={userId}>
                <DashboardPage userId={userId} />
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute userId={userId}>
                <DashboardPage userId={userId} />
              </PrivateRoute>
            }
          />
          <Route
            path="/scanner"
            element={
              <PrivateRoute userId={userId}>
                <ScannerProvider>
                  <ScannerPage userId={userId} />
                </ScannerProvider>
              </PrivateRoute>
            }
          />
          <Route
            path="/receipts"
            element={
              <PrivateRoute userId={userId}>
                <ViewScansPage userId={userId} />
              </PrivateRoute>
            }
          />
          <Route
            path="/receipts/:id"
            element={
              <PrivateRoute userId={userId}>
                <ReceiptDetailsPage userId={userId} />
              </PrivateRoute>
            }
          />
          <Route
            path="/review"
            element={
              <PrivateRoute userId={userId}>
                <ReviewPage userId={userId} />
              </PrivateRoute>
            }
          />
          <Route
            path="/export"
            element={
              <PrivateRoute userId={userId}>
                <ExportPage userId={userId} />
              </PrivateRoute>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
