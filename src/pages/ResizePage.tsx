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

export default function ResizePage({ video, aspectRatio, setAspectRatio, onNext, onBack }: ResizePageProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const bestVideo = video.video_files.find(f => f.quality === 'hd') || video.video_files[0];

  const aspectOptions: { value: AspectRatio; label: string }[] = [
    { value: '9:16', label: 'Vertical (TikTok, Reels)' },
    { value: '3:4',  label: 'Portrait (Instagram)' },
    { value: '1:1',  label: 'Square (Feed)' },
    { value: '4:3',  label: 'Standard' },
    { value: '16:9', label: 'Landscape (YouTube)' },
  ];

  // Map each ratio to its numeric value so we can size the box purely with inline styles
  const ratioMap: Record<AspectRatio, number> = {
    '9:16': 9 / 16,
    '3:4':  3 / 4,
    '1:1':  1,
    '4:3':  4 / 3,
    '16:9': 16 / 9,
  };

  // Container is 560px tall. We derive width from the ratio (capped at container width).
  const CONTAINER_H = 560;
  const ratio = ratioMap[aspectRatio];
  const boxW = Math.min(CONTAINER_H * ratio, 800); // cap width so wide ratios don't overflow
  const boxH = boxW / ratio;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <button onClick={onBack} className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </button>
        <h1 className="text-xl font-bold text-gray-900">2. Resize Video</h1>
        <button onClick={onNext} className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700">
          Next <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Preview — fixed height container, box sized by inline style */}
        <div
          className="flex-1 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center overflow-hidden"
          style={{ height: `${CONTAINER_H + 40}px` }}
        >
          <div
            className="relative bg-black rounded overflow-hidden shadow-lg transition-all duration-300"
            style={{ width: `${boxW}px`, height: `${boxH}px`, maxWidth: '100%' }}
          >
            <video
              ref={videoRef}
              src={`/api/proxy?url=${encodeURIComponent(bestVideo.link)}`}
              loop
              muted
              autoPlay
              crossOrigin="anonymous"
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Options */}
        <div className="w-full lg:w-80 bg-white border border-gray-200 rounded-lg p-6 space-y-4 self-start">
          <div className="flex items-center text-gray-900 font-semibold mb-4 border-b border-gray-100 pb-2">
            <Maximize className="w-5 h-5 mr-2 text-blue-600" />
            Select Aspect Ratio
          </div>
          {aspectOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setAspectRatio(opt.value)}
              className={`w-full text-left p-4 rounded-md border flex items-center justify-between transition-colors ${
                aspectRatio === opt.value
                  ? 'bg-blue-50 border-blue-600 text-blue-700 font-semibold shadow-sm'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-blue-400 hover:bg-gray-50'
              }`}
            >
              <span>{opt.label}</span>
              <span className="text-xs px-2 py-1 bg-white border border-gray-200 rounded text-gray-500 font-mono tracking-tighter shadow-sm">
                {opt.value}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
