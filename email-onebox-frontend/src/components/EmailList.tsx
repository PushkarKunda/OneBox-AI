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

  const getCategoryBadge = (category?: string) => {
    if (!category || category === 'Uncategorized') return null;
    
    const config: Record<string, { icon: string; bg: string; color: string; border: string }> = {
      'Interested': { icon: '🟢', bg: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: 'rgba(16, 185, 129, 0.3)' },
      'Meeting Booked': { icon: '📅', bg: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa', border: 'rgba(139, 92, 246, 0.3)' },
      'Out of Office': { icon: '🏖️', bg: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee', border: 'rgba(6, 182, 212, 0.3)' },
      'Not Interested': { icon: '✋', bg: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)' },
      'Spam': { icon: '🚫', bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: 'rgba(239, 68, 68, 0.3)' },
    };

    const style = config[category] || { icon: '🏷️', bg: 'rgba(148, 163, 184, 0.15)', color: '#cbd5e1', border: 'rgba(148, 163, 184, 0.3)' };

    return (
      <span 
        className="px-2 py-0.5 rounded-full text-[11px] font-semibold inline-flex items-center gap-1 border shadow-sm"
        style={{ backgroundColor: style.bg, color: style.color, borderColor: style.border }}
      >
        <span>{style.icon}</span> {category}
      </span>
    );
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
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { y: 15, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 350,
        damping: 25
      }
    }
  };

  const getEmailPriority = (email: Email) => {
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
    return (email._id?.length || 0) % 3 === 0;
  };

  const hasAttachment = (email: Email) => {
    return email._source?.body?.toLowerCase().includes('attachment') || (email._id?.length || 0) % 4 === 0;
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
              scale: 1.01,
              transition: { duration: 0.15 }
            }}
            whileTap={{ scale: 0.99 }}
          >
            <div className="email-status-indicators">
              {unread && (
                <motion.div 
                  className="unread-indicator"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                />
              )}
              {priority === 'high' && (
                <motion.div 
                  className="priority-indicator high"
                  initial={{ rotate: -45, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
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
                      <span className="attachment-indicator">
                        📎
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className={`email-subject ${unread ? 'unread-text' : ''}`}>
                {truncateText(email._source?.subject || 'No Subject', 65)}
              </div>
              
              <div className="email-preview">
                {truncateText((email._source?.body || '').replace(/<[^>]*>/g, ''), 110)}
              </div>
              
              <div className="email-footer flex items-center justify-between mt-2 pt-2 border-t border-slate-800/40">
                <div className="flex items-center gap-2 flex-wrap">
                  <span 
                    className="email-account"
                    style={{
                      backgroundColor: accountColor + '20',
                      color: accountColor,
                      borderColor: accountColor + '40'
                    }}
                  >
                    📧 {email._source?.account || 'Inbox'}
                  </span>
                  {getCategoryBadge((email._source as any)?.category)}
                </div>
                <div className="email-actions">
                  <motion.button
                    className="star-btn text-slate-400 hover:text-amber-400"
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
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