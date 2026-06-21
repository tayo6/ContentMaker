import { Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
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
    <div className="pt-8 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="relative flex items-center justify-between mb-6">
           <button onClick={onBack} title="Back" className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0">
             <ArrowLeft className="w-5 h-5" />
           </button>
           <h1 className="text-xl font-bold text-gray-900 absolute left-1/2 -translate-x-1/2">1. Select Video</h1>
           <div className="w-[36px]" />
        </div>

        {/* Refined Mini Search Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4 border-b border-gray-200 bg-gray-50 p-6 rounded-lg shadow-sm">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">
              {query ? `Results for "${query}"` : 'Trending Footage'}
            </h2>
            <p className="text-gray-500 mt-1">Select a video to start your project.</p>
          </div>
          
          <div className="relative w-full md:w-96">
            <input 
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch(query)}
                placeholder="Search different videos..."
                className="w-full bg-white border border-gray-300 rounded-md py-2.5 pl-4 pr-24 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-gray-900"
            />
            <button 
                onClick={() => handleSearch(query)}
                className="absolute right-1 top-1 bottom-1 px-4 bg-blue-600 rounded-md text-sm font-medium text-white hover:bg-blue-700 transition"
            >
                Search
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4 bg-white border border-gray-200 rounded-lg shadow-sm">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-gray-600 font-medium">Discovering high-quality footage...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16 text-red-600 font-medium bg-red-50 rounded-lg border border-red-200 shadow-sm">
            {error}
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-24 text-gray-600 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
            <p className="text-xl font-medium mb-2 text-gray-900">No videos found</p>
            <p>Try refining your search terms.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((video) => (
                <div key={`${video.source}-${video.id}`}>
                  <VideoCard
                    video={video}
                    onClick={handleSelectVideo}
                  />
                </div>
              ))}
            </div>
            
            {/* Pagination Controls */}
            <div className="mt-12 flex items-center justify-between border-t border-gray-200 pt-6">
              <button 
                  onClick={handlePrevPage}
                  disabled={page === 1}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-md border border-gray-300 font-medium bg-white text-gray-700 disabled:opacity-50 disabled:bg-gray-50 hover:bg-gray-50 transition-colors shadow-sm"
              >
                  <ArrowLeft className="w-4 h-4" /> Previous
              </button>
              <span className="text-gray-600 font-medium px-4">Page {page}</span>
              <button 
                  onClick={handleNextPage}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-md border border-gray-300 font-medium bg-white text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
              >
                  Next <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
