import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';

interface HeaderProps {
  onMenuToggle: () => void;
  onRefresh: () => void;
  refreshing: boolean;
  unreadCount: number;
}

const Header: React.FC<HeaderProps> = ({ 
  onMenuToggle, 
  onRefresh, 
  refreshing, 
  unreadCount 
}) => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <motion.header 
      className="app-header-enhanced"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="header-content">
        <div className="header-left">
          <motion.button 
            className="menu-toggle"
            onClick={onMenuToggle}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            ☰
          </motion.button>
          
          <div className="logo-section">
            <motion.div 
              className="logo-icon"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              📧
            </motion.div>
            <div className="logo-text">
              <h1>EmailBox</h1>
              <span className="logo-subtitle">Professional Email Client</span>
            </div>
          </div>
        </div>

        <div className="header-center">
          <div className="global-search">
            <span className="search-icon">🔍</span>
            <input 
              type="text" 
              placeholder="Search across all emails..."
              className="global-search-input"
            />
          </div>
        </div>

        <div className="header-right">
          <div className="header-stats">
            {unreadCount > 0 && (
              <motion.div 
                className="unread-badge"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {unreadCount} unread
              </motion.div>
            )}
          </div>

          <div className="header-actions">
            <motion.button 
              className={`refresh-btn ${refreshing ? 'spinning' : ''}`}
              onClick={onRefresh}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              disabled={refreshing}
            >
              ↻
            </motion.button>

            <motion.button 
              className="notifications-btn"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              🔔
              <span className="notification-dot"></span>
            </motion.button>

            <motion.button 
              className="theme-toggle"
              onClick={toggleTheme}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              {isDarkMode ? '☀️' : '🌙'}
            </motion.button>

            <motion.button 
              className="settings-btn"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              ⚙️
            </motion.button>

            <div className="user-avatar">
              👤
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;