import React, { useState } from 'react';
import { Search, X } from 'lucide-react';

const SearchBar = ({
  placeholder = 'Search electronics, CPUs, components...',
  onSearch = () => {},
  initialValue = '',
  isLoading = false,
  className = '',
  ...props
}) => {
  const [query, setQuery] = useState(initialValue);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(query.trim());
    }
  };

  const handleClear = () => {
    setQuery('');
    if (onSearch) {
      onSearch('');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`relative w-full max-w-lg ${className}`}
      {...props}
    >
      <div className="relative flex items-center">
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-brand-light border border-brand-gray-250 pl-10 pr-10 py-2 rounded-sm text-xs text-brand-gray-800 transition-all focus:border-brand-accent focus:ring-1 focus:ring-brand-accent focus:bg-white placeholder:text-brand-gray-400"
        />
        
        {/* Search Icon */}
        <Search className="absolute left-3.5 top-3 w-4 h-4 text-brand-gray-450 pointer-events-none" />

        {/* Clear/Cancel Icon */}
        {query && !isLoading && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3.5 top-3 text-brand-gray-400 hover:text-brand-gray-600 focus:outline-none"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute right-3.5 top-3">
            <svg className="animate-spin h-4 w-4 text-brand-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
      </div>
    </form>
  );
};

export default SearchBar;
