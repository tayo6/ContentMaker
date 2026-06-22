import { Search } from 'lucide-react';
import { FormEvent, useState } from 'react';

interface HeroSearchProps {
  onSearch: (query: string) => void;
  initialQuery?: string;
}

const TRENDING = ['business', 'technology', 'nature', 'city', 'fitness', 'office'];

export default function HeroSearch({ onSearch, initialQuery = '' }: HeroSearchProps) {
  const [query, setQuery] = useState(initialQuery);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) onSearch(query.trim());
  };

  return (
    <div
      className="relative flex flex-col items-center justify-center px-6 text-center"
      style={{
        paddingTop: '2.5rem',
        paddingBottom: '2.5rem',
        minHeight: '350px',
        background: '#FFFFFF',
      }}
    >
      {/* Content */}
      <div className="relative z-10 max-w-2xl w-full">
        <h1
          className="mb-6"
          style={{
            fontWeight: 700,
            fontSize: 'clamp(1.5rem, 3.5vw, 2.25rem)',
            lineHeight: 1.15,
            color: '#111111',
            letterSpacing: '-0.02em',
          }}
        >
          <span style={{ color: '#E60023' }}>100%</span> free to create the contents you like<br />
          using contentmaker
        </h1>

        <p
          className="mb-10 mx-auto"
          style={{ fontSize: '13px', color: '#111111', lineHeight: 1.6, maxWidth: '480px', fontWeight: 500 }}
        >
          Access to thousands of high-quality footage for Social Media contents
        </p>

        {/* Search bar */}
        <form onSubmit={handleSubmit} className="relative max-w-xl mx-auto mb-8">
          <div
            className="flex items-center w-full"
            style={{
              background: '#E9E9E9',
              borderRadius: '9999px',
              padding: '0.375rem',
            }}
          >
            <div className="pl-4 pr-2 flex-shrink-0">
              <Search className="w-5 h-5" style={{ color: '#767676' }} />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search videos — city, nature, tech..."
              className="flex-1 w-full min-w-0 bg-transparent border-none outline-none text-base text-[#111111] px-2 py-2.5 font-medium"
            />
            <button
              type="submit"
              className="px-6 py-2.5 font-bold text-white transition-all hover:brightness-95 flex-shrink-0 whitespace-nowrap"
              style={{
                background: '#E60023',
                borderRadius: '9999px',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Search
            </button>
          </div>
        </form>

        {/* Trending tags */}
        <div className="flex flex-wrap justify-center gap-2 items-center">
          <span style={{ fontSize: '0.8125rem', color: '#111111', fontWeight: 600 }}>Trending ideas:</span>
          {TRENDING.map((tag) => (
            <button
              key={tag}
              onClick={() => { setQuery(tag); onSearch(tag); }}
              className="capitalize transition-all hover:bg-gray-200"
              style={{
                fontSize: '0.8125rem',
                color: '#111111',
                background: '#E9E9E9',
                border: 'none',
                borderRadius: '9999px',
                padding: '0.375rem 1rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
