import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface ScrollProgressProps {
  target?: React.RefObject<HTMLElement>;
}

const ScrollProgress: React.FC<ScrollProgressProps> = ({ target }) => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const element = target?.current || document.documentElement;
      if (!element) return;

      const scrollTop = element.scrollTop || window.pageYOffset;
      const scrollHeight = element.scrollHeight || document.documentElement.scrollHeight;
      const clientHeight = element.clientHeight || window.innerHeight;

      const scrolled = (scrollTop / (scrollHeight - clientHeight)) * 100;
      
      setScrollProgress(Math.min(Math.max(scrolled, 0), 100));
      setIsVisible(scrolled > 5); // Show after 5% scroll
    };

    const element = target?.current;
    if (element) {
      element.addEventListener('scroll', handleScroll);
      return () => element.removeEventListener('scroll', handleScroll);
    } else {
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [target]);

  return (
    <motion.div
      className="scroll-progress"
      initial={{ opacity: 0 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 0.3 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: 'rgba(102, 126, 234, 0.1)',
        zIndex: 1000,
        pointerEvents: 'none'
      }}
    >
      <motion.div
        className="scroll-progress-bar"
        style={{
          height: '100%',
          background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '0 3px 3px 0',
          boxShadow: '0 0 10px rgba(102, 126, 234, 0.3)'
        }}
        animate={{ width: `${scrollProgress}%` }}
        transition={{ duration: 0.1, ease: 'easeOut' }}
      />
    </motion.div>
  );
};

export default ScrollProgress;