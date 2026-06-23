import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
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
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as AdminSection) || 'overview';
  
  const [tests, setTests] = useState<TestSummary[]>([]);
  const [queues, setQueues] = useState<QueueSummary[]>([]);
  const [activeSection, setActiveSection] = useState<AdminSection>(initialTab);
  const [message, setMessage] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleTabChange = (tab: AdminSection) => {
    setActiveSection(tab);
    setSearchParams({ tab });
    setIsMobileMenuOpen(false);
  };

  const queuesRef = React.useRef<QueueSummary[]>([]);
  useEffect(() => {
    queuesRef.current = queues;
  }, [queues]);

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
    let interval: ReturnType<typeof setInterval>;

    if (activeSection === 'overview' || activeSection === 'queue') {
      interval = setInterval(() => {
        if (activeSection === 'overview' && queuesRef.current.length === 0) {
          return;
        }
        
        fetchQueues();
        fetchTests();
      }, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeSection]);

  const handleOpenWaitingRoom = async (id: string) => {
    try {
      await testService.openWaitingRoom(id);
      setMessage('Waiting room is now open for candidates.');
      fetchTests();
      fetchQueues();
      setTimeout(() => setMessage(''), 3000);
    } catch {
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
    } catch {
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
    } catch {
      setMessage('Failed to complete test.');
    }
  };

  const queues_waiting = useMemo(() => queues.filter(q => q.status === 'waiting'), [queues]);

  const sidebarContent = (
    <>
      <div className="p-6 lg:p-10 lg:pb-6">
        <div className="flex items-center justify-between lg:justify-start gap-3 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border border-cream-950 flex items-center justify-center text-cream-950 font-serif font-bold text-lg">
              N
            </div>
            <span className="text-lg font-serif font-bold text-cream-950 tracking-wide">NextGen</span>
          </div>
          <button 
            className="lg:hidden p-2 text-cream-600 hover:text-cream-950"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-cream-400 mb-1">Administrative</div>
        <h1 className="text-xl lg:text-2xl font-serif text-cream-950">Dashboard</h1>
      </div>
      
      <nav className="flex-1 px-4 lg:px-6 py-6 lg:py-8 space-y-2">
        {[
          { id: 'overview', label: 'Active Sessions' },
          { id: 'queue', label: 'Waiting Queues' },
          { id: 'history', label: 'Test Repository' },
          { id: 'create', label: 'Draft Assessment' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => handleTabChange(item.id as AdminSection)}
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

      <div className="p-6 lg:p-8 border-t border-cream-50">
        <Link 
          to="/"
          className="w-full block text-center py-2 text-[10px] text-cream-400 hover:text-cream-950 transition-colors uppercase tracking-[0.2em] font-bold"
        >
          Exit Terminal
        </Link>
      </div>
    </>
  );

  const renderQueueItem = (queue: QueueSummary) => {
    const isWaiting = queue.status === 'waiting';
    const isActive = queue.status === 'active';

    return (
      <div key={queue.testId} className="bg-white border border-cream-200 p-6 lg:p-10 rounded-sm shadow-sm mb-6 lg:mb-8 transition-all hover:shadow-premium group">
        <div className="flex flex-col lg:flex-row justify-between items-start mb-8 lg:mb-10 gap-4">
          <div>
            <h3 className="text-xl lg:text-2xl font-serif text-cream-950 mb-2 group-hover:text-cream-700 transition-colors">{queue.title}</h3>
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`text-[9px] uppercase font-black tracking-widest px-3 py-1 rounded-full border ${
                isActive ? 'bg-green-50 border-green-100 text-green-700' : 'bg-cream-50 border-cream-200 text-cream-600'
              }`}>
                {queue.status}
              </span>
              <span className="text-[10px] text-cream-300 font-bold uppercase tracking-widest">ID: {queue.testId.slice(-6)}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 w-full lg:w-auto">
            {queue.status === 'scheduled' && (
              <button 
                onClick={() => handleOpenWaitingRoom(queue.testId)}
                className="btn-primary py-2 px-6 flex-1 lg:flex-none text-center justify-center"
              >
                Allow Entry
              </button>
            )}
            {isWaiting && (
              <button 
                onClick={() => handleStartTest(queue.testId)}
                className="btn-primary py-2 px-6 bg-cream-950 animate-pulse flex-1 lg:flex-none text-center justify-center"
              >
                Commence Test
              </button>
            )}
            {isActive && (
              <button 
                onClick={() => handleMarkCompleted(queue.testId)}
                className="btn-secondary py-2 px-6 border-red-200 text-red-700 hover:bg-red-50 flex-1 lg:flex-none text-center justify-center"
              >
                Force Complete
              </button>
            )}
          </div>
        </div>

        {isWaiting && (
          <div className="pt-6 lg:pt-8 border-t border-cream-50">
            <div className="text-[10px] font-bold text-cream-400 uppercase tracking-widest mb-4 lg:mb-6 flex justify-between">
              <span>Candidates in Queue</span>
              <span className="text-cream-950">{queue.waitingUsers.length}</span>
            </div>
            {queue.waitingUsers.length === 0 ? (
              <p className="text-sm text-cream-400 italic font-light">The holding area is currently empty.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 lg:gap-4">
                {queue.waitingUsers.map(u => (
                  <div key={u.id} className="p-3 lg:p-4 bg-cream-50/50 border border-cream-100 flex items-center gap-3 lg:gap-4 rounded-sm">
                    <div className="w-8 h-8 shrink-0 bg-white border border-cream-200 rounded-full flex items-center justify-center text-[10px] font-bold text-cream-950">
                      {u.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
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
          <div className="flex gap-8 lg:gap-16 pt-6 lg:pt-8 border-t border-cream-50">
            <div>
              <div className="text-[10px] font-bold text-cream-400 uppercase tracking-widest mb-1">Live Sessions</div>
              <div className="text-3xl lg:text-4xl font-serif text-cream-950">{queue.activeSubmissionCount}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-cream-400 uppercase tracking-widest mb-1">Audit Files</div>
              <div className="text-3xl lg:text-4xl font-serif text-cream-950">{queue.completedSubmissionCount}</div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-cream-50 text-cream-900 font-sans overflow-hidden flex-col lg:flex-row">
      {/* Mobile Header Bar */}
      <div className="lg:hidden bg-white border-b border-cream-200 px-6 py-4 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border border-cream-950 flex items-center justify-center text-cream-950 font-serif font-bold text-lg">
            N
          </div>
          <span className="text-lg font-serif font-bold text-cream-950 tracking-wide">NextGen</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 -mr-2 text-cream-600 hover:text-cream-950"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 border-r border-cream-200 flex-col h-full bg-white shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Sidebar */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="absolute inset-0 bg-cream-950/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <aside className="relative w-72 max-w-[80vw] h-full bg-white flex flex-col animate-slide-in shadow-premium">
            {sidebarContent}
          </aside>
        </div>
      )}
      
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-16 w-full">
        <div className="max-w-5xl mx-auto pb-20">
          {message && (
            <div className="fixed top-20 lg:top-8 right-4 lg:right-8 z-50 p-4 lg:p-5 bg-white border-l-4 border-cream-900 shadow-premium text-xs font-bold uppercase tracking-widest text-cream-900 animate-slide-in max-w-[calc(100vw-2rem)]">
              {message}
            </div>
          )}

          {activeSection === 'overview' && (
            <div className="animate-fade-in">
              <header className="mb-8 lg:mb-16">
                <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-cream-400 mb-2">Operational Overview</div>
                <h2 className="text-3xl lg:text-4xl font-serif text-cream-950 mb-2">Live Sessions</h2>
                <p className="text-sm lg:text-base text-cream-600 font-light italic">Monitor and orchestrate all currently active and pending assessment environments.</p>
              </header>
              <div className="space-y-4">
                {queues.length === 0 ? (
                  <div className="py-20 lg:py-32 text-center border border-dashed border-cream-300 rounded-sm text-cream-400 font-light italic px-4">
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
              <header className="mb-8 lg:mb-16">
                <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-cream-400 mb-2">Traffic Analysis</div>
                <h2 className="text-3xl lg:text-4xl font-serif text-cream-950 mb-2">Waiting Queues</h2>
                <p className="text-sm lg:text-base text-cream-600 font-light italic">Detailed monitoring of candidates positioned in the secure holding area.</p>
              </header>
              <div className="space-y-4">
                {queues_waiting.length === 0 ? (
                  <div className="py-20 lg:py-32 text-center border border-dashed border-cream-300 rounded-sm text-cream-400 font-light italic px-4">
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
              <header className="mb-8 lg:mb-16 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-cream-400 mb-2">Archive Retrieval</div>
                  <h2 className="text-3xl lg:text-4xl font-serif text-cream-950 mb-2">Assessment Repository</h2>
                  <p className="text-sm lg:text-base text-cream-600 font-light italic">Access historical session data and consolidated performance metrics.</p>
                </div>
              </header>
              
              <div className="bg-white border border-cream-200 rounded-sm shadow-sm overflow-hidden">
                <div className="hidden md:block overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left text-sm min-w-[600px]">
                    <thead className="bg-cream-100/50 text-cream-500 uppercase text-[9px] font-black tracking-[0.2em] border-b border-cream-200">
                      <tr>
                        <th className="px-4 lg:px-8 py-4 lg:py-5">Assessment Title</th>
                        <th className="px-4 lg:px-8 py-4 lg:py-5">System Status</th>
                        <th className="px-4 lg:px-8 py-4 lg:py-5">Timestamp</th>
                        <th className="px-4 lg:px-8 py-4 lg:py-5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cream-50">
                      {tests.map((test) => (
                        <tr key={test._id} className="hover:bg-cream-50/50 transition-colors group">
                          <td className="px-4 lg:px-8 py-4 lg:py-6 font-serif text-base lg:text-lg text-cream-950 group-hover:text-cream-700">{test.title}</td>
                          <td className="px-4 lg:px-8 py-4 lg:py-6">
                            <span className="text-[9px] uppercase font-black px-3 py-1 rounded-full border border-cream-200 bg-white text-cream-400">
                              {test.status}
                            </span>
                          </td>
                          <td className="px-4 lg:px-8 py-4 lg:py-6 text-[10px] lg:text-[11px] font-bold text-cream-400 uppercase tracking-widest whitespace-nowrap">
                            {test.createdAt ? new Date(test.createdAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-4 lg:px-8 py-4 lg:py-6 text-right">
                            <button 
                              onClick={() => navigate(`/admin/results/${test._id}`)}
                              className="text-[9px] lg:text-[10px] font-black text-cream-900 uppercase tracking-widest hover:underline underline-offset-4 whitespace-nowrap"
                            >
                              Access Results &rarr;
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card Layout */}
                <div className="md:hidden divide-y divide-cream-100">
                  {tests.map((test) => (
                    <div key={test._id} className="p-5 flex flex-col gap-4">
                      <div className="flex justify-between items-start gap-3">
                        <h3 className="font-serif text-base text-cream-950">{test.title}</h3>
                        <span className="text-[8px] uppercase font-black px-2 py-1 rounded-full border border-cream-200 bg-white text-cream-400 shrink-0">
                          {test.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[9px] font-bold text-cream-400 uppercase tracking-widest">
                          {test.createdAt ? new Date(test.createdAt).toLocaleDateString() : 'N/A'}
                        </span>
                        <button 
                          onClick={() => navigate(`/admin/results/${test._id}`)}
                          className="text-[9px] font-black text-cream-900 uppercase tracking-widest flex items-center gap-1"
                        >
                          Results &rarr;
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'create' && (
            <div className="animate-fade-in bg-white border border-cream-200 p-8 lg:p-20 rounded-sm text-center shadow-premium max-w-2xl mx-auto mt-10 lg:mt-20">
              <div className="w-12 h-12 lg:w-16 lg:h-16 border-2 border-cream-950 flex items-center justify-center text-cream-950 font-serif font-bold text-2xl lg:text-3xl mx-auto mb-8 lg:mb-10">
                N
              </div>
              <h2 className="text-3xl lg:text-4xl font-serif text-cream-950 mb-4 lg:mb-6">Design New Session</h2>
              <p className="text-sm lg:text-base text-cream-600 font-light italic mb-8 lg:mb-12 leading-relaxed">
                Initialize the architectural builder to define new technical inquiries and session constraints.
              </p>
              <button 
                onClick={() => navigate('/admin/create-test')}
                className="btn-primary w-full sm:w-auto"
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
