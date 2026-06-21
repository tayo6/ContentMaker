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

  const aspectOptions: { value: AspectRatio; label: string; ratio: string }[] = [
    { value: '9:16', label: 'Vertical (TikTok, Reels)', ratio: '9/16' },
    { value: '3:4', label: 'Portrait (Instagram)', ratio: '3/4' },
    { value: '1:1', label: 'Square (Feed)', ratio: '1/1' },
    { value: '4:3', label: 'Standard', ratio: '4/3' },
    { value: '16:9', label: 'Landscape (YouTube)', ratio: '16/9' },
  ];

  const aspectClasses = {
    '9:16': 'h-[60vh] aspect-[9/16]',
    '3:4': 'h-[60vh] aspect-[3/4]',
    '1:1': 'h-[60vh] aspect-square',
    '4:3': 'w-full aspect-[4/3] max-h-[60vh]',
    '16:9': 'w-full aspect-[16/9] max-h-[60vh]',
  };

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
        {/* Preview Frame */}
        <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-center relative overflow-hidden h-[600px]">
             <div className={`relative bg-black rounded overflow-hidden shadow-lg mx-auto flex items-center justify-center transition-all duration-300 ${aspectClasses[aspectRatio]}`}>
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
              className={`w-full text-left p-4 rounded-md border flex items-center justify-between transition-colors ${aspectRatio === opt.value ? 'bg-blue-50 border-blue-600 text-blue-700 font-semibold shadow-sm' : 'bg-white border-gray-200 text-gray-700 hover:border-blue-400 hover:bg-gray-50'}`}
            >
              <span>{opt.label}</span>
              <span className="text-xs px-2 py-1 bg-white border border-gray-200 rounded text-gray-500 font-mono tracking-tighter shadow-sm">{opt.value}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
