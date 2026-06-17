import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setLoading, setAuth, setError } from '../../store/authSlice';
import testService from '../../utils/apiService';
import type { RootState } from '../../store';

const VerifyOTP: React.FC = () => {
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  const { name, email } = location.state || {};

  useEffect(() => {
    dispatch(setLoading(false));
    if (!email) {
      navigate('/signup');
    }
  }, [email, navigate, dispatch]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(setLoading(true));
    try {
      const res = await testService.verifyOTP(name, email, otp);
      dispatch(setAuth({ user: res.data.user, token: res.data.token }));

      if (res.data.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Verification failed. Please check your connection.';
      dispatch(setError(message));
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    dispatch(setLoading(true));
    try {
      await testService.resendOTP(email);
      setTimer(60);
      setCanResend(false);
      dispatch(setLoading(false));
    } catch (err: any) {
      dispatch(setError(err.response?.data?.message || 'Failed to resend OTP.'));
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 flex flex-col justify-center py-12 px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-10 h-10 border border-cream-950 flex items-center justify-center text-cream-950 font-serif font-bold text-xl mx-auto mb-8">
          N
        </div>
        <h2 className="text-3xl font-serif font-bold text-cream-950 tracking-tight">Verify Identity</h2>
        <p className="mt-2 text-sm text-cream-600 font-light italic">
          Verification code dispatched to <span className="font-bold text-cream-900">{email}</span>
        </p>
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
              <label htmlFor="otp" className="block text-[10px] font-bold uppercase tracking-widest text-cream-500 mb-2 text-center">
                Secure Authentication Code
              </label>
              <input
                id="otp"
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="0 0 0 0 0 0"
                className="block w-full border border-cream-200 rounded-sm px-4 py-4 text-center text-3xl font-serif tracking-[0.5em] focus:ring-0 focus:border-cream-900 transition-colors placeholder:text-cream-100"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-sm text-xs font-bold uppercase tracking-widest text-cream-50 bg-cream-900 hover:bg-cream-950 focus:outline-none transition-all disabled:opacity-50 shadow-lg shadow-cream-200"
              >
                {isLoading ? 'Verifying...' : 'Authorize Access'}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center">
            {canResend ? (
              <button
                onClick={handleResend}
                className="text-xs text-cream-950 font-bold hover:underline underline-offset-4 uppercase tracking-widest"
              >
                Resend Code
              </button>
            ) : (
              <p className="text-[10px] text-cream-400 font-bold uppercase tracking-widest">
                Resend available in <span className="text-cream-950">{timer}s</span>
              </p>
            )}
          </div>
        </div>
        
        <p className="mt-10 text-center text-[10px] text-cream-400 uppercase tracking-[0.2em] font-bold">
          Security Protocol 4.0 &bull; NextGen
        </p>
      </div>
    </div>
  );
};

export default VerifyOTP;
