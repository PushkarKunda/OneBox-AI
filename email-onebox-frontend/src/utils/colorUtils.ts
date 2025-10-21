// Utility functions for assigning colors to different users and accounts

// Predefined color palette for different users/accounts
export interface ColorTheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  border: string;
  text: string;
}

// Color themes for different accounts/senders
export const colorThemes: ColorTheme[] = [
  {
    primary: '#3B82F6', // Blue
    secondary: '#EFF6FF',
    accent: '#1D4ED8',
    background: '#F0F9FF',
    border: '#93C5FD',
    text: '#1E3A8A'
  },
  {
    primary: '#10B981', // Green
    secondary: '#ECFDF5',
    accent: '#059669',
    background: '#F0FDF4',
    border: '#86EFAC',
    text: '#064E3B'
  },
  {
    primary: '#F59E0B', // Orange
    secondary: '#FFFBEB',
    accent: '#D97706',
    background: '#FEFCE8',
    border: '#FCD34D',
    text: '#92400E'
  },
  {
    primary: '#EF4444', // Red
    secondary: '#FEF2F2',
    accent: '#DC2626',
    background: '#FFF1F2',
    border: '#FCA5A5',
    text: '#991B1B'
  },
  {
    primary: '#8B5CF6', // Purple
    secondary: '#FAF5FF',
    accent: '#7C3AED',
    background: '#FDFCEF',
    border: '#C4B5FD',
    text: '#5B21B6'
  },
  {
    primary: '#06B6D4', // Cyan
    secondary: '#ECFEFF',
    accent: '#0891B2',
    background: '#F0FDFA',
    border: '#67E8F9',
    text: '#164E63'
  },
  {
    primary: '#EC4899', // Pink
    secondary: '#FDF2F8',
    accent: '#DB2777',
    background: '#FEF7FF',
    border: '#F9A8D4',
    text: '#9D174D'
  },
  {
    primary: '#84CC16', // Lime
    secondary: '#F7FEE7',
    accent: '#65A30D',
    background: '#FCFFF7',
    border: '#BEF264',
    text: '#365314'
  }
];

// Hash function to consistently assign colors based on string input
const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

// Get color theme for an email account
export const getAccountColorTheme = (account: string): ColorTheme => {
  const index = hashString(account) % colorThemes.length;
  return colorThemes[index];
};

// Get color theme for a sender email address
export const getSenderColorTheme = (fromEmail: string): ColorTheme => {
  // Extract email from "Name <email@domain.com>" format
  const emailMatch = fromEmail.match(/<([^>]+)>/);
  const email = emailMatch ? emailMatch[1] : fromEmail;
  
  const index = hashString(email) % colorThemes.length;
  return colorThemes[index];
};

// Get avatar background color for sender
export const getSenderAvatarColor = (fromEmail: string): string => {
  const theme = getSenderColorTheme(fromEmail);
  return `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`;
};

// Get initials from sender name/email
export const getSenderInitials = (fromEmail: string): string => {
  // Try to extract name first
  const nameMatch = fromEmail.match(/^([^<]+)</);
  if (nameMatch) {
    const name = nameMatch[1].trim();
    const words = name.split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
  
  // If no name, use email
  const emailMatch = fromEmail.match(/<([^>]+)>/);
  const email = emailMatch ? emailMatch[1] : fromEmail;
  const localPart = email.split('@')[0];
  return localPart.substring(0, 2).toUpperCase();
};

// Get CSS variables for a color theme
export const getThemeCSSVars = (theme: ColorTheme): Record<string, string> => {
  return {
    '--email-primary': theme.primary,
    '--email-secondary': theme.secondary,
    '--email-accent': theme.accent,
    '--email-background': theme.background,
    '--email-border': theme.border,
    '--email-text': theme.text,
  };
};

// Predefined account colors for known email providers
export const getProviderColor = (account: string): string => {
  const domain = account.toLowerCase();
  
  if (domain.includes('gmail') || domain.includes('google')) {
    return '#EA4335'; // Google Red
  } else if (domain.includes('outlook') || domain.includes('hotmail') || domain.includes('live')) {
    return '#0078D4'; // Microsoft Blue
  } else if (domain.includes('yahoo')) {
    return '#6001D2'; // Yahoo Purple
  } else if (domain.includes('apple') || domain.includes('icloud')) {
    return '#007AFF'; // Apple Blue
  } else if (domain.includes('proton')) {
    return '#6D4AFF'; // ProtonMail Purple
  }
  
  // Fallback to hash-based color
  return getAccountColorTheme(account).primary;
};