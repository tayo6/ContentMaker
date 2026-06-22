import { useState, useRef } from 'react';
import { ArrowLeft, Download, Film, Loader2, CheckCircle2 } from 'lucide-react';
import { AspectRatio, AudioConfig, TextOverlay, VideoInfo } from '../types';
import { renderAndDownloadVideo } from '../utils/canvasRecorder';

interface ExportPageProps {
  video: VideoInfo;
  aspectRatio: AspectRatio;
  textOverlays: TextOverlay[];
  audioConfig: AudioConfig;
  onBack: () => void;
}

type DownloadFormat = 'mp4' | 'webm';

export default function ExportPage({ video, aspectRatio, textOverlays, audioConfig, onBack }: ExportPageProps) {
  const [format, setFormat] = useState<DownloadFormat>('mp4');
  const [fileExt, setFileExt] = useState<string>('webm');
  const [isExporting, setIsExporting] = useState(false);
  const [isDirectDownloading, setIsDirectDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const anchorRef = useRef<HTMLAnchorElement>(null);

  const bestVideo = video.video_files.find(f => f.quality === 'hd') || video.video_files[0];
  const needsRendering = textOverlays.some(o => !!o.text) || !!audioConfig.url;
  const isBusy = isExporting || isDirectDownloading;

  const handleExport = async () => {
    if (!bestVideo) return;
    setError(null);
    if (!needsRendering) {
      setIsDirectDownloading(true);
      try {
        const filename = `contentmaker-video-${Date.now()}.mp4`;
        const res = await fetch(`/api/download?url=${encodeURIComponent(bestVideo.link)}&filename=${encodeURIComponent(filename)}`);
        if (!res.ok) throw new Error(`Server error ${res.status}`);
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objectUrl; a.download = filename;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
      } catch (e: any) {
        setError('Download failed: ' + (e?.message || 'Unknown error'));
      } finally { setIsDirectDownloading(false); }
      return;
    }
    setIsExporting(true); setProgress(0); setGeneratedUrl(null);
    try {
      const { url, ext } = await renderAndDownloadVideo(bestVideo.link, aspectRatio, textOverlays, audioConfig, 'mp4', (p) => setProgress(p));
      setGeneratedUrl(url); setFileExt(ext);
    } catch (err: any) {
      setError('Render failed: ' + (err?.message || 'Try a shorter video.'));
    } finally { setIsExporting(false); }
  };

  const handleDownloadBlob = async () => {
    if (!generatedUrl) return;
    try {
      const res = await fetch(generatedUrl);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl; a.download = `contentmaker-video-${Date.now()}.${fileExt}`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
    } catch {
      if (anchorRef.current) {
        anchorRef.current.href = generatedUrl;
        anchorRef.current.download = `contentmaker-video-${Date.now()}.${fileExt}`;
        anchorRef.current.click();
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <a ref={anchorRef} style={{ display: 'none' }} />

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={onBack}
          disabled={isBusy}
          className="flex items-center gap-1.5 text-sm font-bold pl-0 pr-3 py-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-40"
          style={{ color: '#111111' }}
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 mr-1">
            <ArrowLeft className="w-5 h-5" />
          </div>
          Back
        </button>
        <div className="flex items-center gap-2">
          <span style={{ fontWeight: 700, fontSize: '1.25rem', color: '#111111' }}>
            Export
          </span>
        </div>
        <div style={{ width: 80 }} />
      </div>

      <div className="rounded-[32px] p-10 text-center" style={{ background: '#FFFFFF', border: '1px solid #E9E9E9' }}>
        {/* Icon */}
        <div className="flex items-center justify-center mx-auto mb-8"
          style={{ width: 96, height: 96, borderRadius: '50%', background: '#E9E9E9' }}>
          <Film className="w-10 h-10" style={{ color: '#111111' }} />
        </div>

        {!generatedUrl && !isBusy && (
          <>
            <h2 style={{ fontWeight: 700, fontSize: '1rem', color: '#111111', marginBottom: '0.75rem' }}>
              Ready to Download
            </h2>
            <p style={{ color: '#767676', fontSize: '0.53125rem', lineHeight: 1.6, maxWidth: 380, margin: '0 auto 2.5rem', fontWeight: 500 }}>
              {needsRendering
                ? 'Your edits will be rendered and saved as .webm — plays on all modern devices.'
                : 'Your video will be downloaded at original quality as .mp4.'}
            </p>

            {error && (
              <div className="mb-5 text-sm font-medium px-4 py-3 rounded-xl text-left" style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B' }}>
                {error}
              </div>
            )}

            {!needsRendering && (
              <div className="flex rounded-3xl overflow-hidden max-w-xs mx-auto mb-6 p-1" style={{ background: '#E9E9E9' }}>
                {(['mp4', 'webm'] as const).map(f => (
                  <button key={f} onClick={() => setFormat(f)}
                    className="flex-1 py-3 text-sm font-bold transition-all rounded-2xl"
                    style={{
                      background: format === f ? '#FFFFFF' : 'transparent',
                      color: '#111111',
                      border: 'none', cursor: 'pointer', boxShadow: format === f ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                      margin: '2px', fontFamily: '"Inter", sans-serif',
                    }}>
                    .{f.toUpperCase()}
                  </button>
                ))}
              </div>
            )}

            {needsRendering && (
              <div className="mb-6 px-5 py-4 rounded-2xl text-sm font-semibold max-w-xs mx-auto" style={{ background: '#E9E9E9', color: '#111111' }}>
                Edits detected — will render as <strong>.webm</strong>
              </div>
            )}

            <button onClick={handleExport}
              className="inline-flex items-center gap-2 px-8 py-4 text-base font-bold text-white rounded-full transition-colors hover:brightness-95 w-full max-w-xs justify-center"
              style={{ background: '#E60023', border: 'none', cursor: 'pointer' }}>
              <Download className="w-5 h-5" />
              {needsRendering ? 'Render & Download' : 'Download Video'}
            </button>
          </>
        )}

        {isDirectDownloading && (
          <div className="py-6 flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#C97B84' }} />
            <p style={{ color: '#7A7469', fontWeight: 500, margin: 0 }}>Preparing download…</p>
          </div>
        )}

        {isExporting && (
          <div className="py-4 max-w-sm mx-auto">
            <p style={{ fontWeight: 600, color: '#1A1A1A', marginBottom: '1rem' }}>Rendering {Math.round(progress)}%</p>
            <div style={{ height: 6, background: '#E8DDD0', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #C97B84, #A85F68)', borderRadius: 99, transition: 'width 0.2s ease' }} />
            </div>
            <p style={{ fontSize: '0.8125rem', color: '#7A7469', marginTop: '0.75rem' }}>Don't close this tab.</p>
          </div>
        )}

        {generatedUrl && (
          <div className="max-w-md mx-auto">
            <div className="flex items-center gap-3 justify-center mb-6">
              <CheckCircle2 className="w-6 h-6" style={{ color: '#E60023' }} />
              <span style={{ fontWeight: 700, fontSize: '1.5rem', color: '#111111' }}>
                Ready to Save
              </span>
            </div>
            <video src={generatedUrl} controls className="w-full mb-8 rounded-[24px]" style={{ background: '#000' }} />
            <div className="flex flex-col gap-3">
              <button onClick={handleDownloadBlob}
                className="w-full flex items-center justify-center gap-2 py-4 text-base font-bold text-white rounded-full transition-colors hover:brightness-95"
                style={{ background: '#E60023', border: 'none', cursor: 'pointer' }}>
                <Download className="w-5 h-5" /> Save .{fileExt}
              </button>
              <button onClick={() => { setGeneratedUrl(null); setError(null); }}
                className="w-full py-4 text-base font-bold rounded-full transition-colors hover:bg-gray-200"
                style={{ background: '#E9E9E9', color: '#111111', border: 'none', cursor: 'pointer' }}>
                Redo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
