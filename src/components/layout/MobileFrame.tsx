import React, { useState } from 'react';
import { Smartphone, Monitor } from 'lucide-react';

interface MobileFrameProps {
  children: React.ReactNode;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({ children }) => {
  const [isPhoneView, setIsPhoneView] = useState(true);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-0 md:p-4 selection:bg-indigo-500 selection:text-white">
      {/* Desktop view mode switcher */}
      <div className="hidden md:flex items-center gap-3 mb-3 bg-slate-800/80 backdrop-blur border border-slate-700 px-4 py-2 rounded-full text-xs text-slate-300 shadow-lg">
        <span className="font-semibold text-indigo-400">FamLife Mobile:</span>
        <button
          onClick={() => setIsPhoneView(true)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-colors ${
            isPhoneView ? 'bg-indigo-600 text-white font-medium shadow' : 'hover:text-white'
          }`}
        >
          <Smartphone size={14} />
          Khung Điện thoại
        </button>
        <button
          onClick={() => setIsPhoneView(false)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-colors ${
            !isPhoneView ? 'bg-indigo-600 text-white font-medium shadow' : 'hover:text-white'
          }`}
        >
          <Monitor size={14} />
          Toàn màn hình
        </button>
      </div>

      {/* Frame Container */}
      <div
        className={`w-full transition-all duration-300 bg-white dark:bg-slate-900 shadow-2xl relative flex flex-col overflow-hidden ${
          isPhoneView
            ? 'max-w-[440px] h-[100dvh] md:h-[880px] md:rounded-[48px] md:border-[10px] md:border-slate-800 md:ring-1 md:ring-slate-700'
            : 'max-w-4xl h-[100dvh] md:h-[90vh] md:rounded-2xl md:border md:border-slate-800'
        }`}
      >
        {/* Phone Dynamic Island / Speaker cutout (only shown in phone view) */}
        {isPhoneView && (
          <div className="hidden md:flex absolute top-0 left-1/2 -translate-x-1/2 z-50 h-5 w-36 bg-slate-800 rounded-b-2xl items-center justify-center">
            <div className="w-12 h-1 bg-slate-700 rounded-full" />
            <div className="w-2.5 h-2.5 bg-slate-900 border border-slate-700 rounded-full ml-3" />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
};
