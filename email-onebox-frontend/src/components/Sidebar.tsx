import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';

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
  // Using modern theme-aware sidebar design

  const folders = [
    { id: 'inbox', name: 'Inbox', icon: '📧', count: 12, primary: true },
    { id: 'starred', name: 'Starred', icon: '⭐', count: 5 },
    { id: 'sent', name: 'Sent', icon: '📤', count: 0 },
    { id: 'drafts', name: 'Drafts', icon: '📝', count: 3 },
    { id: 'archive', name: 'Archive', icon: '🗄️', count: 0 },
    { id: 'trash', name: 'Trash', icon: '🗑️', count: 0 },
  ];

  const quickActions = [
    { id: 'unread', name: 'Unread Only', icon: '🔵', filter: true },
    { id: 'today', name: 'Today', icon: '📅', filter: true },
    { id: 'attachments', name: 'With Attachments', icon: '📎', filter: true },
    { id: 'important', name: 'Important', icon: '❗', filter: true },
  ];

  const accounts = [
    { id: 'work', name: 'work@company.com', icon: '🏢', active: true },
    { id: 'personal', name: 'personal@email.com', icon: '👤', active: false },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            className="sidebar-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            transition={{ duration: 0.2 }}
          />
          
          <motion.aside 
            className="modern-sidebar"
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <div className="sidebar-header">
              <div className="sidebar-brand">
                <div className="brand-icon">📧</div>
                <div className="brand-info">
                  <h2 className="brand-title">MailBox</h2>
                  <span className="brand-subtitle">Professional Email</span>
                </div>
              </div>
              <motion.button 
                className="sidebar-close"
                onClick={onClose}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
              >
                ✕
              </motion.button>
            </div>

            <div className="sidebar-content">
              <motion.button 
                className="compose-button"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <span className="compose-icon">✏️</span>
                <span className="compose-text">Compose Email</span>
              </motion.button>

              <div className="sidebar-section">
                <h3 className="section-title">Email Accounts</h3>
                <div className="section-content">
                  {accounts.map((account, index) => (
                    <motion.div
                      key={account.id}
                      className={`account-item ${account.active ? 'active' : ''}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="account-avatar">{account.icon}</div>
                      <div className="account-info">
                        <span className="account-email">{account.name}</span>
                        {account.active && <span className="account-status">Active</span>}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="sidebar-section">
                <h3 className="section-title">Folders</h3>
                <div className="section-content">
                  {folders.map((folder, index) => (
                    <motion.button
                      key={folder.id}
                      className={`folder-item ${selectedFolder === folder.id ? 'selected' : ''} ${folder.primary ? 'primary' : ''}`}
                      onClick={() => onFolderSelect(folder.id)}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ x: 4, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="folder-content">
                        <span className="folder-icon">{folder.icon}</span>
                        <span className="folder-name">{folder.name}</span>
                      </div>
                      {folder.count > 0 && (
                        <motion.span 
                          className="folder-count"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 500 }}
                        >
                          {folder.count}
                        </motion.span>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="sidebar-section">
                <h3 className="section-title">Quick Filters</h3>
                <div className="section-content">
                  {quickActions.map((action, index) => (
                    <motion.button
                      key={action.id}
                      className="filter-item"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ x: 4, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="filter-content">
                        <span className="filter-icon">{action.icon}</span>
                        <span className="filter-name">{action.name}</span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="sidebar-footer">
                <div className="storage-info">
                  <div className="storage-header">
                    <span className="storage-title">📊 Storage</span>
                    <span className="storage-usage">2.1 GB / 15 GB</span>
                  </div>
                  <div className="storage-bar">
                    <motion.div 
                      className="storage-fill"
                      initial={{ width: 0 }}
                      animate={{ width: "14%" }}
                      transition={{ delay: 0.5, duration: 1 }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default Sidebar;