import React, { useState } from 'react';

interface SearchBarProps {
  onSearch: (query: string, account: string) => void;
  loading: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, loading }) => {
  const [query, setQuery] = useState('');
  const [account, setAccount] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query, account);
  };

  return (
    <div className="search-bar">
      <form onSubmit={handleSubmit} className="search-form">
        <div className="search-inputs">
          <input
            type="text"
            placeholder="Search emails..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="search-input"
            disabled={loading}
          />
          <input
            type="text"
            placeholder="Filter by account (optional)"
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            className="account-input"
            disabled={loading}
          />
        </div>
        <button 
          type="submit" 
          className="search-button"
          disabled={loading}
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>
    </div>
  );
};

export default SearchBar;