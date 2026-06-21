import { ArrowLeft, ArrowRight } from 'lucide-react';
import { AspectRatio, TextOverlay, VideoInfo } from '../types';
import { useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';

interface TextPageProps {
  video: VideoInfo;
  aspectRatio: AspectRatio;
  textOverlay: TextOverlay;
  setTextOverlay: Dispatch<SetStateAction<TextOverlay>>;
  onNext: () => void;
  onBack: () => void;
}

export default function TextPage({ video, aspectRatio, textOverlay, setTextOverlay, onNext, onBack }: TextPageProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const bestVideo = video.video_files.find(f => f.quality === 'hd') || video.video_files[0];

  const ratioMap: Record<AspectRatio, number> = {
    '9:16': 9 / 16,
    '3:4':  3 / 4,
    '1:1':  1,
    '4:3':  4 / 3,
    '16:9': 16 / 9,
  };

  const CONTAINER_H = 560;
  const ratio = ratioMap[aspectRatio];
  const boxW = Math.min(CONTAINER_H * ratio, 800);
  const boxH = boxW / ratio;

  // Scale font size to preview dimensions (canvas uses 800px as reference height)
  const previewFontSize = Math.floor(textOverlay.size * (boxH / 800));

  const getPositionStyle = (): React.CSSProperties => {
    switch (textOverlay.position) {
      case 'top':    return { top: '12%',  transform: 'translateY(0)' };
      case 'bottom': return { top: '80%',  transform: 'translateY(-50%)' };
      case 'middle':
      default:       return { top: '50%',  transform: 'translateY(-50%)' };
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <button onClick={onBack} className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </button>
        <h1 className="text-xl font-bold text-gray-900">3. Add Text</h1>
        <button onClick={onNext} className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700">
          Next <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">

        {/* Preview */}
        <div
          className="flex-1 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center overflow-hidden"
          style={{ height: `${CONTAINER_H + 40}px` }}
        >
          <div
            className="relative bg-black rounded-lg shadow-xl"
            style={{ width: `${boxW}px`, height: `${boxH}px`, maxWidth: '100%', overflow: 'hidden', flexShrink: 0 }}
          >
            <video
              ref={videoRef}
              src={`/api/proxy?url=${encodeURIComponent(bestVideo.link)}`}
              loop
              muted
              autoPlay
              crossOrigin="anonymous"
              playsInline
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            />

            {textOverlay.text && (
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  textAlign: 'center',
                  // ── FIX: horizontal padding creates wrap margins ──
                  padding: '0 12px',
                  pointerEvents: 'none',
                  zIndex: 10,
                  ...getPositionStyle(),
                }}
              >
                {textOverlay.text.split('\n').map((line, i) => (
                  <div
                    key={i}
                    style={{
                      color: textOverlay.color,
                      fontSize: `${previewFontSize}px`,
                      fontWeight: 'bold',
                      lineHeight: 1.25,
                      textShadow: '0px 2px 10px rgba(0,0,0,0.9), 0px 0px 4px rgba(0,0,0,1)',
                      // ── FIX: wrap long lines instead of overflowing ──
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                    }}
                  >
                    {line || '\u00A0'}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tools */}
        <div className="w-full lg:w-96 bg-white border border-gray-200 rounded-lg p-6 space-y-6 self-start">
          <div>
            <label className="text-sm font-semibold text-gray-900 block mb-2">Text Content</label>
            <textarea
              value={textOverlay.text}
              onChange={e => setTextOverlay(p => ({ ...p, text: e.target.value }))}
              placeholder="Type here..."
              className="w-full border border-gray-300 rounded-md p-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-[120px] shadow-sm"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-900 block mb-3">Color</label>
            <div className="flex flex-wrap gap-3">
              {['#FFFFFF', '#000000', '#EF4444', '#3B82F6', '#F59E0B'].map(c => (
                <button
                  key={c}
                  onClick={() => setTextOverlay(p => ({ ...p, color: c }))}
                  className={`w-10 h-10 rounded-full border border-gray-200 shadow-sm transition-transform ${
                    textOverlay.color === c ? 'ring-2 ring-blue-500 ring-offset-2 scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-900 flex items-center justify-between mb-3">
              <span>Size</span>
              <span className="text-blue-600">{textOverlay.size}px</span>
            </label>
            <input
              type="range"
              min="16"
              max="100"
              value={textOverlay.size}
              onChange={e => setTextOverlay(p => ({ ...p, size: Number(e.target.value) }))}
              className="w-full accent-blue-600 bg-gray-200 h-2 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-900 block mb-3">Position</label>
            <div className="flex bg-gray-100 rounded-md p-1 shadow-inner border border-gray-200">
              {(['top', 'middle', 'bottom'] as const).map(pos => (
                <button
                  key={pos}
                  onClick={() => setTextOverlay(p => ({ ...p, position: pos }))}
                  className={`flex-1 py-2 text-sm font-medium rounded capitalize transition-colors ${
                    textOverlay.position === pos
                      ? 'bg-white shadow border border-gray-200 text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
