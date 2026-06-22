import { useState } from 'react';
import Navbar from './components/Navbar';
import HeroSearch from './components/HeroSearch';
import { AspectRatio, AudioConfig, TextOverlay, VideoInfo } from './types';
import { EditorStep } from './constants';
import ResultsPage from './pages/ResultsPage';
import ResizePage from './pages/ResizePage';
import TextPage from './pages/TextPage';
import AudioPage from './pages/AudioPage';
import ExportPage from './pages/ExportPage';

export default function App() {
  const [step, setStep] = useState<EditorStep>('search');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [videos, setVideos] = useState<VideoInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<VideoInfo | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([{ id: 'default', text: '', color: '#FFFFFF', size: 36, position: 'middle' }]);
  const [audioConfig, setAudioConfig] = useState<AudioConfig>({ file: null, url: null, startTime: 0, endTime: 0, duration: 0, trimStart: 0, trimEnd: 0 });

  const fetchVideos = async (searchQuery: string, pageNum: number) => {
    setLoading(true); setError(null);
    try {
      const q = searchQuery.trim() || 'trending';
      const res = await fetch(`/api/videos?query=${encodeURIComponent(q)}&page=${pageNum}`);
      const data = await res.json();
      setVideos(data.results || []);
    } catch (err) {
      setError('Failed to fetch videos. Please try again.');
    } finally { setLoading(false); }
  };

  const handleHeroSearch = (newQuery: string) => {
    setQuery(newQuery); setPage(1); setStep('results');
    fetchVideos(newQuery, 1);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', color: '#111111', fontFamily: '"Inter", sans-serif' }}>
      <Navbar />

      <main style={{ paddingTop: '4rem', paddingBottom: '5rem' }}>
        {step === 'search' && (
          <>
            <HeroSearch onSearch={handleHeroSearch} initialQuery="" />
            
            {/* Spotify promo card */}
            <div className="max-w-2xl mx-auto mt-10 px-4 sm:px-6">
              <div className="rounded-2xl p-6" style={{ background: '#FFFFFF', border: '1px solid #E9E9E9' }}>
                <div className="mb-1" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#767676', letterSpacing: '0.08em' }}>FEATURED ARTIST</div>
                <h3 style={{ fontWeight: 700, fontSize: '1.25rem', color: '#111111', marginBottom: '0.25rem' }}>
                  Stream TJay KARTEL
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#767676', marginBottom: '1.25rem' }}>Latest tracks on Spotify</p>
                <iframe
                  style={{ borderRadius: '12px' }}
                  src="https://open.spotify.com/embed/artist/6CoP3rHhCUvgx8xFyg2b5X?utm_source=generator"
                  width="100%" height="200" frameBorder="0" allowFullScreen={true}
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                />
              </div>
            </div>
          </>
        )}

        {step === 'results' && (
          <ResultsPage
            query={query} setQuery={setQuery} videos={videos} loading={loading} error={error} page={page}
            handleSearch={(q) => { setQuery(q); setPage(1); fetchVideos(q, 1); }}
            handleNextPage={() => { const n = page + 1; setPage(n); fetchVideos(query, n); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            handlePrevPage={() => { if (page > 1) { const p = page - 1; setPage(p); fetchVideos(query, p); window.scrollTo({ top: 0, behavior: 'smooth' }); } }}
            handleSelectVideo={(v) => { setSelectedVideo(v); setStep('resize'); }}
            onBack={() => setStep('search')}
          />
        )}

        {step === 'resize' && selectedVideo && (
          <ResizePage video={selectedVideo} aspectRatio={aspectRatio} setAspectRatio={setAspectRatio} onNext={() => setStep('text')} onBack={() => setStep('results')} />
        )}
        {step === 'text' && selectedVideo && (
          <TextPage video={selectedVideo} aspectRatio={aspectRatio} textOverlays={textOverlays} setTextOverlays={setTextOverlays} onNext={() => setStep('audio')} onBack={() => setStep('resize')} />
        )}
        {step === 'audio' && selectedVideo && (
          <AudioPage audioConfig={audioConfig} setAudioConfig={setAudioConfig} onNext={() => setStep('export')} onBack={() => setStep('text')} />
        )}
        {step === 'export' && selectedVideo && (
          <ExportPage video={selectedVideo} aspectRatio={aspectRatio} textOverlays={textOverlays} audioConfig={audioConfig} onBack={() => setStep('audio')} />
        )}
      </main>

      {step === 'search' && (
        <footer style={{ borderTop: '1px solid #E9E9E9', padding: '2.5rem 1rem', textAlign: 'center', background: '#FFFFFF' }}>
          <p style={{ fontWeight: 600, color: '#767676', margin: 0, fontSize: '0.9375rem' }}>
            © {new Date().getFullYear()} Contentmaker
          </p>
          <p style={{ fontSize: '0.8125rem', color: '#767676', margin: '0.375rem 0 0' }}>
            Developed by Adeniran Tayo
          </p>
        </footer>
      )}
    </div>
  );
}
