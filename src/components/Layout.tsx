import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { auth } from '../services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { UserIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

const Layout = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setIsLoggedIn(!!user);
      setUserEmail(user?.email || null);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const navLinkStyle = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium ${
      isActive ? 'text-blue-700 font-semibold' : 'text-gray-500 hover:text-gray-700'
    }`;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex space-x-8">
              <NavLink to="/dashboard" className={navLinkStyle}>Dashboard</NavLink>
              <NavLink to="/scanner" className={navLinkStyle}>Scan Receipts</NavLink>
              <NavLink to="/receipts" className={navLinkStyle}>View Scanned Receipts</NavLink>
              <NavLink to="/review" className={navLinkStyle}>Review</NavLink>
              <NavLink to="/export" className={navLinkStyle}>Export</NavLink>
            </div>
            <div className="flex items-center gap-4">
              {isLoggedIn ? (
                <>
                  <div className="flex items-center gap-1 text-sm text-gray-700">
                    <UserIcon className="h-5 w-5 text-gray-600" />
                    {userEmail}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center text-sm font-medium text-red-600 hover:text-red-800"
                  >
                    <ArrowRightOnRectangleIcon className="h-5 w-5 mr-1" />
                    Logout
                  </button>
                </>
              ) : (
                <NavLink
                  to="/login"
                  className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5 mr-1" />
                  Login
                </NavLink>
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
