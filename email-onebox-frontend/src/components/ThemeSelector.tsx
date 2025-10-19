import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme, availableThemes, ThemeMode } from '../contexts/ThemeContext';
import './ThemeSelector.css';

interface ThemeSelectorProps {
  className?: string;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ className = '' }) => {
  const { currentTheme, setTheme, getThemeConfig } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const currentConfig = getThemeConfig();
  
  const getThemeColors = (theme: string) => {
    const themeColors: Record<string, { bg: string; primary: string; secondary: string }> = {
      light: { bg: '#ffffff', primary: '#0284c7', secondary: '#f1f5f9' },
      dark: { bg: '#0f172a', primary: '#3b82f6', secondary: '#1e293b' },
      ocean: { bg: '#f0f9ff', primary: '#0ea5e9', secondary: '#e0f2fe' },
      sunset: { bg: '#fff7ed', primary: '#f97316', secondary: '#fed7aa' },
      forest: { bg: '#064e3b', primary: '#10b981', secondary: '#047857' },
      minimal: { bg: '#ffffff', primary: '#000000', secondary: '#f5f5f5' }
    };
    return themeColors[theme] || themeColors.light;
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleThemeSelect = (theme: ThemeMode) => {
    setTheme(theme);
    setIsOpen(false);
  };

  return (
    <div className={`theme-selector ${className}`} ref={dropdownRef}>
      <motion.button
        className="theme-selector-trigger"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label="Select theme"
      >
        <span className="theme-icon">{currentConfig.icon}</span>
        <span className="theme-name">{currentConfig.displayName}</span>
        <motion.span
          className="chevron"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          ↓
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="theme-selector-dropdown"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            role="listbox"
          >
            <div className="theme-selector-header">
              <span className="theme-selector-title">Choose Theme</span>
              <span className="theme-selector-subtitle">Customize your experience</span>
            </div>
            
            <div className="theme-options" style={{ padding: '8px' }}>
              {availableThemes.map((theme, index) => (
                <motion.button
                  key={theme.mode}
                  className={`theme-option ${currentTheme === theme.mode ? 'active' : ''}`}
                  onClick={() => handleThemeSelect(theme.mode)}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ x: 4, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  role="option"
                  aria-selected={currentTheme === theme.mode}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '12px 16px',
                    marginBottom: '8px',
                    backgroundColor: currentTheme === theme.mode ? 'var(--background-accent)' : 'var(--background-secondary)',
                    border: currentTheme === theme.mode ? '2px solid var(--primary)' : '1px solid var(--border)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    color: 'var(--foreground)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    flex: 1
                  }}>
                    <span style={{
                      fontSize: '24px',
                      lineHeight: 1
                    }}>{theme.icon}</span>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                      flex: 1
                    }}>
                      <span style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: 'var(--foreground)',
                        lineHeight: 1
                      }}>{theme.displayName}</span>
                      <span style={{
                        fontSize: '11px',
                        color: 'var(--foreground-tertiary)',
                        lineHeight: 1
                      }}>{theme.description}</span>
                    </div>
                  </div>
                  
                  {/* Theme preview */}
                  <div style={{
                    display: 'flex',
                    gap: '4px',
                    alignItems: 'center'
                  }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      border: '1px solid rgba(0,0,0,0.1)',
                      backgroundColor: getThemeColors(theme.mode).bg
                    }}></div>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      border: '1px solid rgba(0,0,0,0.1)',
                      backgroundColor: getThemeColors(theme.mode).primary
                    }}></div>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      border: '1px solid rgba(0,0,0,0.1)',
                      backgroundColor: getThemeColors(theme.mode).secondary
                    }}></div>
                  </div>
                  
                  {/* Check mark for active theme */}
                  {currentTheme === theme.mode && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500 }}
                      style={{
                        width: '20px',
                        height: '20px',
                        backgroundColor: 'var(--success)',
                        color: 'white',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        flexShrink: 0
                      }}
                    >
                      ✓
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </div>
            
            <div className="theme-selector-footer">
              <span className="theme-tip">
                💡 Tip: Press 'T' to cycle through themes quickly
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ThemeSelector;