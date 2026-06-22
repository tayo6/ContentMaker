import { ArrowLeft, ArrowRight, Maximize } from 'lucide-react';
import { AspectRatio, VideoInfo } from '../types';
import { useRef } from 'react';

interface ResizePageProps {
  video: VideoInfo;
  aspectRatio: AspectRatio;
  setAspectRatio: (aspect: AspectRatio) => void;
  onNext: () => void;
  onBack: () => void;
}

const aspectOptions: { value: AspectRatio; label: string; sub: string }[] = [
  { value: '9:16', label: 'Vertical', sub: 'TikTok, Reels' },
  { value: '3:4',  label: 'Portrait', sub: 'Instagram' },
  { value: '1:1',  label: 'Square', sub: 'Feed' },
  { value: '4:3',  label: 'Standard', sub: 'Classic' },
  { value: '16:9', label: 'Landscape', sub: 'YouTube' },
];

const ratioMap: Record<AspectRatio, number> = {
  '9:16': 9 / 16, '3:4': 3 / 4, '1:1': 1, '4:3': 4 / 3, '16:9': 16 / 9,
};

export default function ResizePage({ video, aspectRatio, setAspectRatio, onNext, onBack }: ResizePageProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const bestVideo = video.video_files.find(f => f.quality === 'hd') || video.video_files[0];
  const CONTAINER_H = 540;
  const ratio = ratioMap[aspectRatio];
  const boxW = Math.min(CONTAINER_H * ratio, 760);
  const boxH = boxW / ratio;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-bold pl-0 pr-3 py-2 rounded-full hover:bg-gray-100 transition-colors"
          style={{ color: '#111111' }}
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 mr-1">
            <ArrowLeft className="w-5 h-5" />
          </div>
          Back
        </button>
        <div className="flex items-center gap-2">
          <span style={{ fontWeight: 700, fontSize: '1.25rem', color: '#111111' }}>
            Resize Video
          </span>
        </div>
        <button
          onClick={onNext}
          className="px-5 py-3 text-base font-bold text-white rounded-full transition-colors hover:brightness-95"
          style={{ background: '#E60023', border: 'none', cursor: 'pointer' }}
        >
          Next
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-7">
        {/* Preview */}
        <div
          className="flex-1 flex items-center justify-center rounded-[32px] overflow-hidden"
          style={{ height: `${CONTAINER_H + 40}px`, background: '#E9E9E9' }}
        >
          <div
            className="relative bg-black overflow-hidden transition-all duration-300"
            style={{ width: `${boxW}px`, height: `${boxH}px`, maxWidth: '100%', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}
          >
            <video
              ref={videoRef}
              src={`/api/proxy?url=${encodeURIComponent(bestVideo.link)}`}
              loop muted autoPlay crossOrigin="anonymous" playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Options panel */}
        <div
          className="w-full lg:w-80 self-start rounded-[32px] p-6 lg:p-8"
          style={{ background: '#FFFFFF', border: '1px solid #E9E9E9' }}
        >
          <h3 style={{ fontWeight: 700, fontSize: '1.25rem', color: '#111111', marginBottom: '1.5rem' }}>Aspect Ratio</h3>
          <div className="space-y-3">
            {aspectOptions.map(opt => {
              const isActive = aspectRatio === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setAspectRatio(opt.value)}
                  className="w-full text-left p-4 rounded-2xl flex items-center justify-between transition-all"
                  style={{
                    background: isActive ? '#111111' : '#E9E9E9',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '1rem', color: isActive ? '#FFFFFF' : '#111111' }}>{opt.label}</div>
                    <div style={{ fontSize: '0.8125rem', color: isActive ? '#A0A0A0' : '#767676', marginTop: '2px' }}>{opt.sub}</div>
                  </div>
                  <span
                    className="text-sm font-bold"
                    style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '9999px',
                      background: isActive ? 'rgba(255,255,255,0.2)' : '#FFFFFF',
                      color: isActive ? '#FFFFFF' : '#111111',
                    }}
                  >
                    {opt.value}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
