import React from 'react';
import { motion } from 'framer-motion';
import { Email } from '../services/api';
import { getSenderColorTheme, getSenderAvatarColor, getSenderInitials, getProviderColor } from '../utils/colorUtils';

interface EmailListProps {
  emails: Email[];
  onEmailSelect: (email: Email) => void;
  selectedEmailId?: string;
}

const EmailList: React.FC<EmailListProps> = ({ emails, onEmailSelect, selectedEmailId }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (emails.length === 0) {
    return (
      <div className="email-list empty">
        <p>No emails found. Try searching or check if your backend is running.</p>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 30
      }
    }
  };

  const getEmailPriority = (email: Email) => {
    // Simulated priority logic - in real app this would come from email data
    const subject = email._source?.subject?.toLowerCase() || '';
    if (subject.includes('urgent') || subject.includes('important')) {
      return 'high';
    }
    if (subject.includes('reminder') || subject.includes('follow up')) {
      return 'medium';
    }
    return 'normal';
  };

  const isUnread = (email: Email) => {
    // Simulated unread logic - in real app this would come from email data
    return Math.random() > 0.6;
  };

  const hasAttachment = (email: Email) => {
    // Simulated attachment logic - in real app this would come from email data
    return Math.random() > 0.8;
  };

  return (
    <motion.div 
      className="email-list"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {emails.map((email, index) => {
        const priority = getEmailPriority(email);
        const unread = isUnread(email);
        const attachment = hasAttachment(email);
        const senderTheme = getSenderColorTheme(email._source?.from || '');
        const accountColor = getProviderColor(email._source?.account || '');
        const initials = getSenderInitials(email._source?.from || '');
        
        return (
          <motion.div
            key={email._id}
            variants={itemVariants}
            className={`email-item ${selectedEmailId === email._id ? 'selected' : ''} ${unread ? 'unread' : 'read'} priority-${priority}`}
            onClick={() => onEmailSelect(email)}
            style={{
              borderLeftColor: senderTheme.primary,
              borderLeftWidth: '4px',
              borderLeftStyle: 'solid'
            }}
            whileHover={{ 
              scale: 1.02,
              transition: { duration: 0.2 }
            }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="email-status-indicators">
              {unread && (
                <motion.div 
                  className="unread-indicator"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                />
              )}
              {priority === 'high' && (
                <motion.div 
                  className="priority-indicator high"
                  initial={{ rotate: -45, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1 + 0.2 }}
                >
                  !
                </motion.div>
              )}
            </div>
            
            <div className="email-content">
              <div className="email-header">
                <div className="email-from">
                  <div className="from-info">
                    <div 
                      className="avatar"
                      style={{
                        background: getSenderAvatarColor(email._source?.from || ''),
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '0.75rem'
                      }}
                    >
                      {initials}
                    </div>
                    <strong className={unread ? 'unread-text' : ''} style={{ color: senderTheme.text }}>
                      {email._source?.from?.split('<')[0]?.trim() || 'Unknown Sender'}
                    </strong>
                  </div>
                  <div className="email-meta">
                    <span className="email-time">
                      🕕 {formatDate(email._source?.date || '')}
                    </span>
                    {attachment && (
                      <motion.span 
                        className="attachment-indicator"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.1 + 0.3 }}
                      >
                        📎
                      </motion.span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className={`email-subject ${unread ? 'unread-text' : ''}`}>
                {truncateText(email._source?.subject || 'No Subject', 60)}
              </div>
              
              <div className="email-preview">
                {truncateText((email._source?.body || '').replace(/<[^>]*>/g, ''), 100)}
              </div>
              
              <div className="email-footer">
                <span 
                  className="email-account"
                  style={{
                    backgroundColor: accountColor + '20', // 20% opacity
                    color: accountColor,
                    borderColor: accountColor + '40' // 40% opacity
                  }}
                >
                  📧 {email._source?.account || 'Unknown'}
                </span>
                <div className="email-actions">
                  <motion.button
                    className="star-btn"
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle star toggle
                    }}
                  >
                    ⭐
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
};

export default EmailList;