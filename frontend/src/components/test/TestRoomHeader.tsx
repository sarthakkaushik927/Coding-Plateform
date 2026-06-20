import React from 'react';
import BrandMark from '../common/BrandMark';
import TimerDisplay from '../TimerDisplay';

interface TestRoomHeaderProps {
  candidateName?: string;
}

const TestRoomHeader: React.FC<TestRoomHeaderProps> = ({ candidateName }) => {
  return (
    <nav className="bg-white border-b border-cream-200">
      <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <BrandMark size="sm" />
          <span className="text-lg font-serif font-bold text-cream-950 tracking-wide">NextGen</span>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[9px] uppercase font-bold text-cream-400 tracking-tighter">Candidate</span>
            <span className="text-sm font-bold text-cream-900">{candidateName}</span>
          </div>
          <div className="w-px h-8 bg-cream-100 hidden sm:block"></div>
          <TimerDisplay />
        </div>
      </div>
    </nav>
  );
};

export default TestRoomHeader;
