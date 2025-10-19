import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AdvancedSearchBarProps {
  onSearch: (query: string, filters: SearchFilters) => void;
  loading: boolean;
}

interface SearchFilters {
  query: string;
  account: string;
  sender: string;
  dateFrom: string;
  dateTo: string;
  hasAttachment: boolean;
  isUnread: boolean;
}

const AdvancedSearchBar: React.FC<AdvancedSearchBarProps> = ({ onSearch, loading }) => {
  const [query, setQuery] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    account: '',
    sender: '',
    dateFrom: '',
    dateTo: '',
    hasAttachment: false,
    isUnread: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const searchFilters = { ...filters, query };
    onSearch(query, searchFilters);
  };

  const clearFilters = () => {
    setQuery('');
    setFilters({
      query: '',
      account: '',
      sender: '',
      dateFrom: '',
      dateTo: '',
      hasAttachment: false,
      isUnread: false,
    });
    setShowAdvanced(false);
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    typeof value === 'boolean' ? value : value !== ''
  );

  return (
    <div className="advanced-search-container">
      <motion.form 
        onSubmit={handleSubmit} 
        className="search-form-enhanced"
        layout
      >
        <div className="search-input-container">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search emails, content, attachments..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="search-input-enhanced"
            disabled={loading}
          />
          
          <div className="search-actions">
            <motion.button
              type="button"
              className={`filter-toggle ${showAdvanced ? 'active' : ''} ${hasActiveFilters ? 'has-filters' : ''}`}
              onClick={() => setShowAdvanced(!showAdvanced)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              📊
              {hasActiveFilters && <span className="filter-indicator" />}
            </motion.button>

            {(query || hasActiveFilters) && (
              <motion.button
                type="button"
                className="clear-btn"
                onClick={clearFilters}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
              >
                ❌
              </motion.button>
            )}

            <motion.button
              type="submit"
              className="search-submit"
              disabled={loading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {loading ? 'Searching...' : 'Search'}
            </motion.button>
          </div>
        </div>

        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              className="advanced-filters"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <div className="filters-grid">
                <div className="filter-group">
                  <label className="filter-label">
                    👤 From
                  </label>
                  <input
                    type="text"
                    placeholder="sender@email.com"
                    value={filters.sender}
                    onChange={(e) => setFilters({...filters, sender: e.target.value})}
                    className="filter-input"
                  />
                </div>

                <div className="filter-group">
                  <label className="filter-label">
                    🏷️ Account
                  </label>
                  <input
                    type="text"
                    placeholder="Filter by account"
                    value={filters.account}
                    onChange={(e) => setFilters({...filters, account: e.target.value})}
                    className="filter-input"
                  />
                </div>

                <div className="filter-group">
                  <label className="filter-label">
                    📅 Date From
                  </label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                    className="filter-input"
                  />
                </div>

                <div className="filter-group">
                  <label className="filter-label">
                    📅 Date To
                  </label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                    className="filter-input"
                  />
                </div>
              </div>

              <div className="filters-checkboxes">
                <label className="checkbox-filter">
                  <input
                    type="checkbox"
                    checked={filters.hasAttachment}
                    onChange={(e) => setFilters({...filters, hasAttachment: e.target.checked})}
                  />
                  <span className="checkbox-custom"></span>
                  Has Attachments
                </label>

                <label className="checkbox-filter">
                  <input
                    type="checkbox"
                    checked={filters.isUnread}
                    onChange={(e) => setFilters({...filters, isUnread: e.target.checked})}
                  />
                  <span className="checkbox-custom"></span>
                  Unread Only
                </label>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.form>

      {hasActiveFilters && (
        <motion.div 
          className="active-filters"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <span className="active-filters-label">Active filters:</span>
          <div className="filter-tags">
            {filters.sender && (
              <span className="filter-tag">
                From: {filters.sender}
                <button onClick={() => setFilters({...filters, sender: ''})}>
                  ❌
                </button>
              </span>
            )}
            {filters.account && (
              <span className="filter-tag">
                Account: {filters.account}
                <button onClick={() => setFilters({...filters, account: ''})}>
                  ❌
                </button>
              </span>
            )}
            {filters.dateFrom && (
              <span className="filter-tag">
                From: {filters.dateFrom}
                <button onClick={() => setFilters({...filters, dateFrom: ''})}>
                  ❌
                </button>
              </span>
            )}
            {filters.dateTo && (
              <span className="filter-tag">
                To: {filters.dateTo}
                <button onClick={() => setFilters({...filters, dateTo: ''})}>
                  ❌
                </button>
              </span>
            )}
            {filters.hasAttachment && (
              <span className="filter-tag">
                Has attachments
                <button onClick={() => setFilters({...filters, hasAttachment: false})}>
                  ❌
                </button>
              </span>
            )}
            {filters.isUnread && (
              <span className="filter-tag">
                Unread only
                <button onClick={() => setFilters({...filters, isUnread: false})}>
                  ❌
                </button>
              </span>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AdvancedSearchBar;