import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeMode = 'light' | 'dark' | 'ocean' | 'sunset' | 'forest' | 'minimal';

export interface ThemeConfig {
  name: string;
  mode: ThemeMode;
  displayName: string;
  description: string;
  icon: string;
}

export const availableThemes: ThemeConfig[] = [
  {
    name: 'light',
    mode: 'light',
    displayName: 'Light',
    description: 'Clean and bright',
    icon: '☀️'
  },
  {
    name: 'dark',
    mode: 'dark', 
    displayName: 'Dark',
    description: 'Easy on the eyes',
    icon: '🌙'
  },
  {
    name: 'ocean',
    mode: 'ocean',
    displayName: 'Ocean',
    description: 'Deep blues and waves',
    icon: '🌊'
  },
  {
    name: 'sunset',
    mode: 'sunset',
    displayName: 'Sunset',
    description: 'Warm oranges and pinks',
    icon: '🌅'
  },
  {
    name: 'forest',
    mode: 'forest',
    displayName: 'Forest',
    description: 'Natural greens and browns',
    icon: '🌲'
  },
  {
    name: 'minimal',
    mode: 'minimal',
    displayName: 'Minimal',
    description: 'Clean and simple',
    icon: '⚪'
  }
];

interface ThemeContextType {
  currentTheme: ThemeMode;
  isDarkMode: boolean;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  getThemeConfig: (theme?: ThemeMode) => ThemeConfig;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('theme') as ThemeMode;
    return saved && availableThemes.find(t => t.mode === saved) ? saved : 'ocean';
  });

  useEffect(() => {
    localStorage.setItem('theme', currentTheme);
    document.documentElement.setAttribute('data-theme', currentTheme);
    
    // Add theme class for additional styling
    document.body.className = document.body.className.replace(/theme-\w+/g, '');
    document.body.classList.add(`theme-${currentTheme}`);
  }, [currentTheme]);

  const setTheme = (theme: ThemeMode) => {
    setCurrentTheme(theme);
  };

  const toggleTheme = () => {
    const currentIndex = availableThemes.findIndex(t => t.mode === currentTheme);
    const nextIndex = (currentIndex + 1) % availableThemes.length;
    setCurrentTheme(availableThemes[nextIndex].mode);
  };

  const getThemeConfig = (theme?: ThemeMode): ThemeConfig => {
    return availableThemes.find(t => t.mode === (theme || currentTheme)) || availableThemes[0];
  };

  const isDarkMode = ['dark', 'forest'].includes(currentTheme);

  return (
    <ThemeContext.Provider value={{ 
      currentTheme, 
      isDarkMode, 
      setTheme, 
      toggleTheme, 
      getThemeConfig 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};
