import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setLoading, setAuth, setError } from '../../store/authSlice';
import testService from '../../utils/apiService';
import type { RootState } from '../../store';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(setLoading(true));
    try {
      const res = await testService.login(email);
      dispatch(setAuth({ user: res.data.user, token: res.data.token }));
      
      if (res.data.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      dispatch(setError(err.response?.data?.message || 'Login failed. Please check your credentials.'));
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 flex flex-col justify-center py-12 px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-block mb-8">
          <div className="w-10 h-10 border border-cream-950 flex items-center justify-center text-cream-950 font-serif font-bold text-xl mx-auto">
            N
          </div>
        </Link>
        <h2 className="text-3xl font-serif font-bold text-cream-950 tracking-tight">Welcome Back</h2>
        <p className="mt-2 text-sm text-cream-600 font-light italic">Enter your credentials to access the platform</p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-10 px-8 border border-cream-200 shadow-sm rounded-sm">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="text-red-800 text-xs bg-red-50 p-3 border-l-2 border-red-800 font-medium">
                {error}
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-[10px] font-bold uppercase tracking-widest text-cream-500 mb-2">
                Professional Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="block w-full border border-cream-200 rounded-sm px-4 py-3 text-sm focus:ring-0 focus:border-cream-900 transition-colors placeholder:text-cream-200"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-sm text-xs font-bold uppercase tracking-widest text-cream-50 bg-cream-900 hover:bg-cream-950 focus:outline-none transition-all disabled:opacity-50 shadow-lg shadow-cream-200"
              >
                {isLoading ? 'Processing...' : 'Sign In'}
              </button>
            </div>
          </form>

          <div className="mt-8 border-t border-cream-100 pt-8 text-center">
            <p className="text-xs text-cream-500 font-medium tracking-wide">
              New to the platform?{' '}
              <Link to="/signup" className="text-cream-950 font-bold hover:underline underline-offset-4">
                Create Account
              </Link>
            </p>
          </div>
        </div>
        
        <p className="mt-10 text-center text-[10px] text-cream-400 uppercase tracking-[0.2em] font-bold">
          NextGen Assessment Systems
        </p>
      </div>
    </div>
  );
};

export default Login;
