import { useState, useRef } from 'react';
import { ArrowLeft, Download, Film, Loader2 } from 'lucide-react';
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
  const [fileExt, setFileExt] = useState<string>('mp4');
  const [isExporting, setIsExporting] = useState(false);
  const [isDirectDownloading, setIsDirectDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const anchorRef = useRef<HTMLAnchorElement>(null);

  const bestVideo = video.video_files.find(f => f.quality === 'hd') || video.video_files[0];

  const handleExport = async () => {
    if (!bestVideo) return;
    setError(null);

    const needsRendering = !!textOverlay.text || !!audioConfig.url;

    if (!needsRendering) {
      // Direct download via server proxy — no canvas, instant, full quality
      setIsDirectDownloading(true);
      try {
        const filename = `contentmaker-video-${Date.now()}.mp4`;
        const downloadUrl = `/api/download?url=${encodeURIComponent(bestVideo.link)}&filename=${encodeURIComponent(filename)}`;

        // Fetch as blob so we control the download locally
        const res = await fetch(downloadUrl);
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
      } catch (e: any) {
        setError('Direct download failed: ' + (e?.message || 'Unknown error'));
      } finally {
        setIsDirectDownloading(false);
      }
      return;
    }

    // Canvas render path (text overlay / audio)
    setIsExporting(true);
    setProgress(0);
    setGeneratedUrl(null);
    try {
      const { url, ext } = await renderAndDownloadVideo(
        bestVideo.link,
        aspectRatio,
        textOverlay,
        audioConfig,
        format,
        (p) => setProgress(p)
      );
      setGeneratedUrl(url);
      setFileExt(ext);
    } catch (err: any) {
      console.error(err);
      setError('Render failed: ' + (err?.message || 'Unknown error. Try a shorter video.'));
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadBlob = async () => {
    if (!generatedUrl) return;
    try {
      const res = await fetch(generatedUrl);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = `contentmaker-video-${Date.now()}.${fileExt}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
    } catch (e) {
      // Fallback to direct anchor
      if (anchorRef.current) {
        anchorRef.current.href = generatedUrl;
        anchorRef.current.download = `contentmaker-video-${Date.now()}.${fileExt}`;
        anchorRef.current.click();
      }
    }
  };

  const isBusy = isExporting || isDirectDownloading;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Hidden anchor for fallback downloads */}
      <a ref={anchorRef} style={{ display: 'none' }} />

      <div className="flex items-center justify-between mx-auto mb-8">
        <button onClick={onBack} disabled={isBusy} className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-50">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </button>
        <h1 className="text-xl font-bold text-gray-900">5. Export</h1>
        <div className="w-20" />
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-8 sm:p-12 shadow-sm text-center">
        <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Film className="w-10 h-10" />
        </div>

        <h2 className="text-3xl font-bold text-gray-900 mb-2">Ready to Download</h2>
        <p className="text-gray-600 max-w-md mx-auto mb-8">
          {textOverlay.text || audioConfig.url
            ? 'Your video will be rendered with your edits applied, then downloaded.'
            : 'Your video will be downloaded directly at full quality.'}
        </p>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        {!isBusy && !generatedUrl && (
          <div className="max-w-sm mx-auto">
            {/* Only show format picker when canvas-rendering (webm either way but label honestly) */}
            {(textOverlay.text || audioConfig.url) && (
              <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
                <button
                  onClick={() => setFormat('mp4')}
                  className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${format === 'mp4' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  .MP4 / .WebM
                </button>
                <button
                  onClick={() => setFormat('mov')}
                  className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${format === 'mov' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  .MOV
                </button>
              </div>
            )}
            <button
              onClick={handleExport}
              className="w-full flex items-center justify-center px-6 py-4 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Download className="w-5 h-5 mr-2" />
              {textOverlay.text || audioConfig.url ? 'Generate & Download' : 'Download Video'}
            </button>
          </div>
        )}

        {isDirectDownloading && (
          <div className="max-w-md mx-auto py-4 flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-gray-700 font-medium">Preparing download…</p>
          </div>
        )}

        {isExporting && (
          <div className="max-w-md mx-auto py-4">
            <p className="text-gray-700 font-medium mb-4">Rendering: {Math.round(progress)}%</p>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden w-full">
              <div className="h-full bg-blue-600 transition-all duration-200" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-sm text-gray-500 mt-4">Do not close this tab while rendering.</p>
          </div>
        )}

        {generatedUrl && (
          <div className="max-w-md mx-auto space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h2 className="text-xl font-bold text-green-800 mb-2">Rendered Successfully!</h2>
              <video src={generatedUrl} controls className="w-full rounded shadow-sm border border-black/10 mx-auto mb-4 bg-black" />
              <div className="flex gap-4">
                <button
                  onClick={handleDownloadBlob}
                  className="flex-1 flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-md font-bold hover:bg-green-700 transition"
                >
                  <Download className="w-4 h-4 mr-2" /> Download
                </button>
                <button
                  onClick={() => { setGeneratedUrl(null); setError(null); }}
                  className="flex items-center justify-center px-4 py-3 bg-white text-gray-700 border border-gray-300 rounded-md font-bold hover:bg-gray-50 transition"
                >
                  Redo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
