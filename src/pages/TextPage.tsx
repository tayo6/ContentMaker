import { ArrowLeft, ArrowRight, Type, Plus, Trash2 } from 'lucide-react';
import { AspectRatio, TextOverlay, VideoInfo } from '../types';
import { useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

interface TextPageProps {
  video: VideoInfo;
  aspectRatio: AspectRatio;
  textOverlays: TextOverlay[];
  setTextOverlays: Dispatch<SetStateAction<TextOverlay[]>>;
  onNext: () => void;
  onBack: () => void;
}

const ratioMap: Record<AspectRatio, number> = {
  '9:16': 9/16, '3:4': 3/4, '1:1': 1, '4:3': 4/3, '16:9': 16/9,
};

const COLORS = [
  { hex: '#FFFFFF', label: 'White' },
  { hex: '#1A1A1A', label: 'Black' },
  { hex: '#C97B84', label: 'Rose' },
  { hex: '#6B9FD4', label: 'Blue' },
  { hex: '#F59E0B', label: 'Amber' },
];

export default function TextPage({ video, aspectRatio, textOverlays, setTextOverlays, onNext, onBack }: TextPageProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(textOverlays.length > 0 ? 0 : null);
  const bestVideo = video.video_files.find(f => f.quality === 'hd') || video.video_files[0];
  const CONTAINER_H = 540;
  const ratio = ratioMap[aspectRatio];
  const boxW = Math.min(CONTAINER_H * ratio, 760);
  const boxH = boxW / ratio;

  const handleAddText = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    setTextOverlays([...textOverlays, { id: newId, text: '', color: '#FFFFFF', size: 36, position: 'middle' }]);
    setActiveIndex(textOverlays.length);
  };

  const handleRemoveText = (index: number) => {
    const newOverlays = [...textOverlays];
    newOverlays.splice(index, 1);
    setTextOverlays(newOverlays);
    if (activeIndex === index) {
      setActiveIndex(newOverlays.length > 0 ? 0 : null);
    } else if (activeIndex !== null && activeIndex > index) {
      setActiveIndex(activeIndex - 1);
    }
  };

  const updateActiveOverlay = (updates: Partial<TextOverlay>) => {
    if (activeIndex === null) return;
    const newOverlays = [...textOverlays];
    newOverlays[activeIndex] = { ...newOverlays[activeIndex], ...updates };
    setTextOverlays(newOverlays);
  };

  const getPositionStyle = (position: string): React.CSSProperties => {
    switch (position) {
      case 'top':    return { top: '12%', transform: 'translateY(0)' };
      case 'bottom': return { top: '80%', transform: 'translateY(-50%)' };
      default:       return { top: '50%', transform: 'translateY(-50%)' };
    }
  };

  const activeOverlay = activeIndex !== null ? textOverlays[activeIndex] : null;

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
            Add Text
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
        <div className="flex-1 flex items-center justify-center rounded-[32px] overflow-hidden"
          style={{ height: `${CONTAINER_H + 40}px`, background: '#E9E9E9' }}>
          <div className="relative bg-black overflow-hidden transition-all duration-300"
            style={{ width: `${boxW}px`, height: `${boxH}px`, maxWidth: '100%', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
            <video ref={videoRef} src={`/api/proxy?url=${encodeURIComponent(bestVideo.link)}`}
              loop muted autoPlay crossOrigin="anonymous" playsInline
              className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
            {textOverlays.map((overlay, index) => {
              if (!overlay.text) return null;
              const fontSize = Math.floor(overlay.size * (boxH / 800));
              return (
                <div key={overlay.id} style={{ position: 'absolute', left: 0, right: 0, textAlign: 'center', padding: '0 12px', pointerEvents: 'none', zIndex: 10 + index, ...getPositionStyle(overlay.position) }}>
                  {overlay.text.split('\n').map((line, i) => (
                    <div key={i} style={{ color: overlay.color, fontSize: `${fontSize}px`, fontWeight: 700, lineHeight: 1.25, textShadow: '0px 2px 10px rgba(0,0,0,0.9)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {line || '\u00A0'}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* Controls */}
        <div className="w-full lg:w-80 self-start rounded-[32px] p-6 lg:p-8 space-y-6" style={{ background: '#FFFFFF', border: '1px solid #E9E9E9' }}>
          <div className="flex items-center justify-between pb-4" style={{ borderBottom: '1px solid #E9E9E9' }}>
            <h3 style={{ fontWeight: 700, fontSize: '1.25rem', color: '#111111', margin: 0 }}>Texts</h3>
            <button onClick={handleAddText} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-full transition-colors hover:bg-gray-200"
              style={{ background: '#E9E9E9', color: '#111111', border: 'none', cursor: 'pointer' }}>
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {textOverlays.map((overlay, index) => (
              <div key={overlay.id} className="flex items-center gap-2">
                <button
                  onClick={() => setActiveIndex(index)}
                  className="flex-1 text-left px-4 py-3 rounded-2xl text-sm font-bold transition-colors truncate"
                  style={{
                    background: activeIndex === index ? '#111111' : '#E9E9E9',
                    border: 'none',
                    color: activeIndex === index ? '#FFFFFF' : '#111111',
                    cursor: 'pointer'
                  }}>
                  {overlay.text.split('\n')[0] || `Text Box ${index + 1}`}
                </button>
                <button onClick={() => handleRemoveText(index)} className="p-3 rounded-full transition-colors"
                  style={{ background: '#E9E9E9', border: 'none', color: '#111111', cursor: 'pointer' }}
                  onMouseOver={e => (e.currentTarget.style.background = '#FFD4D9')} onMouseOut={e => (e.currentTarget.style.background = '#E9E9E9')}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {activeOverlay && (
            <div className="pt-6 border-t" style={{ borderColor: '#E9E9E9' }}>
              {/* Text input */}
              <div className="mb-6">
                <textarea
                  value={activeOverlay.text}
                  onChange={e => updateActiveOverlay({ text: e.target.value })}
                  placeholder="Type your text here..."
                  rows={3}
                  style={{
                    width: '100%', border: 'none', borderRadius: '16px', padding: '1rem', fontSize: '1rem',
                    color: '#111111', outline: 'none', background: '#E9E9E9', resize: 'none', fontFamily: '"Inter", sans-serif',
                    lineHeight: 1.5, fontWeight: 500
                  }}
                  onFocus={e => (e.currentTarget.style.boxShadow = '0 0 0 2px #111111')}
                  onBlur={e => (e.currentTarget.style.boxShadow = 'none')}
                />
              </div>

              {/* Color */}
              <div className="mb-6">
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#111111', marginBottom: '0.75rem' }}>Color</label>
                <div className="flex gap-3">
                  {COLORS.map(c => (
                    <button
                      key={c.hex}
                      title={c.label}
                      onClick={() => updateActiveOverlay({ color: c.hex })}
                      style={{
                        width: 40, height: 40, borderRadius: '50%', background: c.hex, cursor: 'pointer',
                        border: activeOverlay.color === c.hex ? 'none' : '2px solid #E9E9E9',
                        boxShadow: activeOverlay.color === c.hex ? '0 0 0 3px #111111' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Size */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111111' }}>Size</label>
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#111111' }}>{activeOverlay.size}px</span>
                </div>
                <input
                  type="range" min="16" max="100" value={activeOverlay.size}
                  onChange={e => updateActiveOverlay({ size: Number(e.target.value) })}
                  style={{ width: '100%', cursor: 'pointer', accentColor: '#111111' }}
                />
              </div>

              {/* Position */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#111111', marginBottom: '0.75rem' }}>Position</label>
                <div className="flex rounded-2xl overflow-hidden p-1" style={{ background: '#E9E9E9' }}>
                  {(['top', 'middle', 'bottom'] as const).map(pos => (
                    <button
                      key={pos}
                      onClick={() => updateActiveOverlay({ position: pos })}
                      className="flex-1 py-2 text-sm font-bold capitalize transition-all rounded-xl"
                      style={{
                        background: activeOverlay.position === pos ? '#FFFFFF' : 'transparent',
                        color: '#111111',
                        border: 'none',
                        boxShadow: activeOverlay.position === pos ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                        margin: '2px',
                        cursor: 'pointer',
                        fontFamily: '"Inter", sans-serif',
                      }}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
