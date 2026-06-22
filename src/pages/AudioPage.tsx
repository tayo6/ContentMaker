import { ArrowLeft, ArrowRight, Upload, Music, X } from 'lucide-react';
import type { Dispatch, SetStateAction, ChangeEvent } from 'react';
import { useState } from 'react';
import { AudioConfig } from '../types';

interface AudioPageProps {
  audioConfig: AudioConfig;
  setAudioConfig: Dispatch<SetStateAction<AudioConfig>>;
  onNext: () => void;
  onBack: () => void;
}

export default function AudioPage({ audioConfig, setAudioConfig, onNext, onBack }: AudioPageProps) {
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('audio/')) { setError('Please upload a valid audio file (MP3, WAV, etc.)'); return; }
    setError(null);
    const url = URL.createObjectURL(file);
    const audio = new Audio(url);
    audio.onloadedmetadata = () => {
      setAudioConfig({ file, url, duration: audio.duration, startTime: 0, endTime: audio.duration, trimStart: 0, trimEnd: audio.duration });
    };
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const clearAudio = () => {
    setAudioConfig({ file: null, url: null, startTime: 0, endTime: 0, duration: 0, trimStart: 0, trimEnd: 0 });
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
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
            Add Audio
          </span>
        </div>
        <button
          onClick={onNext}
          className="px-5 py-3 text-base font-bold text-white rounded-full transition-colors hover:brightness-95"
          style={{ background: audioConfig.url ? '#E60023' : '#111111', border: 'none', cursor: 'pointer' }}
        >
          {audioConfig.url ? 'Next' : 'Skip'}
        </button>
      </div>

      {!audioConfig.url ? (
        <label
          htmlFor="audio-upload"
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '4rem 2rem', borderRadius: '20px', cursor: 'pointer',
            background: isDragging ? 'rgba(201,123,132,0.06)' : '#FFFFFF',
            border: `2px dashed ${isDragging ? '#C97B84' : '#E8DDD0'}`,
            transition: 'all 0.2s ease', textAlign: 'center',
          }}
        >
          <input id="audio-upload" type="file" accept="audio/*" onChange={handleFileInput} style={{ display: 'none' }} />
          <div className="flex items-center justify-center mb-6"
            style={{ width: 80, height: 80, borderRadius: '50%', background: '#E9E9E9' }}>
            <Upload className="w-8 h-8" style={{ color: '#111111' }} />
          </div>
          <p style={{ fontWeight: 700, fontSize: '1.5rem', color: '#111111', marginBottom: '0.5rem' }}>
            Drop your audio here
          </p>
          <p style={{ fontSize: '1rem', color: '#767676', marginBottom: '2rem', fontWeight: 500 }}>MP3, WAV up to 10MB</p>
          <span className="inline-block px-6 py-3 text-base font-bold rounded-full text-white transition-colors hover:brightness-95"
            style={{ background: '#E60023' }}>
            Choose File
          </span>
          {error && <p className="mt-4 text-sm font-medium" style={{ color: '#DC2626' }}>{error}</p>}
        </label>
      ) : (
        <div className="rounded-[32px] p-8" style={{ background: '#FFFFFF', border: '1px solid #E9E9E9' }}>
          {/* Track info */}
          <div className="flex items-center gap-4 mb-6 pb-6" style={{ borderBottom: '1px solid #E9E9E9' }}>
            <div className="flex items-center justify-center flex-shrink-0"
              style={{ width: 56, height: 56, borderRadius: '16px', background: '#E9E9E9' }}>
              <Music className="w-6 h-6" style={{ color: '#111111' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 700, fontSize: '1.125rem', color: '#111111', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {audioConfig.file?.name}
              </p>
              <p style={{ fontSize: '0.875rem', color: '#767676', margin: 0, fontWeight: 500 }}>
                Duration: {formatTime(audioConfig.duration)}
              </p>
            </div>
            <button onClick={clearAudio} className="flex-shrink-0 p-3 rounded-full transition-colors bg-gray-100 hover:bg-[#FFD4D9]"
              style={{ border: 'none', cursor: 'pointer', color: '#111111' }}>
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Audio player */}
          <audio src={audioConfig.url} controls className="w-full mb-8 h-12"
            style={{ borderRadius: '9999px', accentColor: '#111111' } as any} />

          {/* Trim slider */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111111' }}>Start Time</label>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#111111' }}>{audioConfig.trimStart.toFixed(1)}s</span>
            </div>
            <input
              type="range" min="0" max={audioConfig.duration} step="0.1" value={audioConfig.trimStart}
              onChange={e => setAudioConfig(prev => ({ ...prev, trimStart: Number(e.target.value) }))}
              style={{ width: '100%', cursor: 'pointer', accentColor: '#111111' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
