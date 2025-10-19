import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { Email, emailService, SuggestedReply, EmailContext } from '../services/api';

// Inline styles to avoid CSS file issues
const styles = {
  overlay: {
    position: 'fixed' as const,
    inset: '0',
    background: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(4px)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  modal: {
    background: 'white',
    borderRadius: '16px',
    width: '90vw',
    maxWidth: '800px',
    maxHeight: '80vh',
    overflow: 'hidden' as const,
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
    display: 'flex',
    flexDirection: 'column' as const
  },
  header: {
    padding: '1.5rem 2rem',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    position: 'relative' as const
  },
  closeButton: {
    position: 'absolute' as const,
    top: '1rem',
    right: '1rem',
    background: 'rgba(255, 255, 255, 0.2)',
    border: 'none',
    color: 'white',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }
};

interface ReplySuggestionsProps {
  email: Email | null;
  isOpen: boolean;
  onClose: () => void;
  onReplySelect: (reply: string) => void;
}

const ReplySuggestions: React.FC<ReplySuggestionsProps> = ({
  email,
  isOpen,
  onClose,
  onReplySelect
}) => {
  const [suggestions, setSuggestions] = useState<SuggestedReply[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && email) {
      generateSuggestions();
    }
  }, [isOpen, email]);

  const generateSuggestions = async () => {
    if (!email) return;

    setLoading(true);
    try {
      const emailContext: EmailContext = {
        subject: email._source.subject,
        body: email._source.body,
        from: email._source.from,
        to: email._source.to,
        date: email._source.date
      };

      const replySuggestions = await emailService.generateReplySuggestions(emailContext);
      setSuggestions(replySuggestions);
      
      if (replySuggestions.length > 0) {
        toast.success(`Generated ${replySuggestions.length} reply suggestions`);
      } else {
        toast.info('No reply suggestions available for this email');
      }
    } catch (error: any) {
      console.error('Failed to generate suggestions:', error);
      toast.error(`Failed to generate suggestions: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: SuggestedReply) => {
    setSelectedSuggestion(suggestion.id);
  };

  const handleUseReply = (content: string) => {
    onReplySelect(content);
    onClose();
    toast.success('Reply suggestion applied!');
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return '#10b981';
    if (confidence >= 0.6) return '#f59e0b';
    return '#ef4444';
  };

  const getToneEmoji = (tone: string) => {
    switch (tone) {
      case 'professional': return '💼';
      case 'friendly': return '😊';
      case 'formal': return '🎩';
      default: return '💬';
    }
  };

  const getCategoryEmoji = (category: string) => {
    switch (category) {
      case 'job_interview': return '👔';
      case 'meeting': return '📅';
      case 'sales_demo': return '📈';
      case 'technical_support': return '🔧';
      case 'collaboration': return '🤝';
      case 'acknowledgment': return '✅';
      case 'confirmation': return '📋';
      default: return '📧';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        style={styles.overlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          style={styles.modal}
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={styles.header}>
            <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: '700' }}>🤖 AI-Powered Reply Suggestions</h2>
            <p style={{ margin: '0', opacity: '0.9', fontSize: '0.9rem' }}>
              Contextual replies generated using RAG
            </p>
            <button style={styles.closeButton} onClick={onClose}>
              ✕
            </button>
          </div>

          <div className="modal-content">
            {loading ? (
              <div className="loading-state">
                <motion.div
                  className="loading-spinner"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  🔄
                </motion.div>
                <p>Generating intelligent reply suggestions...</p>
              </div>
            ) : suggestions.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🤔</div>
                <p>No suggestions available</p>
                <button className="retry-button" onClick={generateSuggestions}>
                  🔄 Try Again
                </button>
              </div>
            ) : (
              <div className="suggestions-list">
                {suggestions.map((suggestion, index) => (
                  <motion.div
                    key={suggestion.id}
                    className={`suggestion-card ${
                      selectedSuggestion === suggestion.id ? 'selected' : ''
                    }`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <div className="suggestion-header">
                      <div className="suggestion-meta">
                        <span className="category-badge">
                          {getCategoryEmoji(suggestion.metadata.category)}
                          {suggestion.metadata.category}
                        </span>
                        <span className="tone-badge">
                          {getToneEmoji(suggestion.metadata.tone)}
                          {suggestion.metadata.tone}
                        </span>
                      </div>
                      <div 
                        className="confidence-indicator"
                        style={{ 
                          backgroundColor: getConfidenceColor(suggestion.confidence)
                        }}
                      >
                        {Math.round(suggestion.confidence * 100)}%
                      </div>
                    </div>

                    <div className="suggestion-content">
                      {suggestion.content}
                    </div>

                    <div className="suggestion-footer">
                      <div className="suggestion-info">
                        <span className="response-time">
                          ⏱️ {suggestion.metadata.estimated_response_time}
                        </span>
                        {suggestion.metadata.action_required && (
                          <span className="action-required">⚡ Action Required</span>
                        )}
                      </div>
                      <button
                        className="use-reply-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUseReply(suggestion.content);
                        }}
                      >
                        Use This Reply
                      </button>
                    </div>

                    {selectedSuggestion === suggestion.id && (
                      <motion.div
                        className="suggestion-details"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                      >
                        <div className="reasoning">
                          <strong>AI Reasoning:</strong>
                          <p>{suggestion.context.reasoning}</p>
                        </div>
                        {suggestion.context.relevantKnowledge.length > 0 && (
                          <div className="knowledge-used">
                            <strong>Knowledge Sources:</strong>
                            <ul>
                              {suggestion.context.relevantKnowledge.slice(0, 2).map((item, i) => (
                                <li key={i}>{item.content?.substring(0, 80)}...</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button className="regenerate-button" onClick={generateSuggestions}>
              🔄 Generate New Suggestions
            </button>
            <button className="cancel-button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ReplySuggestions;