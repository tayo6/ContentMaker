import { Loader2, ArrowRight, ArrowLeft, Search } from 'lucide-react';
import VideoCard from '../components/VideoCard';
import { VideoInfo } from '../types';
import type { Dispatch, SetStateAction } from 'react';

interface ResultsPageProps {
  query: string;
  setQuery: Dispatch<SetStateAction<string>>;
  videos: VideoInfo[];
  loading: boolean;
  error: string | null;
  page: number;
  handleSearch: (q: string) => void;
  handleNextPage: () => void;
  handlePrevPage: () => void;
  handleSelectVideo: (v: VideoInfo) => void;
  onBack: () => void;
}

export default function ResultsPage({
  query, setQuery, videos, loading, error, page,
  handleSearch, handleNextPage, handlePrevPage, handleSelectVideo, onBack
}: ResultsPageProps) {

  return (
    <div style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Step header */}
        <div className="flex items-center justify-between mb-6">
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
              Select Footages
            </span>
          </div>
          <div style={{ width: 56 }} />
        </div>

        {/* Search + title bar */}
        <div
          className="flex flex-col items-center justify-center gap-6 mb-10"
        >
          <h2 style={{ fontWeight: 700, fontSize: '2rem', color: '#111111', margin: 0, textAlign: 'center' }}>
            {query ? `More like "${query}"` : 'Ideas for you'}
          </h2>

          <div className="relative w-full max-w-xl">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="w-5 h-5" style={{ color: '#767676' }} />
            </div>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch(query)}
              placeholder="Search different footage..."
              style={{
                width: '100%',
                border: 'none',
                borderRadius: '9999px',
                padding: '1rem 3.5rem 1rem 3rem',
                fontSize: '1rem',
                color: '#111111',
                outline: 'none',
                background: '#E9E9E9',
                fontWeight: 500,
              }}
            />
          </div>
        </div>

        {/* Content states */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4" style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E8DDD0' }}>
            <Loader2 className="w-7 h-7 animate-spin" style={{ color: '#C97B84' }} />
            <p style={{ color: '#7A7469', fontSize: '0.9375rem', margin: 0 }}>Searching footage...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16 rounded-2xl" style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B' }}>
            <p style={{ margin: 0, fontWeight: 500 }}>{error}</p>
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-24 rounded-2xl" style={{ background: '#FFFFFF', border: '1px solid #E8DDD0' }}>
            <p style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '1.25rem', color: '#1A1A1A', marginBottom: '0.5rem' }}>Nothing found</p>
            <p style={{ color: '#7A7469', fontSize: '0.875rem', margin: 0 }}>Try different keywords.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4" style={{ gridAutoRows: 'minmax(250px, auto)' }}>
              {videos.map((video) => (
                <VideoCard key={`${video.source}-${video.id}`} video={video} onClick={handleSelectVideo} />
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-12 flex items-center justify-center gap-6">
              <button
                onClick={handlePrevPage}
                disabled={page === 1}
                className="flex items-center justify-center w-12 h-12 rounded-full transition-all disabled:opacity-40 hover:bg-gray-200"
                style={{ background: '#E9E9E9', border: 'none', color: '#111111', cursor: page === 1 ? 'not-allowed' : 'pointer' }}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNextPage}
                className="flex items-center justify-center w-12 h-12 rounded-full transition-all hover:bg-gray-200"
                style={{ background: '#E9E9E9', border: 'none', color: '#111111', cursor: 'pointer' }}
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
