// src/pages/SignupPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../services/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';

const SignupPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      return setError('Passwords do not match.');
    }

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Signup failed.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleSignup}
        className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md space-y-6"
      >
        <h2 className="text-3xl font-bold text-center text-indigo-600">Sign Up</h2>

        {error && <div className="text-red-600 text-sm text-center">{error}</div>}

        <div>
          <label className="block text-gray-700">Email</label>
          <input
            type="email"
            required
            className="mt-1 w-full border border-gray-300 rounded-md p-2"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-gray-700">Password</label>
          <input
            type="password"
            required
            className="mt-1 w-full border border-gray-300 rounded-md p-2"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-gray-700">Confirm Password</label>
          <input
            type="password"
            required
            className="mt-1 w-full border border-gray-300 rounded-md p-2"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700"
        >
          Sign Up
        </button>

        <p className="text-center text-sm text-gray-500">
          Already have an account? <a href="/login" className="text-indigo-600 hover:underline">Login</a>
        </p>
      </form>
    </div>
  );
};

export default SignupPage;
