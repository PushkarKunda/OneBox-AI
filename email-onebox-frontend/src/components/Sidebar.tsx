import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFolder: string;
  onFolderSelect: (folder: string) => void;
  selectedAccount: string;
  onAccountSelect: (account: string) => void;
  onQuickFilter: (filter: string) => void;
  onCompose: () => void;
  emails: any[];
  activeFilter: string;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onClose, 
  selectedFolder, 
  onFolderSelect,
  selectedAccount,
  onAccountSelect,
  onQuickFilter,
  onCompose,
  emails,
  activeFilter
}) => {
  // Using modern theme-aware sidebar design

  // Calculate dynamic counts from emails
  const getCountForFolder = (folderId: string) => {
    if (!emails || emails.length === 0) return 0;
    
    switch (folderId) {
      case 'inbox':
        return emails.filter(email => 
          email._source?.boxName?.toLowerCase() === 'inbox' || 
          !email._source?.boxName
        ).length;
      case 'sent':
        return emails.filter(email => 
          email._source?.boxName?.toLowerCase() === 'sent'
        ).length;
      case 'drafts':
        return emails.filter(email => 
          email._source?.boxName?.toLowerCase() === 'drafts'
        ).length;
      case 'starred':
        return emails.filter(email => 
          email._source?.subject?.includes('⭐') || 
          email._source?.subject?.toLowerCase().includes('important') ||
          email._source?.subject?.toLowerCase().includes('urgent') ||
          (email._id?.length || 0) % 5 === 0 // Deterministic "starred" logic
        ).length;
      case 'archive':
        return emails.filter(email => 
          email._source?.boxName?.toLowerCase() === 'archive'
        ).length;
      case 'trash':
        return emails.filter(email => 
          email._source?.boxName?.toLowerCase() === 'trash'
        ).length;
      default:
        return 0;
    }
  };

  const folders = [
    { id: 'inbox', name: 'Inbox', icon: '📧', count: getCountForFolder('inbox'), primary: true },
    { id: 'starred', name: 'Starred', icon: '⭐', count: getCountForFolder('starred') },
    { id: 'sent', name: 'Sent', icon: '📤', count: getCountForFolder('sent') },
    { id: 'drafts', name: 'Drafts', icon: '📝', count: getCountForFolder('drafts') },
    { id: 'archive', name: 'Archive', icon: '🗄️', count: getCountForFolder('archive') },
    { id: 'trash', name: 'Trash', icon: '🗂️', count: getCountForFolder('trash') },
  ];

  const quickActions = [
    { id: 'unread', name: 'Unread Only', icon: '🔵', filter: true },
    { id: 'today', name: 'Today', icon: '📅', filter: true },
    { id: 'attachments', name: 'With Attachments', icon: '📎', filter: true },
    { id: 'important', name: 'Important', icon: '❗', filter: true },
  ];

  const accounts = [
    { id: '', name: 'All Accounts', icon: '📧', active: selectedAccount === '' },
    { id: 'work@company.com', name: 'work@company.com', icon: '🏢', active: selectedAccount === 'work@company.com' },
    { id: 'personal@email.com', name: 'personal@email.com', icon: '👤', active: selectedAccount === 'personal@email.com' },
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
                onClick={onCompose}
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
                    <motion.button
                      key={account.id}
                      className={`account-item ${account.active ? 'active' : ''}`}
                      onClick={() => onAccountSelect(account.id)}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ x: 4, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="account-avatar">{account.icon}</div>
                      <div className="account-info">
                        <span className="account-email">{account.name}</span>
                        {account.active && <span className="account-status">Active</span>}
                      </div>
                    </motion.button>
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
                      className={`filter-item ${activeFilter === action.id ? 'active' : ''}`}
                      onClick={() => onQuickFilter(action.id)}
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
                    <span className="storage-usage">{((emails?.length || 0) * 0.05).toFixed(1)} GB / 15 GB</span>
                  </div>
                  <div className="storage-bar">
                    <motion.div 
                      className="storage-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(((emails?.length || 0) * 0.05 / 15) * 100, 100)}%` }}
                      transition={{ delay: 0.5, duration: 1 }}
                    />
                  </div>
                </div>
                <div className="sidebar-stats">
                  <div className="stat-item">
                    <span className="stat-icon">📧</span>
                    <span className="stat-text">{emails?.length || 0} emails</span>
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