// src/components/Layout.tsx
import { Link, useNavigate, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { auth } from '../services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

const Layout = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setIsLoggedIn(!!user);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex space-x-8">
              <Link to="/dashboard" className="text-sm font-medium text-gray-900">Dashboard</Link>
              <Link to="/scanner" className="text-sm font-medium text-gray-500 hover:text-gray-700">Scan Receipts</Link>
              <Link to="/receipts" className="text-sm font-medium text-gray-500 hover:text-gray-700">View Scanned Receipts</Link>
              <Link to="/review" className="text-sm font-medium text-gray-500 hover:text-gray-700">Review</Link>
              <Link to="/export" className="text-sm font-medium text-gray-500 hover:text-gray-700">Export</Link>
            </div>
            <div>
              {isLoggedIn ? (
                <button
                  onClick={handleLogout}
                  className="text-sm font-medium text-red-600 hover:text-red-800"
                >
                  Logout
                </button>
              ) : (
                <Link
                  to="/login"
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
