import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/authSlice';
import testService from '../utils/apiService';
import type { RootState } from '../store';

interface TestSummary {
  _id: string;
  title: string;
  description: string;
  durationInMinutes: number;
  status: 'scheduled' | 'waiting' | 'active' | 'completed';
}

const Dashboard: React.FC = () => {
  const [tests, setTests] = useState<TestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const res = await testService.getAvailableTests();
        setTests(res.data);
      } catch (err) {
        console.error('Failed to fetch tests:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTests();
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-cream-50 font-sans text-cream-900">
      <nav className="bg-white border-b border-cream-200">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link to="/" className="w-8 h-8 border border-cream-950 flex items-center justify-center text-cream-950 font-serif font-bold text-lg">
              N
            </Link>
            <span className="text-lg font-serif font-bold text-cream-950 tracking-wide">NextGen</span>
          </div>
          
          <div className="flex items-center gap-6">
            <span className="text-sm text-cream-600 hidden sm:inline">
              Candidate: <span className="font-bold text-cream-900">{user?.name}</span>
            </span>
            <button 
              onClick={handleLogout}
              className="text-xs uppercase tracking-widest font-bold text-cream-500 hover:text-cream-950 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto py-16 px-6">
        <header className="mb-16">
          <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-cream-400 mb-2">Available Sessions</div>
          <h2 className="text-4xl text-cream-950 mb-4">Assigned Assessments</h2>
          <p className="text-cream-600 max-w-2xl font-light italic">
            Please select an assessment to begin. Note that you can only enter the waiting room when the administrator has authorized entry.
          </p>
        </header>

        {loading ? (
          <div className="flex flex-col items-center py-32">
            <div className="w-12 h-12 border-2 border-cream-200 border-t-cream-900 rounded-full animate-spin"></div>
            <p className="mt-6 text-sm text-cream-400 uppercase tracking-widest font-bold">Initializing...</p>
          </div>
        ) : tests.length === 0 ? (
          <div className="bg-white border border-dashed border-cream-300 rounded-sm p-24 text-center">
            <p className="text-cream-400 font-light italic">There are currently no assessments assigned to your account.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tests.map((test) => (
              <div 
                key={test._id}
                className="bg-white border border-cream-200 p-8 rounded-sm shadow-sm hover:shadow-premium transition-all group"
              >
                <div className="mb-8">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-serif text-cream-950 group-hover:text-cream-700 transition-colors">{test.title}</h3>
                    <span className="text-[10px] uppercase font-bold text-cream-400">ID: {test._id.slice(-4)}</span>
                  </div>
                  <p className="text-sm text-cream-600 line-clamp-2 font-light leading-relaxed mb-6">{test.description}</p>
                  
                  <div className="flex items-center gap-6 pt-6 border-t border-cream-50">
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase font-bold text-cream-400 tracking-tighter">Duration</span>
                      <span className="text-sm font-bold text-cream-900">{test.durationInMinutes} mins</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase font-bold text-cream-400 tracking-tighter">Format</span>
                      <span className="text-sm font-bold text-cream-900">MCQ Only</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (test.status === 'waiting') {
                      navigate(`/test/wait/${test._id}`);
                    } else if (test.status === 'active') {
                      navigate(`/test/${test._id}`);
                    }
                  }}
                  disabled={test.status !== 'waiting' && test.status !== 'active'}
                  className={`w-full py-3.5 text-xs uppercase tracking-widest font-bold transition-all ${
                    (test.status === 'waiting' || test.status === 'active')
                      ? 'bg-cream-900 text-cream-50 hover:bg-cream-950 shadow-lg shadow-cream-100'
                      : 'bg-cream-100 text-cream-400 cursor-not-allowed'
                  }`}
                >
                  {test.status === 'waiting' ? 'Enter Waiting Room' : 
                   test.status === 'active' ? 'Enter Live Session' : 
                   'Awaiting Authorization'}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="mt-32 py-12 border-t border-cream-100">
        <p className="text-center text-[10px] text-cream-400 uppercase tracking-widest font-bold">
          NextGen Technical Assessment Protocol
        </p>
      </footer>
    </div>
  );
};

export default Dashboard;
