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
  const [textOverlay, setTextOverlay] = useState<TextOverlay>({
    text: '', color: '#FFFFFF', size: 36, position: 'middle'
  });
  const [audioConfig, setAudioConfig] = useState<AudioConfig>({
    file: null, url: null, startTime: 0, endTime: 0, duration: 0, trimStart: 0, trimEnd: 0
  });

  const fetchVideos = async (searchQuery: string, pageNum: number) => {
    setLoading(true);
    setError(null);
    try {
      const q = searchQuery.trim() || 'trending';
      const res = await fetch(`/api/videos?query=${encodeURIComponent(q)}&page=${pageNum}`);
      const data = await res.json();
      
      if (data.results) {
         setVideos(data.results);
      } else {
         setVideos([]);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch videos. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleHeroSearch = (newQuery: string) => {
    setQuery(newQuery);
    setPage(1);
    setStep('results');
    fetchVideos(newQuery, 1);
  };

  const handleResultsSearch = (newQuery: string) => {
    setQuery(newQuery);
    setPage(1);
    fetchVideos(newQuery, 1);
  };

  const handleNextPage = () => {
    const nextPage = page + 1;
     setPage(nextPage);
     fetchVideos(query, nextPage);
     window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrevPage = () => {
     if (page > 1) {
       const prevPage = page - 1;
       setPage(prevPage);
       fetchVideos(query, prevPage);
       window.scrollTo({ top: 0, behavior: 'smooth' });
     }
  };

  const handleSelectVideo = (video: VideoInfo) => {
     setSelectedVideo(video);
     setStep('resize');
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      <Navbar />
      
      <main className="pt-16 pb-24">
        {step === 'search' && (
           <HeroSearch onSearch={handleHeroSearch} initialQuery="" />
        )}

        {step === 'results' && (
           <ResultsPage
             query={query}
             setQuery={setQuery}
             videos={videos}
             loading={loading}
             error={error}
             page={page}
             handleSearch={handleResultsSearch}
             handleNextPage={handleNextPage}
             handlePrevPage={handlePrevPage}
             handleSelectVideo={handleSelectVideo}
             onBack={() => setStep('search')}
           />
        )}

        {step === 'resize' && selectedVideo && (
           <ResizePage
             video={selectedVideo}
             aspectRatio={aspectRatio}
             setAspectRatio={setAspectRatio}
             onNext={() => setStep('text')}
             onBack={() => setStep('results')}
           />
        )}

        {step === 'text' && selectedVideo && (
           <TextPage
             video={selectedVideo}
             aspectRatio={aspectRatio}
             textOverlay={textOverlay}
             setTextOverlay={setTextOverlay}
             onNext={() => setStep('audio')}
             onBack={() => setStep('resize')}
           />
        )}

        {step === 'audio' && selectedVideo && (
           <AudioPage
             audioConfig={audioConfig}
             setAudioConfig={setAudioConfig}
             onNext={() => setStep('export')}
             onBack={() => setStep('text')}
           />
        )}
        
        {step === 'export' && selectedVideo && (
           <ExportPage
             video={selectedVideo}
             aspectRatio={aspectRatio}
             textOverlay={textOverlay}
             audioConfig={audioConfig}
             onBack={() => setStep('audio')}
           />
        )}
      </main>

      {step === 'search' && (
        <footer className="border-t border-gray-200 py-12 text-center text-gray-500 bg-white">
          <p className="font-medium">&copy; {new Date().getFullYear()} Contentmaker. All rights reserved.</p>
          <p className="mt-2 text-sm">Developed by Tayo</p>
        </footer>
      )}
    </div>
  );
}
