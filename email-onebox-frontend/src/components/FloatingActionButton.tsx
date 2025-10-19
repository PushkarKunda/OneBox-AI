import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FloatingActionButtonProps {
  onCompose: () => void;
  onRefresh: () => void;
  onSearch: () => void;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onCompose,
  onRefresh,
  onSearch
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    { icon: '✏️', label: 'Compose', onClick: onCompose, color: '#10b981' },
    { icon: '↻', label: 'Refresh', onClick: onRefresh, color: '#6366f1' },
    { icon: '🔍', label: 'Search', onClick: onSearch, color: '#f59e0b' },
  ];

  return (
    <div className="fab-container">
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className="fab-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />
            {actions.map((action, index) => (
              <motion.button
                key={action.label}
                className="fab-action"
                style={{ background: action.color }}
                initial={{ scale: 0, y: 0 }}
                animate={{ 
                  scale: 1, 
                  y: -(60 * (index + 1))
                }}
                exit={{ scale: 0, y: 0 }}
                transition={{ 
                  delay: index * 0.1,
                  type: "spring",
                  stiffness: 300,
                  damping: 25
                }}
                onClick={() => {
                  action.onClick();
                  setIsOpen(false);
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <span className="fab-action-icon">{action.icon}</span>
                <span className="fab-action-label">{action.label}</span>
              </motion.button>
            ))}
          </>
        )}
      </AnimatePresence>
      
      <motion.button
        className={`fab-main ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={{ rotate: isOpen ? 45 : 0 }}
        transition={{ duration: 0.2 }}
      >
        +
      </motion.button>
    </div>
  );
};

export default FloatingActionButton;