import React from 'react';

interface ReadingTimeProps {
  text: string;
  className?: string;
}

const ReadingTime: React.FC<ReadingTimeProps> = ({ text, className = '' }) => {
  const calculateReadingTime = (text: string): number => {
    // Remove HTML tags and decode entities for accurate word count
    const cleanText = text
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    
    const words = cleanText.trim().split(/\s+/).length;
    const wordsPerMinute = 200; // Average reading speed
    const minutes = Math.ceil(words / wordsPerMinute);
    
    return Math.max(1, minutes); // Minimum 1 minute
  };

  const readingTime = calculateReadingTime(text);

  return (
    <span className={`reading-time ${className}`} title={`Estimated reading time: ${readingTime} minute${readingTime !== 1 ? 's' : ''}`}>
      📖 {readingTime} min read
    </span>
  );
};

export default ReadingTime;