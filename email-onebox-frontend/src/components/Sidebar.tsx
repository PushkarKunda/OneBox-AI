import React from 'react';
import { motion } from 'framer-motion';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFolder: string;
  onFolderSelect: (folder: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onClose, 
  selectedFolder, 
  onFolderSelect 
}) => {
  const folders = [
    { id: 'inbox', name: 'Inbox', icon: '📥', count: 12, color: '#4f46e5' },
    { id: 'starred', name: 'Starred', icon: '⭐', count: 5, color: '#f59e0b' },
    { id: 'sent', name: 'Sent', icon: '📤', count: 0, color: '#10b981' },
    { id: 'drafts', name: 'Drafts', icon: '✏️', count: 3, color: '#6b7280' },
    { id: 'archive', name: 'Archive', icon: '🗄', count: 0, color: '#8b5cf6' },
    { id: 'trash', name: 'Trash', icon: '🗑️', count: 0, color: '#ef4444' },
  ];

  const labels = [
    { id: 'work', name: 'Work', color: '#3b82f6' },
    { id: 'personal', name: 'Personal', color: '#10b981' },
    { id: 'important', name: 'Important', color: '#f59e0b' },
    { id: 'travel', name: 'Travel', color: '#8b5cf6' },
  ];

  return (
    <>
      {isOpen && (
        <motion.div 
          className="sidebar-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />
      )}
      
      <motion.aside 
        className={`sidebar ${isOpen ? 'open' : ''}`}
        initial={{ x: -280 }}
        animate={{ x: isOpen ? 0 : -280 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="sidebar-content">
          <motion.button 
            className="compose-btn"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            ➕ Compose
          </motion.button>

          <div className="sidebar-section">
            <h3 className="sidebar-title">Folders</h3>
            <nav className="sidebar-nav">
              {folders.map((folder) => {
                return (
                  <motion.button
                    key={folder.id}
                    className={`sidebar-item ${selectedFolder === folder.id ? 'active' : ''}`}
                    onClick={() => onFolderSelect(folder.id)}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="sidebar-item-content">
                      <span style={{ color: folder.color, fontSize: '18px' }}>
                        {folder.icon}
                      </span>
                      <span className="sidebar-item-text">{folder.name}</span>
                    </div>
                    {folder.count > 0 && (
                      <motion.span 
                        className="sidebar-count"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        style={{ backgroundColor: folder.color }}
                      >
                        {folder.count}
                      </motion.span>
                    )}
                  </motion.button>
                );
              })}
            </nav>
          </div>

          <div className="sidebar-section">
            <h3 className="sidebar-title">Labels</h3>
            <nav className="sidebar-nav">
              {labels.map((label) => (
                <motion.button
                  key={label.id}
                  className="sidebar-item label-item"
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="sidebar-item-content">
                    <span style={{ color: label.color, fontSize: '16px' }}>
                      🏷️
                    </span>
                    <span className="sidebar-item-text">{label.name}</span>
                  </div>
                </motion.button>
              ))}
            </nav>
          </div>

          <div className="sidebar-section">
            <h3 className="sidebar-title">Quick Filters</h3>
            <nav className="sidebar-nav">
              <motion.button
                className="sidebar-item filter-item"
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="sidebar-item-content">
                  <span style={{ fontSize: '16px' }}>💭</span>
                  <span className="sidebar-item-text">Unread</span>
                </div>
              </motion.button>
              <motion.button
                className="sidebar-item filter-item"
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="sidebar-item-content">
                  <span style={{ fontSize: '16px' }}>📁</span>
                  <span className="sidebar-item-text">Today</span>
                </div>
              </motion.button>
            </nav>
          </div>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;