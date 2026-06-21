import { useState } from 'react';
import { ArrowLeft, Download, Film } from 'lucide-react';
import { AspectRatio, AudioConfig, TextOverlay, VideoInfo } from '../types';
import { renderAndDownloadVideo } from '../utils/canvasRecorder';

interface ExportPageProps {
  video: VideoInfo;
  aspectRatio: AspectRatio;
  textOverlay: TextOverlay;
  audioConfig: AudioConfig;
  onBack: () => void;
}

export default function ExportPage({ video, aspectRatio, textOverlay, audioConfig, onBack }: ExportPageProps) {
  const [format, setFormat] = useState<'mp4' | 'mov'>('mp4');
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

  const bestVideo = video.video_files.find(f => f.quality === 'hd') || video.video_files[0];

  const handleExport = async () => {
    if (!bestVideo) return;
    setIsExporting(true);
    setProgress(0);
    setGeneratedUrl(null);
    try {
      const url = await renderAndDownloadVideo(
        bestVideo.link,
        aspectRatio,
        textOverlay,
        audioConfig,
        format,
        (p) => setProgress(p)
      );
      setGeneratedUrl(url);
    } catch (err) {
      console.error(err);
      alert('Failed to export video. Certain video files may restrict external canvas rendering due to CORS.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mx-auto mb-8">
         <button onClick={onBack} disabled={isExporting} className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-50">
           <ArrowLeft className="w-4 h-4 mr-2" /> Back
         </button>
         <h1 className="text-xl font-bold text-gray-900">5. Export</h1>
         <div className="w-20" /> {/* Spacer */}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-8 sm:p-12 shadow-sm text-center">
         <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Film className="w-10 h-10" />
         </div>
         
         <h2 className="text-3xl font-bold text-gray-900 mb-2">Ready to Download</h2>
         <p className="text-gray-600 max-w-md mx-auto mb-8">
            Your video is ready to be rendered. Processing occurs directly on your device, which may take a moment depending on your hardware.
         </p>

         {!isExporting && !generatedUrl ? (
             <div className="max-w-sm mx-auto">
                <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
                   <button 
                     onClick={() => setFormat('mp4')}
                     className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${format === 'mp4' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                   >
                     .MP4 Format
                   </button>
                   <button 
                     onClick={() => setFormat('mov')}
                     className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${format === 'mov' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                   >
                     .MOV Format
                   </button>
                </div>

                <button 
                  onClick={handleExport}
                  className="w-full flex items-center justify-center px-6 py-4 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Generate Video
                </button>
             </div>
         ) : isExporting ? (
             <div className="max-w-md mx-auto py-4">
                 <p className="text-gray-700 font-medium mb-4">Rendering Video: {Math.round(progress)}%</p>
                 <div className="h-3 bg-gray-200 rounded-full overflow-hidden w-full">
                    <div className="h-full bg-blue-600 transition-all duration-200" style={{ width: `${progress}%` }} />
                 </div>
                 <p className="text-sm text-gray-500 mt-4">Please do not close this tab or leave the page while rendering.</p>
             </div>
         ) : generatedUrl ? (
             <div className="max-w-md mx-auto space-y-6">
               <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                 <h2 className="text-xl font-bold text-green-800 mb-2">Video Rendered Successfully!</h2>
                 <p className="text-sm text-green-700 mb-4">
                   Click below to download. If downloading fails (due to browser preview security), right-click the video and choose "Save Video As...".
                 </p>
                 <video src={generatedUrl} controls className="w-full rounded shadow-sm border border-black/10 mx-auto mb-4 bg-black" />
                 
                 <div className="flex gap-4">
                   <a 
                     href={generatedUrl}
                     download={`contentmaker-video-${Date.now()}.${format}`}
                     target="_blank"
                     rel="noopener noreferrer"
                     className="flex-1 flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-md font-bold hover:bg-green-700 transition"
                   >
                     <Download className="w-4 h-4 mr-2" /> Download Video
                   </a>
                   <button 
                     onClick={() => setGeneratedUrl(null)}
                     className="flex items-center justify-center px-4 py-3 bg-white text-gray-700 border border-gray-300 rounded-md font-bold hover:bg-gray-50 transition"
                   >
                     Redo
                   </button>
                 </div>
               </div>
             </div>
         ) : null}
      </div>
    </div>
  );
}
