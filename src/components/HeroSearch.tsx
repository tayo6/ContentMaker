import { Search } from 'lucide-react';
import { FormEvent, useState } from 'react';

interface HeroSearchProps {
  onSearch: (query: string) => void;
  initialQuery?: string;
}

export default function HeroSearch({ onSearch, initialQuery = '' }: HeroSearchProps) {
  const [query, setQuery] = useState(initialQuery);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-4 sm:px-6 lg:px-8 bg-gray-50 flex flex-col items-center justify-center border-b border-gray-200">
      <div className="relative z-10 max-w-3xl w-full text-center">
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight mb-6">
          Find tag-relevant videos for your socials.
        </h1>
        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto font-medium">
          Great for social media managers, artists, and online content makers. Get access to thousands of high-quality videos suitable for IG, TikTok, Twitter/X, and YouTube.
        </p>

        <form onSubmit={handleSubmit} className="relative max-w-2xl mx-auto flex items-center">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="h-6 w-6 text-gray-400" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="block w-full pl-14 pr-32 py-5 rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg shadow-sm outline-none"
            placeholder="Search videos (e.g. city, nature)..."
          />
          <button
            type="submit"
            className="absolute right-2 px-6 py-3 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Search
          </button>
        </form>

        <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm text-gray-600">
          <span className="font-medium mr-2">Trending:</span>
          {['business', 'technology', 'nature', 'city', 'fitness', 'office'].map((tag) => (
            <button
              key={tag}
              onClick={() => {
                setQuery(tag);
                onSearch(tag);
              }}
              className="hover:text-blue-600 transition-colors capitalize underline underline-offset-2"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
