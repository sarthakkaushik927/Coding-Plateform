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
    <div className="min-h-screen bg-cream-50 text-cream-900 font-sans selection:bg-cream-200 selection:text-cream-950 overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-cream-50/80 backdrop-blur-md border-b border-cream-200/50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 md:h-24 flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4 group cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 md:w-10 md:h-10 border-2 border-cream-950 flex items-center justify-center text-cream-950 font-serif font-bold text-lg md:text-xl transition-transform group-hover:scale-105 shrink-0">
              N
            </div>
            <span className="text-lg md:text-xl font-serif font-bold text-cream-950 tracking-tight">NextGen</span>
          </div>

          <div className="hidden lg:flex items-center gap-12 text-[10px] uppercase font-bold tracking-[0.2em] text-cream-500">
            <a href="#features" className="hover:text-cream-950 transition-colors">Infrastructure</a>
            <a href="#methodology" className="hover:text-cream-950 transition-colors">Methodology</a>
            <Link to="/admin" className="hover:text-cream-950 transition-colors">Administrative</Link>
          </div>

          <div className="flex items-center gap-4 md:gap-8">
            {token ? (
              <div className="flex items-center gap-4 md:gap-8">
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-[9px] uppercase font-bold text-cream-400 tracking-tighter">Authorized</span>
                  <span className="text-sm font-bold text-cream-950">{user?.name.split(' ')[0]}</span>
                </div>
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="btn-primary py-2 px-4 md:py-2.5 md:px-6 text-[10px] md:text-xs"
                >
                  Dashboard
                </button>
                <button onClick={handleLogout} className="hidden sm:block text-[10px] font-bold uppercase tracking-widest text-cream-400 hover:text-cream-950 transition-colors">Logout</button>
              </div>
            ) : (
              <div className="flex items-center gap-4 md:gap-8">
                <Link to="/login" className="hidden sm:block text-[10px] font-bold uppercase tracking-widest text-cream-600 hover:text-cream-950 transition-colors">Log In</Link>
                <button 
                  onClick={() => navigate('/signup')}
                  className="btn-primary py-2 px-4 md:py-2.5 md:px-8 text-[10px] md:text-xs whitespace-nowrap"
                >
                  Join Platform
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 md:pt-48 pb-20 md:pb-32 px-4 md:px-8 overflow-hidden">
        {/* Large Decorative Serif Background Letter */}
        <div className="absolute top-20 right-[-10%] md:right-[5%] text-[20rem] md:text-[40rem] font-serif text-cream-100 select-none pointer-events-none leading-none opacity-50 overflow-hidden">
          N
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row gap-12 md:gap-16 items-start">
            <div className="lg:w-3/5 w-full">
              <div className="inline-block px-0 mb-8 md:mb-12">
                <div className="flex items-center gap-2 md:gap-4 text-[8px] md:text-[10px] uppercase font-bold tracking-[0.2em] md:tracking-[0.4em] text-cream-400">
                  <span className="w-4 md:w-8 h-px bg-cream-300"></span>
                  Established 2026 / Assessment Systems
                </div>
              </div>
              
              <h1 className="text-5xl md:text-7xl lg:text-[7rem] text-cream-950 leading-[1.1] md:leading-[0.9] font-serif tracking-tight mb-8 md:mb-12">
                The Art of <br />
                <span className="italic font-light md:pl-[10%] lg:pl-[15%]">Evaluation.</span>
              </h1>

              <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start md:items-end w-full">
                <p className="text-base md:text-xl text-cream-700 max-w-md font-light leading-relaxed italic border-l border-cream-200 pl-4 md:pl-8">
                  Moving beyond binary metrics. We provide a refined environment for technical evaluations that identify the nuances of exceptional talent.
                </p>
                
                <div className="flex flex-col gap-4 w-full md:w-auto md:min-w-[240px]">
                  <button 
                    onClick={() => navigate('/signup')}
                    className="w-full py-4 md:py-6 bg-cream-950 text-cream-50 rounded-sm text-[10px] uppercase font-bold tracking-[0.3em] hover:bg-black transition-all shadow-premium"
                  >
                    Initiate Session
                  </button>
                  <div className="flex justify-between items-center px-2">
                    <span className="text-[8px] md:text-[9px] uppercase font-bold text-cream-300 tracking-widest">Protocol 4.0</span>
                    <button className="text-[8px] md:text-[9px] uppercase font-bold text-cream-600 hover:text-cream-950 transition-colors tracking-widest">View Methodology &rarr;</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:w-2/5 pt-12 md:pt-32 w-full">
              <div className="bg-white/40 backdrop-blur-sm border border-cream-200 p-6 md:p-10 rounded-sm shadow-premium relative">
                <div className="absolute -top-3 -left-3 md:-top-4 md:-left-4 w-8 h-8 md:w-12 md:h-12 border-t border-l border-cream-950"></div>
                
                <div className="space-y-8 md:space-y-10">
                  <div>
                    <div className="text-[8px] md:text-[9px] uppercase font-black text-cream-900 tracking-[0.2em] md:tracking-[0.3em] mb-3 md:mb-4">01 / Synchronization</div>
                    <p className="text-[10px] md:text-xs text-cream-500 leading-relaxed font-light uppercase tracking-wider">
                      Orchestrated session triggers ensure absolute temporal fairness across all candidate environments.
                    </p>
                  </div>
                  <div>
                    <div className="text-[8px] md:text-[9px] uppercase font-black text-cream-900 tracking-[0.2em] md:tracking-[0.3em] mb-3 md:mb-4">02 / Persistence</div>
                    <p className="text-[10px] md:text-xs text-cream-500 leading-relaxed font-light uppercase tracking-wider">
                      Immutable data mirroring guarantees session resilience against local connectivity interruptions.
                    </p>
                  </div>
                  <div>
                    <div className="text-[8px] md:text-[9px] uppercase font-black text-cream-900 tracking-[0.2em] md:tracking-[0.3em] mb-3 md:mb-4">03 / Analytics</div>
                    <p className="text-[10px] md:text-xs text-cream-500 leading-relaxed font-light uppercase tracking-wider">
                      Multi-dimensional vectors transform raw responses into objective performance narratives.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Abstract Element */}
        <div className="hidden md:flex absolute bottom-10 left-[10%] items-center gap-6">
          <div className="w-16 h-16 border border-cream-200 flex items-center justify-center rounded-full">
            <div className="w-1.5 h-1.5 bg-cream-950 rounded-full animate-ping"></div>
          </div>
          <div className="text-[9px] uppercase font-bold tracking-[0.5em] text-cream-300 vertical-text py-4 border-l border-cream-200 pl-4">
            Encrypted Session Active
          </div>
        </div>
      </section>

      {/* Stats/Social Proof */}
      <section className="py-12 md:py-20 border-y border-cream-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center">
          {[
            { label: 'Uptime', val: '99.9%' },
            { label: 'Latency', val: '< 50ms' },
            { label: 'Security', val: 'L3 Audit' },
            { label: 'Analytics', val: 'Real-time' },
          ].map((stat, i) => (
            <div key={i} className="flex flex-col gap-1 md:gap-2">
              <div className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-cream-400">{stat.label}</div>
              <div className="text-xl md:text-2xl font-serif text-cream-950">{stat.val}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 md:py-32 bg-cream-100/50">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 md:mb-24 gap-6 md:gap-8">
            <div className="max-w-2xl">
              <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-cream-400 mb-3 md:mb-4">Core Infrastructure</div>
              <h2 className="text-3xl md:text-5xl font-serif text-cream-950">Architectural Integrity</h2>
            </div>
            <p className="text-sm md:text-base text-cream-600 font-light italic max-w-sm border-l border-cream-300 pl-4 md:pl-8">
              We provide the underlying stability required for high-stakes technical evaluations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
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
              <div key={i} className="p-8 md:p-12 bg-white border border-cream-200 rounded-sm shadow-sm hover:shadow-premium transition-all group">
                <div className="w-10 h-10 md:w-12 md:h-12 border border-cream-100 flex items-center justify-center text-cream-200 font-serif text-xl md:text-2xl mb-6 md:mb-8 group-hover:border-cream-950 group-hover:text-cream-950 transition-colors">
                  {f.icon}
                </div>
                <h3 className="text-xl md:text-2xl font-serif text-cream-950 mb-4 md:mb-6">{f.title}</h3>
                <p className="text-xs md:text-sm text-cream-600 leading-relaxed font-light italic">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-12 md:py-24 border-t border-cream-200">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-8 md:gap-12 mb-12 md:mb-20">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-8 h-8 md:w-10 md:h-10 border-2 border-cream-950 flex items-center justify-center text-cream-950 font-serif font-bold text-lg md:text-xl">
                N
              </div>
              <span className="text-lg md:text-xl font-serif font-bold text-cream-950 tracking-tight">NextGen</span>
            </div>
            
            <div className="flex flex-wrap justify-center gap-6 md:gap-12 text-[9px] md:text-[10px] uppercase font-bold tracking-widest text-cream-400">
              <a href="#" className="hover:text-cream-950 transition-colors">Documentation</a>
              <a href="#" className="hover:text-cream-950 transition-colors">Privacy</a>
              <a href="#" className="hover:text-cream-950 transition-colors">Legal</a>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center text-center gap-4 md:gap-6 pt-8 md:pt-12 border-t border-cream-50 text-[8px] md:text-[10px] text-cream-300 uppercase tracking-[0.2em] md:tracking-[0.4em] font-bold">
            <span>NextGen Assessment Systems &copy; 2026</span>
            <span className="italic">Secure Technical Evaluation Protocol 4.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
