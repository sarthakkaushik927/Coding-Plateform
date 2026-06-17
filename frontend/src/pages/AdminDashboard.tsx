import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import testService from '../utils/apiService';

interface TestSummary {
  _id: string;
  title: string;
  status: 'scheduled' | 'waiting' | 'active' | 'completed';
  createdAt?: string;
}

interface WaitingUser {
  id: string | number;
  name: string;
  email: string;
}

interface QueueSummary {
  testId: string;
  title: string;
  status: string;
  activeSubmissionCount: number;
  completedSubmissionCount: number;
  waitingUsers: WaitingUser[];
}

type AdminSection = 'overview' | 'queue' | 'history' | 'create';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [tests, setTests] = useState<TestSummary[]>([]);
  const [queues, setQueues] = useState<QueueSummary[]>([]);
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');
  const [message, setMessage] = useState('');

  const fetchTests = async () => {
    try {
      const res = await testService.getTestHistory();
      setTests(res.data);
    } catch (err) {
      console.error('Failed to fetch tests:', err);
    }
  };

  const fetchQueues = async () => {
    try {
      const res = await testService.getWaitingQueues();
      setQueues(res.data);
    } catch (err) {
      console.error('Failed to fetch queues:', err);
    }
  };

  useEffect(() => {
    fetchTests();
    fetchQueues();
    const interval = setInterval(() => {
      fetchQueues();
      fetchTests();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenWaitingRoom = async (id: string) => {
    try {
      await testService.openWaitingRoom(id);
      setMessage('Waiting room is now open for candidates.');
      fetchTests();
      fetchQueues();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Failed to open waiting room.');
    }
  };

  const handleStartTest = async (id: string) => {
    try {
      await testService.startTest(id);
      setMessage('Test has been started for all waiting candidates.');
      fetchTests();
      fetchQueues();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Failed to start test.');
    }
  };

  const handleMarkCompleted = async (id: string) => {
    if (!window.confirm('Are you sure you want to force complete this test? All active candidates will be auto-submitted.')) return;
    try {
      await testService.completeTest(id);
      setMessage('Test has been manually completed.');
      fetchTests();
      fetchQueues();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Failed to complete test.');
    }
  };

  const queues_waiting = useMemo(() => queues.filter(q => q.status === 'waiting'), [queues]);

  const renderSidebar = () => (
    <aside className="w-72 border-r border-cream-200 flex flex-col h-full bg-white">
      <div className="p-10 pb-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 border border-cream-950 flex items-center justify-center text-cream-950 font-serif font-bold text-lg">
            N
          </div>
          <span className="text-lg font-serif font-bold text-cream-950 tracking-wide">NextGen</span>
        </div>
        <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-cream-400 mb-1">Administrative</div>
        <h1 className="text-2xl font-serif text-cream-950">Dashboard</h1>
      </div>
      
      <nav className="flex-1 px-6 py-8 space-y-2">
        {[
          { id: 'overview', label: 'Active Sessions' },
          { id: 'queue', label: 'Waiting Queues' },
          { id: 'history', label: 'Test Repository' },
          { id: 'create', label: 'Draft Assessment' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id as AdminSection)}
            className={`w-full text-left px-5 py-4 text-xs font-bold uppercase tracking-widest rounded-sm transition-all ${
              activeSection === item.id 
                ? 'bg-cream-950 text-cream-50 shadow-lg shadow-cream-100' 
                : 'text-cream-600 hover:bg-cream-50 hover:text-cream-950'
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-8 border-t border-cream-50">
        <Link 
          to="/"
          className="w-full block text-center py-2 text-[10px] text-cream-400 hover:text-cream-950 transition-colors uppercase tracking-[0.2em] font-bold"
        >
          Exit Terminal
        </Link>
      </div>
    </aside>
  );

  const renderQueueItem = (queue: QueueSummary) => {
    const isWaiting = queue.status === 'waiting';
    const isActive = queue.status === 'active';

    return (
      <div key={queue.testId} className="bg-white border border-cream-200 p-10 rounded-sm shadow-sm mb-8 transition-all hover:shadow-premium group">
        <div className="flex justify-between items-start mb-10">
          <div>
            <h3 className="text-2xl font-serif text-cream-950 mb-2 group-hover:text-cream-700 transition-colors">{queue.title}</h3>
            <div className="flex items-center gap-3">
              <span className={`text-[9px] uppercase font-black tracking-widest px-3 py-1 rounded-full border ${
                isActive ? 'bg-green-50 border-green-100 text-green-700' : 'bg-cream-50 border-cream-200 text-cream-600'
              }`}>
                {queue.status}
              </span>
              <span className="text-[10px] text-cream-300 font-bold uppercase tracking-widest">ID: {queue.testId.slice(-6)}</span>
            </div>
          </div>

          <div className="flex gap-4">
            {queue.status === 'scheduled' && (
              <button 
                onClick={() => handleOpenWaitingRoom(queue.testId)}
                className="btn-primary py-2 px-6"
              >
                Allow Entry
              </button>
            )}
            {isWaiting && (
              <button 
                onClick={() => handleStartTest(queue.testId)}
                className="btn-primary py-2 px-6 bg-cream-950 animate-pulse"
              >
                Commence Test
              </button>
            )}
            {isActive && (
              <button 
                onClick={() => handleMarkCompleted(queue.testId)}
                className="btn-secondary py-2 px-6 border-red-200 text-red-700 hover:bg-red-50"
              >
                Force Complete
              </button>
            )}
          </div>
        </div>

        {isWaiting && (
          <div className="pt-8 border-t border-cream-50">
            <div className="text-[10px] font-bold text-cream-400 uppercase tracking-widest mb-6 flex justify-between">
              <span>Candidates in Queue</span>
              <span className="text-cream-950">{queue.waitingUsers.length}</span>
            </div>
            {queue.waitingUsers.length === 0 ? (
              <p className="text-sm text-cream-400 italic font-light">The holding area is currently empty.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {queue.waitingUsers.map(u => (
                  <div key={u.id} className="p-4 bg-cream-50/50 border border-cream-100 flex items-center gap-4 rounded-sm">
                    <div className="w-8 h-8 bg-white border border-cream-200 rounded-full flex items-center justify-center text-[10px] font-bold text-cream-950">
                      {u.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold text-cream-900 truncate uppercase tracking-tight">{u.name}</div>
                      <div className="text-[9px] text-cream-400 truncate">{u.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {isActive && (
          <div className="flex gap-16 pt-8 border-t border-cream-50">
            <div>
              <div className="text-[10px] font-bold text-cream-400 uppercase tracking-widest mb-1">Live Sessions</div>
              <div className="text-4xl font-serif text-cream-950">{queue.activeSubmissionCount}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-cream-400 uppercase tracking-widest mb-1">Audit Files</div>
              <div className="text-4xl font-serif text-cream-950">{queue.completedSubmissionCount}</div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-cream-50 text-cream-900 font-sans overflow-hidden">
      {renderSidebar()}
      
      <main className="flex-1 overflow-y-auto p-16">
        <div className="max-w-5xl mx-auto">
          {message && (
            <div className="fixed top-8 right-8 z-50 p-5 bg-white border-l-4 border-cream-900 shadow-premium text-xs font-bold uppercase tracking-widest text-cream-900 animate-slide-in">
              {message}
            </div>
          )}

          {activeSection === 'overview' && (
            <div className="animate-fade-in">
              <header className="mb-16">
                <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-cream-400 mb-2">Operational Overview</div>
                <h2 className="text-4xl font-serif text-cream-950 mb-2">Live Sessions</h2>
                <p className="text-cream-600 font-light italic">Monitor and orchestrate all currently active and pending assessment environments.</p>
              </header>
              <div className="space-y-4">
                {queues.length === 0 ? (
                  <div className="py-32 text-center border border-dashed border-cream-300 rounded-sm text-cream-400 font-light italic">
                    No active or scheduled sessions found in the current buffer.
                  </div>
                ) : (
                  queues.map(q => renderQueueItem(q))
                )}
              </div>
            </div>
          )}

          {activeSection === 'queue' && (
            <div className="animate-fade-in">
              <header className="mb-16">
                <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-cream-400 mb-2">Traffic Analysis</div>
                <h2 className="text-4xl font-serif text-cream-950 mb-2">Waiting Queues</h2>
                <p className="text-cream-600 font-light italic">Detailed monitoring of candidates positioned in the secure holding area.</p>
              </header>
              <div className="space-y-4">
                {queues_waiting.length === 0 ? (
                  <div className="py-32 text-center border border-dashed border-cream-300 rounded-sm text-cream-400 font-light italic">
                    All queues are currently clear.
                  </div>
                ) : (
                  queues_waiting.map(q => renderQueueItem(q))
                )}
              </div>
            </div>
          )}

          {activeSection === 'history' && (
            <div className="animate-fade-in">
              <header className="mb-16 flex justify-between items-end">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-cream-400 mb-2">Archive Retrieval</div>
                  <h2 className="text-4xl font-serif text-cream-950 mb-2">Assessment Repository</h2>
                  <p className="text-cream-600 font-light italic">Access historical session data and consolidated performance metrics.</p>
                </div>
              </header>
              
              <div className="bg-white border border-cream-200 rounded-sm shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-cream-100/50 text-cream-500 uppercase text-[9px] font-black tracking-[0.2em] border-b border-cream-200">
                    <tr>
                      <th className="px-8 py-5">Assessment Title</th>
                      <th className="px-8 py-5">System Status</th>
                      <th className="px-8 py-5">Timestamp</th>
                      <th className="px-8 py-5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cream-50">
                    {tests.map((test) => (
                      <tr key={test._id} className="hover:bg-cream-50/50 transition-colors group">
                        <td className="px-8 py-6 font-serif text-lg text-cream-950 group-hover:text-cream-700">{test.title}</td>
                        <td className="px-8 py-6">
                          <span className="text-[9px] uppercase font-black px-3 py-1 rounded-full border border-cream-200 bg-white text-cream-400">
                            {test.status}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-[11px] font-bold text-cream-400 uppercase tracking-widest">
                          {test.createdAt ? new Date(test.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-8 py-6 text-right">
                          <button 
                            onClick={() => navigate(`/admin/results/${test._id}`)}
                            className="text-[10px] font-black text-cream-900 uppercase tracking-widest hover:underline underline-offset-4"
                          >
                            Access Results &rarr;
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSection === 'create' && (
            <div className="animate-fade-in bg-white border border-cream-200 p-20 rounded-sm text-center shadow-premium max-w-2xl mx-auto mt-20">
              <div className="w-16 h-16 border-2 border-cream-950 flex items-center justify-center text-cream-950 font-serif font-bold text-3xl mx-auto mb-10">
                N
              </div>
              <h2 className="text-4xl font-serif text-cream-950 mb-6">Design New Session</h2>
              <p className="text-cream-600 font-light italic mb-12 leading-relaxed">
                Initialize the architectural builder to define new technical inquiries and session constraints.
              </p>
              <button 
                onClick={() => navigate('/admin/create-test')}
                className="btn-primary"
              >
                Launch Builder
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
