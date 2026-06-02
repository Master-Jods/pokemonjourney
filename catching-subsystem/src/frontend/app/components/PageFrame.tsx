import type { ReactNode } from 'react';

type PageFrameProps = {
  children: ReactNode;
};

export function PageFrame({ children }: PageFrameProps) {
  return (
    <div className="min-h-screen w-full p-3 sm:p-6 bg-gradient-to-br from-blue-400 via-yellow-300 to-orange-400">
      <div className="max-w-5xl mx-auto space-y-4">
        {children}
      </div>
    </div>
  );
}

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-3xl shadow-xl border-4 border-white relative ${className}`}>
      <span className="absolute top-3 left-3 w-2 h-2 rounded-full bg-red-400" />
      <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-blue-500" />
      {children}
    </div>
  );
}

export function PokeballCorner({ side }: { side: 'left' | 'right' }) {
  return (
    <div className={`absolute top-3 ${side === 'left' ? 'left-3' : 'right-3'} w-9 h-9 rounded-full bg-white border-2 border-gray-300 shadow flex items-center justify-center`}>
      <div className="w-6 h-6 rounded-full border-2 border-gray-700 bg-gradient-to-b from-red-500 to-white" />
    </div>
  );
}
