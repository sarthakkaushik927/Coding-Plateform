import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';
import type { RootState } from '../store';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { token, user } = useSelector((state: RootState) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <div className="min-h-screen bg-cream-50 text-cream-900 font-sans selection:bg-cream-200 selection:text-cream-950">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-cream-50/80 backdrop-blur-md border-b border-cream-200/50">
        <div className="max-w-7xl mx-auto px-8 h-24 flex items-center justify-between">
          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 border-2 border-cream-950 flex items-center justify-center text-cream-950 font-serif font-bold text-xl transition-transform group-hover:scale-105">
              N
            </div>
            <span className="text-xl font-serif font-bold text-cream-950 tracking-tight">NextGen</span>
          </div>

          <div className="hidden lg:flex items-center gap-12 text-[10px] uppercase font-bold tracking-[0.2em] text-cream-500">
            <a href="#features" className="hover:text-cream-950 transition-colors">Infrastructure</a>
            <a href="#methodology" className="hover:text-cream-950 transition-colors">Methodology</a>
            <Link to="/admin" className="hover:text-cream-950 transition-colors">Administrative</Link>
          </div>

          <div className="flex items-center gap-8">
            {token ? (
              <div className="flex items-center gap-8">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-[9px] uppercase font-bold text-cream-400 tracking-tighter">Authorized</span>
                  <span className="text-sm font-bold text-cream-950">{user?.name.split(' ')[0]}</span>
                </div>
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="btn-primary py-2.5 px-6"
                >
                  Dashboard
                </button>
                <button onClick={handleLogout} className="text-[10px] font-bold uppercase tracking-widest text-cream-400 hover:text-cream-950 transition-colors">Logout</button>
              </div>
            ) : (
              <div className="flex items-center gap-8">
                <Link to="/login" className="text-[10px] font-bold uppercase tracking-widest text-cream-600 hover:text-cream-950 transition-colors">Log In</Link>
                <button 
                  onClick={() => navigate('/signup')}
                  className="btn-primary py-2.5 px-8"
                >
                  Join Platform
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section - Sophisticated Asymmetrical Layout */}
      <section className="relative pt-48 pb-32 px-8 overflow-hidden">
        {/* Large Decorative Serif Background Letter */}
        <div className="absolute top-20 right-[5%] text-[40rem] font-serif text-cream-100 select-none pointer-events-none leading-none opacity-50">
          N
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row gap-16 items-start">
            <div className="lg:w-3/5">
              <div className="inline-block px-0 mb-12">
                <div className="flex items-center gap-4 text-[10px] uppercase font-bold tracking-[0.4em] text-cream-400">
                  <span className="w-8 h-px bg-cream-300"></span>
                  Established 2026 / Assessment Systems
                </div>
              </div>
              
              <h1 className="text-7xl md:text-[7rem] text-cream-950 leading-[0.9] font-serif tracking-tight mb-12">
                The Art of <br />
                <span className="italic font-light pl-[10%] md:pl-[15%]">Evaluation.</span>
              </h1>

              <div className="flex flex-col md:flex-row gap-12 items-end">
                <p className="text-xl text-cream-700 max-w-md font-light leading-relaxed italic border-l border-cream-200 pl-8">
                  Moving beyond binary metrics. We provide a refined environment for technical evaluations that identify the nuances of exceptional talent.
                </p>
                
                <div className="flex flex-col gap-4 min-w-[240px]">
                  <button 
                    onClick={() => navigate('/signup')}
                    className="w-full py-6 bg-cream-950 text-cream-50 rounded-sm text-[10px] uppercase font-bold tracking-[0.3em] hover:bg-black transition-all shadow-premium"
                  >
                    Initiate Session
                  </button>
                  <div className="flex justify-between items-center px-2">
                    <span className="text-[9px] uppercase font-bold text-cream-300 tracking-widest">Protocol 4.0</span>
                    <button className="text-[9px] uppercase font-bold text-cream-600 hover:text-cream-950 transition-colors tracking-widest">View Methodology &rarr;</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:w-2/5 lg:pt-32">
              <div className="bg-white/40 backdrop-blur-sm border border-cream-200 p-10 rounded-sm shadow-premium relative">
                <div className="absolute -top-4 -left-4 w-12 h-12 border-t border-l border-cream-950"></div>
                
                <div className="space-y-10">
                  <div>
                    <div className="text-[9px] uppercase font-black text-cream-900 tracking-[0.3em] mb-4">01 / Synchronization</div>
                    <p className="text-xs text-cream-500 leading-relaxed font-light uppercase tracking-wider">
                      Orchestrated session triggers ensure absolute temporal fairness across all candidate environments.
                    </p>
                  </div>
                  <div>
                    <div className="text-[9px] uppercase font-black text-cream-900 tracking-[0.3em] mb-4">02 / Persistence</div>
                    <p className="text-xs text-cream-500 leading-relaxed font-light uppercase tracking-wider">
                      Immutable data mirroring guarantees session resilience against local connectivity interruptions.
                    </p>
                  </div>
                  <div>
                    <div className="text-[9px] uppercase font-black text-cream-900 tracking-[0.3em] mb-4">03 / Analytics</div>
                    <p className="text-xs text-cream-500 leading-relaxed font-light uppercase tracking-wider">
                      Multi-dimensional vectors transform raw responses into objective performance narratives.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Abstract Element */}
        <div className="absolute bottom-10 left-[10%] flex items-center gap-6">
          <div className="w-16 h-16 border border-cream-200 flex items-center justify-center rounded-full">
            <div className="w-1.5 h-1.5 bg-cream-950 rounded-full animate-ping"></div>
          </div>
          <div className="text-[9px] uppercase font-bold tracking-[0.5em] text-cream-300 vertical-text py-4 border-l border-cream-200 pl-4">
            Encrypted Session Active
          </div>
        </div>
      </section>

      {/* Stats/Social Proof */}
      <section className="py-20 border-y border-cream-200 bg-white">
        <div className="max-w-7xl mx-auto px-8 grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
          {[
            { label: 'Uptime', val: '99.9%' },
            { label: 'Latency', val: '< 50ms' },
            { label: 'Security', val: 'L3 Audit' },
            { label: 'Analytics', val: 'Real-time' },
          ].map((stat, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="text-[10px] font-bold uppercase tracking-widest text-cream-400">{stat.label}</div>
              <div className="text-2xl font-serif text-cream-950">{stat.val}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 bg-cream-100/50">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-8">
            <div className="max-w-2xl">
              <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-cream-400 mb-4">Core Infrastructure</div>
              <h2 className="text-5xl font-serif text-cream-950">Architectural Integrity</h2>
            </div>
            <p className="text-cream-600 font-light italic max-w-sm border-l border-cream-300 pl-8">
              We provide the underlying stability required for high-stakes technical evaluations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                title: 'Synchronized Start',
                desc: 'Absolute fairness through precise orchestration. All candidates commence their assessments at the exact designated microsecond.',
                icon: 'S'
              },
              {
                title: 'Immutable Persistence',
                desc: 'Zero data loss architecture. Every keystroke and response is mirrored across redundant nodes for total session resilience.',
                icon: 'I'
              },
              {
                title: 'Objective Logic',
                desc: 'Beyond simple grading. Receive structured, multi-dimensional performance vectors to identify truly exceptional talent.',
                icon: 'O'
              }
            ].map((f, i) => (
              <div key={i} className="p-12 bg-white border border-cream-200 rounded-sm shadow-sm hover:shadow-premium transition-all group">
                <div className="w-12 h-12 border border-cream-100 flex items-center justify-center text-cream-200 font-serif text-2xl mb-8 group-hover:border-cream-950 group-hover:text-cream-950 transition-colors">
                  {f.icon}
                </div>
                <h3 className="text-2xl font-serif text-cream-950 mb-6">{f.title}</h3>
                <p className="text-sm text-cream-600 leading-relaxed font-light italic">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-24 border-t border-cream-200">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-12 mb-20">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 border-2 border-cream-950 flex items-center justify-center text-cream-950 font-serif font-bold text-xl">
                N
              </div>
              <span className="text-xl font-serif font-bold text-cream-950 tracking-tight">NextGen</span>
            </div>
            
            <div className="flex gap-12 text-[10px] uppercase font-bold tracking-widest text-cream-400">
              <a href="#" className="hover:text-cream-950 transition-colors">Documentation</a>
              <a href="#" className="hover:text-cream-950 transition-colors">Privacy</a>
              <a href="#" className="hover:text-cream-950 transition-colors">Legal</a>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-12 border-t border-cream-50 text-[10px] text-cream-300 uppercase tracking-[0.4em] font-bold">
            <span>NextGen Assessment Systems &copy; 2026</span>
            <span className="italic">Secure Technical Evaluation Protocol 4.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
