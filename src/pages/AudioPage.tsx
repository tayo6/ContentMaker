import { ArrowLeft, ArrowRight, Upload, Music } from 'lucide-react';
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

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('audio/')) {
       setError("Please upload a valid audio file.");
       return;
    }
    setError(null);
    const url = URL.createObjectURL(file);
    const audio = new Audio(url);
    audio.onloadedmetadata = () => {
      setAudioConfig({
        file,
        url,
        duration: audio.duration,
        startTime: 0,
        endTime: audio.duration,
        trimStart: 0,
        trimEnd: audio.duration,
      });
    };
  };

  const handleTrimStartChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setAudioConfig(prev => ({...prev, trimStart: val}));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mx-auto mb-8">
         <button onClick={onBack} className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900">
           <ArrowLeft className="w-4 h-4 mr-2" /> Back
         </button>
         <h1 className="text-xl font-bold text-gray-900">4. Add Audio</h1>
         <button onClick={onNext} className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700">
           Next <ArrowRight className="w-4 h-4 ml-2" />
         </button>
      </div>

      <div className="bg-white border text-center border-gray-200 rounded-lg p-12 shadow-sm">
        <label className="flex flex-col items-center justify-center cursor-pointer mb-6">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
             <Upload className="w-8 h-8" />
          </div>
          <span className="font-semibold text-gray-900 text-lg">Upload Audio Track</span>
          <span className="text-gray-500 text-sm mt-1">MP3, WAV up to 10MB</span>
          <input type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />
        </label>
        
        {error && <p className="text-red-500 font-medium">{error}</p>}

        {audioConfig.url && (
          <div className="mt-8 pt-8 border-t border-gray-100 max-w-md mx-auto text-left">
            <div className="flex items-center mb-4">
               <Music className="w-5 h-5 text-gray-400 mr-2" />
               <span className="font-medium text-gray-900 truncate flex-1">{audioConfig.file?.name}</span>
               <span className="text-sm text-gray-500">{Math.floor(audioConfig.duration)}s</span>
            </div>
            
            <audio src={audioConfig.url} controls className="w-full mb-6 relative z-10" />

            <div className="mb-2 flex justify-between text-sm font-medium text-gray-600">
               <span>Start Time (Trim)</span>
               <span>{audioConfig.trimStart.toFixed(1)}s</span>
            </div>
            <input 
               type="range" 
               min="0" 
               max={audioConfig.duration} 
               step="0.1"
               value={audioConfig.trimStart}
               onChange={handleTrimStartChange}
               className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <p className="text-xs text-gray-500 mt-2">Adjust the slider to specify where the audio should start when the video plays.</p>
          </div>
        )}
      </div>
    </div>
  );
}
