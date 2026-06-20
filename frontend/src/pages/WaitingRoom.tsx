import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import { createEventSourceUrl } from '../utils/apiService';

const WaitingRoom: React.FC = () => {
  const { id: testId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const [statusMessage, setStatusMessage] = useState('Awaiting administrator signal to commence...');

  useEffect(() => {
    if (!testId) return;

    const name = encodeURIComponent(user?.name || 'Candidate');
    const email = encodeURIComponent(user?.email || '');
    const eventSource = new EventSource(createEventSourceUrl(`/events/test/${testId}?name=${name}&email=${email}`));

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'START') {
        setStatusMessage('Signal received. Initializing environment...');
        setTimeout(() => {
          navigate(`/test/${testId}`);
        }, 1500);
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE connection error:', err);
    };

    return () => {
      eventSource.close();
    };
  }, [testId, navigate, user?.email, user?.name]);

  return (
    <div className="min-h-screen bg-cream-50 flex flex-col items-center justify-center p-6 text-cream-900 font-sans">
      <div className="max-w-xl w-full text-center">
        <div className="mb-12">
          <div className="w-12 h-12 border-2 border-cream-950 flex items-center justify-center text-cream-950 font-serif font-bold text-2xl mx-auto mb-6">
            N
          </div>
          <div className="text-[10px] font-bold uppercase tracking-[0.4em] text-cream-400 mb-2">Secure Holding Area</div>
          <h2 className="text-5xl font-serif text-cream-950 mb-4">The Waiting Room</h2>
          <p className="text-cream-600 italic font-light">
            Protocol initialized for candidate <span className="font-bold text-cream-900">{user?.name}</span>.
          </p>
        </div>

        <div className="bg-white border border-cream-200 p-12 rounded-sm shadow-premium mb-12">
          <div className="flex flex-col items-center gap-8">
            <div className="flex gap-3">
              <span className="w-2 h-2 bg-cream-900 rounded-full animate-pulse"></span>
              <span className="w-2 h-2 bg-cream-400 rounded-full animate-pulse delay-150"></span>
              <span className="w-2 h-2 bg-cream-200 rounded-full animate-pulse delay-300"></span>
            </div>
            
            <p className="text-sm font-bold tracking-widest uppercase text-cream-950">
              {statusMessage}
            </p>
            
            <p className="text-xs text-cream-500 max-w-xs mx-auto leading-relaxed">
              Please maintain focus. The assessment environment will synchronize automatically across all participants.
            </p>
          </div>
        </div>

        <div className="space-y-4 opacity-50 text-[10px] uppercase tracking-widest font-bold text-cream-400">
          <p>Connectivity: Stable</p>
          <p>Encryption: Active</p>
        </div>
      </div>

      <div className="fixed bottom-12 text-[10px] text-cream-300 uppercase tracking-widest font-bold">
        NextGen Technical Assessment Protocol
      </div>
    </div>
  );
};

export default WaitingRoom;
