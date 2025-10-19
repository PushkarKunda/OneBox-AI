import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { emailService } from '../services/api';

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultAccount?: string;
}

const ComposeModal: React.FC<ComposeModalProps> = ({ isOpen, onClose, defaultAccount }) => {
  const [emailData, setEmailData] = useState({
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    body: '',
    priority: 'normal'
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [sending, setSending] = useState(false);
  
  // Prevent body scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!emailData.to || !emailData.subject) {
      toast.error('Please fill in recipient and subject');
      return;
    }

    setSending(true);
    
    try {
      const emailPayload = {
        from: defaultAccount || 'your.email@company.com',
        to: emailData.to,
        cc: emailData.cc || undefined,
        bcc: emailData.bcc || undefined,
        subject: emailData.subject,
        body: emailData.body,
        priority: emailData.priority as 'low' | 'normal' | 'high'
      };
      
      const response = await emailService.sendEmail(emailPayload);
      
      if (response.success) {
        toast.success(`✅ Email sent successfully${emailData.priority === 'high' ? ' with high priority!' : '!'}`);
        setEmailData({ to: '', cc: '', bcc: '', subject: '', body: '', priority: 'normal' });
        setShowAdvanced(false);
        onClose();
      } else {
        throw new Error(response.error || 'Failed to send email');
      }
    } catch (error: any) {
      console.error('Send email error:', error);
      toast.error(`❌ Failed to send email: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setEmailData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
          />
          
          <motion.div 
            className="compose-modal"
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              background: 'white',
              backdropFilter: 'none',
              filter: 'none',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '550px',
              maxHeight: '85vh',
              height: 'auto',
              minHeight: '300px',
              zIndex: 10000,
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
              border: '1px solid #e1e5e9',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              opacity: 1,
              margin: 'auto'
            }}
          >
            <div className="compose-header" style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '24px 24px 16px 24px',
              borderBottom: '1px solid var(--border-color, #e1e5e9)',
              flexShrink: 0,
              backgroundColor: 'transparent',
              filter: 'none'
            }}>
              <h2 style={{ 
                color: 'var(--text-primary)', 
                margin: 0,
                fontSize: '20px',
                fontWeight: '600'
              }}>
                ✏️ Compose Email
              </h2>
              <motion.button 
                onClick={onClose}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </motion.button>
            </div>

            <div style={{ 
              flex: 1, 
              overflow: 'auto',
              padding: '0 24px',
              backgroundColor: 'transparent',
              filter: 'none',
              maxHeight: 'calc(85vh - 180px)'
            }}>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: '500' }}>
                  From
                </label>
                <input
                  type="email"
                  value={defaultAccount || 'your.email@company.com'}
                  disabled
                  style={{
                    padding: '12px 16px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--text-secondary)',
                    fontSize: '14px'
                  }}
                />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: '500' }}>
                  To *
                </label>
                <input
                  type="email"
                  value={emailData.to}
                  onChange={(e) => handleInputChange('to', e.target.value)}
                  placeholder="recipient@example.com"
                  required
                  style={{
                    padding: '12px 16px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: '500' }}>
                  CC
                </label>
                <input
                  type="email"
                  value={emailData.cc}
                  onChange={(e) => handleInputChange('cc', e.target.value)}
                  placeholder="cc@example.com (optional)"
                  style={{
                    padding: '12px 16px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '14px'
                  }}
                />
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}></span>
                <motion.button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary-color)',
                    fontSize: '12px',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  {showAdvanced ? '▲ Hide Advanced' : '▼ Show Advanced'}
                </motion.button>
              </div>
              
              <AnimatePresence>
                {showAdvanced && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '8px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: '500' }}>
                          BCC
                        </label>
                        <input
                          type="email"
                          value={emailData.bcc}
                          onChange={(e) => handleInputChange('bcc', e.target.value)}
                          placeholder="bcc@example.com (optional)"
                          style={{
                            padding: '12px 16px',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            backgroundColor: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            fontSize: '14px'
                          }}
                        />
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: '500' }}>
                          Priority
                        </label>
                        <select
                          value={emailData.priority}
                          onChange={(e) => handleInputChange('priority', e.target.value)}
                          style={{
                            padding: '12px 16px',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            backgroundColor: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            fontSize: '14px'
                          }}
                        >
                          <option value="low">🔵 Low Priority</option>
                          <option value="normal">⚪ Normal Priority</option>
                          <option value="high">🔴 High Priority</option>
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: '500' }}>
                  Subject *
                </label>
                <input
                  type="text"
                  value={emailData.subject}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  placeholder="Email subject"
                  required
                  style={{
                    padding: '12px 16px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: '500' }}>
                    Message
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <motion.button
                      type="button"
                      onClick={() => handleInputChange('body', emailData.body + '\n\nBest regards,\nYour Name')}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      style={{
                        padding: '4px 8px',
                        fontSize: '11px',
                        border: '1px solid var(--border-color)',
                        borderRadius: '4px',
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer'
                      }}
                    >
                      ✍️ Signature
                    </motion.button>
                    <motion.button
                      type="button"
                      onClick={() => handleInputChange('body', 'Dear [Name],\n\nI hope this email finds you well.\n\n')}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      style={{
                        padding: '4px 8px',
                        fontSize: '11px',
                        border: '1px solid var(--border-color)',
                        borderRadius: '4px',
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer'
                      }}
                    >
                      📝 Template
                    </motion.button>
                  </div>
                </div>
                <textarea
                  value={emailData.body}
                  onChange={(e) => handleInputChange('body', e.target.value)}
                  placeholder="Write your email message here...&#10;&#10;You can use the buttons above for quick templates!"
                  rows={6}
                  style={{
                    padding: '12px 16px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    resize: 'vertical',
                    minHeight: '120px',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
              </form>
            </div>
            
            <div style={{ 
              display: 'flex', 
              gap: '8px', 
              justifyContent: 'space-between',
              padding: '20px 24px',
              borderTop: '1px solid #e1e5e9',
              flexShrink: 0,
              backgroundColor: 'white',
              position: 'relative',
              zIndex: 1,
              minHeight: '80px',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => {
                    toast.info('Draft saved!');
                    // In real app, save to drafts folder
                  }}
                  style={{
                    padding: '10px 20px',
                    border: '1px solid #ccc',
                    borderRadius: '6px',
                    backgroundColor: '#f8f9fa',
                    color: '#666',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  💾 Save Draft
                </button>
              </div>
              
              <div style={{ 
                display: 'flex', 
                gap: '12px', 
                alignItems: 'center',
                justifyContent: 'flex-end'
              }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: '10px 20px',
                    border: '1px solid #ccc',
                    borderRadius: '6px',
                    backgroundColor: 'white',
                    color: '#666',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    if (!sending) {
                      handleSubmit(e);
                    }
                  }}
                  disabled={sending}
                  style={{
                    padding: '12px 24px',
                    border: 'none',
                    borderRadius: '8px',
                    background: sending ? '#6c757d' : (emailData.priority === 'high' ? '#dc3545' : '#28a745'),
                    color: '#ffffff',
                    cursor: sending ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    minWidth: '150px',
                    textAlign: 'center',
                    boxShadow: sending ? 'none' : '0 4px 8px rgba(40, 167, 69, 0.3)',
                    position: 'relative',
                    zIndex: 999,
                    opacity: sending ? 0.7 : 1,
                    transition: 'all 0.3s ease'
                  }}
                >
                  {sending ? (
                    <>
                      <span style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid #ffffff',
                        borderTop: '2px solid transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        display: 'inline-block'
                      }}></span>
                      SENDING...
                    </>
                  ) : (
                    <>
                      {emailData.priority === 'high' ? '⚡' : '📤'} SEND EMAIL
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ComposeModal;