import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import PostReceiptPage from './pages/PostReceiptPage';

const App = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initializeAuth = async () => {
      try {
        unsubscribe = initAuth((uid) => {
          setUserId(uid);
          setLoading(false);
          setError(null);
        });
      } catch (err) {
        console.error('Auth initialization error:', err);
        setError('Failed to initialize authentication. Please refresh the page.');
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Loading state - mobile responsive
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center space-y-4 max-w-sm w-full">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-gray-600 text-base sm:text-lg">Loading your account...</p>
        </div>
      </div>
    );
  }

  // Error state - mobile responsive
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 sm:p-8 text-center space-y-4">
          <div className="text-red-500 text-4xl sm:text-5xl">⚠️</div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-800">Authentication Error</h2>
          <p className="text-sm sm:text-base text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm sm:text-base"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route 
          path="/login" 
          element={userId ? <Navigate to="/dashboard" replace /> : <LoginPage />} 
        />
        <Route 
          path="/signup" 
          element={userId ? <Navigate to="/dashboard" replace /> : <SignupPage />} 
        />

        {/* Private routes with Layout */}
        <Route element={<Layout />}>
          {/* Root redirect */}
          <Route
            path="/"
            element={
              <PrivateRoute userId={userId}>
                <Navigate to="/dashboard" replace />
              </PrivateRoute>
            }
          />

          {/* Dashboard */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute userId={userId}>
                <DashboardPage userId={userId} />
              </PrivateRoute>
            }
          />

          {/* Scanner with Context */}
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

          {/* Receipts List */}
          <Route
            path="/receipts"
            element={
              <PrivateRoute userId={userId}>
                <ViewScansPage userId={userId} />
              </PrivateRoute>
            }
          />

          {/* Receipt Details */}
          <Route
            path="/receipts/:id"
            element={
              <PrivateRoute userId={userId}>
                <ReceiptDetailsPage userId={userId} />
              </PrivateRoute>
            }
          />

          {/* Review */}
          <Route
            path="/review"
            element={
              <PrivateRoute userId={userId}>
                <ReviewPage userId={userId} />
              </PrivateRoute>
            }
          />

          {/* Export */}
          <Route
            path="/export"
            element={
              <PrivateRoute userId={userId}>
                <ExportPage userId={userId} />
              </PrivateRoute>
            }
          />

          {/* Post Receipt */}
          <Route
            path="/post-receipt"
            element={
              <PrivateRoute userId={userId}>
                <PostReceiptPage userId={userId} />
              </PrivateRoute>
            }
          />

          {/* 404 Fallback - mobile responsive */}
          <Route
            path="*"
            element={
              <PrivateRoute userId={userId}>
                <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
                  <div className="text-center space-y-4 max-w-md">
                    <h1 className="text-5xl sm:text-6xl font-bold text-gray-300">404</h1>
                    <h2 className="text-xl sm:text-2xl font-semibold text-gray-700">Page Not Found</h2>
                    <p className="text-sm sm:text-base text-gray-500">The page you're looking for doesn't exist.</p>
                    <a
                      href="/dashboard"
                      className="inline-block w-full sm:w-auto px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm sm:text-base"
                    >
                      Go to Dashboard
                    </a>
                  </div>
                </div>
              </PrivateRoute>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;