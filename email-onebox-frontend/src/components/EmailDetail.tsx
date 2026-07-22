import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { Email } from '../services/api';
import ReplySuggestions from './ReplySuggestions';
import ReadingTime from './ReadingTime';
import ScrollProgress from './ScrollProgress';
import { getSenderColorTheme, getSenderAvatarColor, getSenderInitials, getProviderColor } from '../utils/colorUtils';

interface EmailDetailProps {
  email: Email | null;
}

const EmailDetail: React.FC<EmailDetailProps> = ({ email }) => {
  const [showReplySuggestions, setShowReplySuggestions] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showReplyComposer, setShowReplyComposer] = useState(false);
  const emailBodyRef = React.useRef<HTMLDivElement>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Enhanced email content processing
  const processedEmailContent = useMemo(() => {
    if (!email?._source?.body) return [];
    
    let content = email._source.body;
    
    // Remove HTML tags but preserve structure
    content = content.replace(/<br\s*\/?>/gi, '\n');
    content = content.replace(/<\/p>/gi, '\n\n');
    content = content.replace(/<p[^>]*>/gi, '');
    content = content.replace(/<[^>]+>/g, '');
    
    // Decode HTML entities
    content = content.replace(/&nbsp;/g, ' ');
    content = content.replace(/&amp;/g, '&');
    content = content.replace(/&lt;/g, '<');
    content = content.replace(/&gt;/g, '>');
    content = content.replace(/&quot;/g, '"');
    content = content.replace(/&#39;/g, "'");
    
    // Split into paragraphs
    const paragraphs = content.split('\n\n').filter(p => p.trim());
    
    return paragraphs.map((paragraph, index) => {
      const trimmed = paragraph.trim();
      if (!trimmed) return null;
      
      // Detect if paragraph contains code (simple heuristic)
      const isCode = /^[\s]*[{<]|function\s|class\s|import\s|export\s|const\s|let\s|var\s|if\s*\(|for\s*\(|while\s*\(/.test(trimmed) ||
                    (trimmed.includes('```') || trimmed.includes('```') ||
                    (trimmed.split('\n').length > 3 && trimmed.includes(';') && trimmed.includes('{')));
      
      // Detect if paragraph is a quote
      const isQuote = trimmed.startsWith('>') || (trimmed.startsWith('On ') && trimmed.includes(' wrote:'));
      
      // Detect links
      const linkRegex = /(https?:\/\/[^\s]+)/g;
      const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
      
      let processedParagraph = trimmed;
      
      // Convert URLs to clickable links
      processedParagraph = processedParagraph.replace(linkRegex, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
      
      // Convert email addresses to clickable links
      processedParagraph = processedParagraph.replace(emailRegex, '<a href="mailto:$1">$1</a>');
      
      return {
        id: index,
        content: processedParagraph,
        isCode,
        isQuote,
        originalText: trimmed
      };
    }).filter((p): p is NonNullable<typeof p> => p !== null);
  }, [email?._source?.body]);

  if (!email) {
    return (
      <div className="email-detail empty">
        <div className="no-selection">
          <h2>📧 Email Onebox</h2>
          <p>Select an email from the list to view details</p>
        </div>
      </div>
    );
  }

  const handleOpenReplySuggestions = () => {
    setShowReplySuggestions(true);
  };

  const handleCloseSuggestions = () => {
    setShowReplySuggestions(false);
  };

  const handleReplySelect = (selectedReply: string) => {
    setReplyText(selectedReply);
    setShowReplyComposer(true);
  };

  const handleSendReply = () => {
    // In a real implementation, this would send the email
    toast.success('Reply sent successfully! (Demo mode)');
    setReplyText('');
    setShowReplyComposer(false);
  };

  const senderTheme = getSenderColorTheme(email._source?.from || '');
  const accountColor = getProviderColor(email._source?.account || '');
  const initials = getSenderInitials(email._source?.from || '');

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
        className="px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 border shadow-sm ml-2"
        style={{ backgroundColor: style.bg, color: style.color, borderColor: style.border }}
      >
        <span>{style.icon}</span> {category}
      </span>
    );
  };

  return (
    <div className="email-detail">
      <ScrollProgress target={emailBodyRef as React.RefObject<HTMLElement>} />
      <div className="email-detail-header" style={{ borderTopColor: senderTheme.primary, borderTopWidth: '4px', borderTopStyle: 'solid' }}>
        <div className="email-subject-header flex items-center justify-between">
          <div className="flex items-center flex-wrap gap-2">
            <h2 className="email-detail-subject" style={{ color: senderTheme.text }}>{email._source?.subject || 'No Subject'}</h2>
            {getCategoryBadge((email._source as any)?.category)}
          </div>
          <ReadingTime text={email._source?.body || ''} className="email-reading-time" />
        </div>
        <div className="email-detail-meta">
          <div className="email-detail-from">
            <strong>From:</strong> 
            <span className="email-from-value" style={{ backgroundColor: senderTheme.secondary, color: senderTheme.text, borderColor: senderTheme.border }}>
              <span 
                style={{
                  display: 'inline-block',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: getSenderAvatarColor(email._source?.from || ''),
                  color: 'white',
                  fontSize: '10px',
                  textAlign: 'center',
                  lineHeight: '20px',
                  marginRight: '8px',
                  fontWeight: 'bold'
                }}
              >
                {initials}
              </span>
              {email._source?.from || 'Unknown'}
            </span>
          </div>
          <div className="email-detail-to">
            <strong>To:</strong> 
            <span className="email-to-value">
              {Array.isArray(email._source?.to) ? email._source.to.join(', ') : (email._source?.to || 'Unknown')}
            </span>
          </div>
          <div className="email-detail-date">
            <strong>Date:</strong> 
            <span className="email-date-value">
              {email._source?.date ? formatDate(email._source.date) : 'Unknown'}
            </span>
          </div>
          <div className="email-detail-account">
            <strong>Account:</strong> 
            <span className="email-account-value" style={{ backgroundColor: accountColor, color: 'white' }}>
              {email._source?.account || 'Unknown'}
            </span>
          </div>
          {email._source?.boxName && (
            <div className="email-detail-box">
              <strong>Folder:</strong> 
              <span className="email-folder-value">
                {email._source.boxName}
              </span>
            </div>
          )}
        </div>
        
        <div className="email-actions" style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <motion.button
            onClick={handleOpenReplySuggestions}
            style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              color: 'white',
              border: 'none',
              padding: '0.6rem 1.2rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
            }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
          >
            ⚡ Smart AI Reply (RAG)
          </motion.button>
          
          <motion.button
            onClick={() => setShowReplyComposer(!showReplyComposer)}
            style={{
              background: '#10b981',
              color: 'white',
              border: 'none',
              padding: '0.6rem 1.2rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '600',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
            }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
          >
            ✍️ Reply
          </motion.button>
        </div>
      </div>
      
      <div className="email-detail-body" ref={emailBodyRef}>
        <div className="email-body-content">
          {processedEmailContent.length > 0 ? (
            processedEmailContent.map((paragraph) => {
              if (paragraph.isCode) {
                return (
                  <motion.pre
                    key={paragraph.id}
                    className="email-code-block"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: paragraph.id * 0.1 }}
                  >
                    <code>{paragraph.originalText}</code>
                  </motion.pre>
                );
              } else if (paragraph.isQuote) {
                return (
                  <motion.blockquote
                    key={paragraph.id}
                    className="email-quote"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: paragraph.id * 0.1 }}
                    dangerouslySetInnerHTML={{ __html: paragraph.content }}
                  />
                );
              } else {
                return (
                  <motion.p
                    key={paragraph.id}
                    className="email-paragraph"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: paragraph.id * 0.1 }}
                    dangerouslySetInnerHTML={{ __html: paragraph.content }}
                  />
                );
              }
            })
          ) : (
            <div className="email-no-content">
              <p>📭 No content available</p>
            </div>
          )}
        </div>
      </div>
      
      {showReplyComposer && (
        <motion.div
          className="reply-composer"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          style={{
            borderTop: '1px solid #e5e7eb',
            padding: '1rem',
            background: '#f9fafb'
          }}
        >
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>✍️ Reply</h3>
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Type your reply here..."
            style={{
              width: '100%',
              height: '150px',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '0.9rem',
              resize: 'vertical' as const,
              fontFamily: 'inherit'
            }}
          />
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <motion.button
              onClick={handleOpenReplySuggestions}
              style={{
                background: '#6366f1',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              🤖 Get AI Suggestions
            </motion.button>
            <motion.button
              onClick={() => setShowReplyComposer(false)}
              style={{
                background: '#6b7280',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Cancel
            </motion.button>
            <motion.button
              onClick={handleSendReply}
              style={{
                background: '#10b981',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: '600'
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              📤 Send Reply
            </motion.button>
          </div>
        </motion.div>
      )}
      
      <ReplySuggestions
        email={email}
        isOpen={showReplySuggestions}
        onClose={handleCloseSuggestions}
        onReplySelect={handleReplySelect}
      />
    </div>
  );
};

export default EmailDetail;