import { Video } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white" style={{ borderBottom: '1px solid #E9E9E9' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: '#E60023' }}>
              <Video className="w-5 h-5 text-white" />
            </div>
            <span style={{ fontWeight: 700, fontSize: '1.25rem', color: '#111111', letterSpacing: '-0.02em' }}>
              Contentmaker
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: '#E9E9E9', color: '#111111' }}>
              BETA
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}
