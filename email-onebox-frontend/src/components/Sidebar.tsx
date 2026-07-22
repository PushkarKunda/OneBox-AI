import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
          (email._id?.length || 0) % 5 === 0
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

  // Derive dynamic account list
  const dynamicAccountSet = new Set<string>();
  if (emails && Array.isArray(emails)) {
    emails.forEach(e => {
      if (e._source?.account) {
        dynamicAccountSet.add(e._source.account);
      }
    });
  }

  const accountList = [
    { id: '', name: 'All Accounts', icon: '📧', active: selectedAccount === '' },
    ...Array.from(dynamicAccountSet).map(acc => ({
      id: acc,
      name: acc,
      icon: acc.includes('gmail') ? '🔴' : acc.includes('onebox') ? '⚡' : '💼',
      active: selectedAccount === acc
    }))
  ];

  // Derive AI category counts
  const getCategoryCount = (categoryName: string) => {
    if (!emails || !Array.isArray(emails)) return 0;
    return emails.filter(e => e._source?.category === categoryName).length;
  };

  const aiCategories = [
    { id: 'cat:Interested', name: 'Interested', icon: '🟢', count: getCategoryCount('Interested'), color: '#10b981' },
    { id: 'cat:Meeting Booked', name: 'Meeting Booked', icon: '📅', count: getCategoryCount('Meeting Booked'), color: '#8b5cf6' },
    { id: 'cat:Out of Office', name: 'Out of Office', icon: '🏖️', count: getCategoryCount('Out of Office'), color: '#06b6d4' },
    { id: 'cat:Not Interested', name: 'Not Interested', icon: '✋', count: getCategoryCount('Not Interested'), color: '#f59e0b' },
    { id: 'cat:Spam', name: 'Spam', icon: '🚫', count: getCategoryCount('Spam'), color: '#ef4444' },
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
                <div className="brand-icon">⚡</div>
                <div className="brand-info">
                  <h2 className="brand-title">OneBox AI</h2>
                  <span className="brand-subtitle">Smart Inbox Workspace</span>
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
                  {accountList.map((account, index) => (
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
                <h3 className="section-title">🤖 AI Categories</h3>
                <div className="section-content">
                  {aiCategories.map((cat, index) => (
                    <motion.button
                      key={cat.id}
                      className={`filter-item ${activeFilter === cat.id ? 'active' : ''}`}
                      onClick={() => onQuickFilter(cat.id)}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ x: 4, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="filter-content">
                        <span className="filter-icon">{cat.icon}</span>
                        <span className="filter-name">{cat.name}</span>
                      </div>
                      {cat.count > 0 && (
                        <span 
                          className="folder-count" 
                          style={{ backgroundColor: cat.color + '25', color: cat.color }}
                        >
                          {cat.count}
                        </span>
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