import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiMail, FiLock, FiServer, FiCheck, FiZap, FiGlobe } from 'react-icons/fi';
import { emailService } from '../services/api';
import './ConnectAccountModal.css';

const IconX = FiX as React.ElementType;
const IconMail = FiMail as React.ElementType;
const IconLock = FiLock as React.ElementType;
const IconServer = FiServer as React.ElementType;
const IconCheck = FiCheck as React.ElementType;
const IconZap = FiZap as React.ElementType;
const IconGlobe = FiGlobe as React.ElementType;

interface ConnectAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccountAdded: (accountUser: string) => void;
}

export const ConnectAccountModal: React.FC<ConnectAccountModalProps> = ({
  isOpen,
  onClose,
  onAccountAdded,
}) => {
  const [provider, setProvider] = useState<'demo' | 'gmail' | 'outlook' | 'yahoo' | 'custom'>('demo');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [host, setHost] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleProviderSelect = (selected: 'demo' | 'gmail' | 'outlook' | 'yahoo' | 'custom') => {
    setProvider(selected);
    setErrorMsg('');
    setSuccessMsg('');
    if (selected === 'gmail') {
      setHost('imap.gmail.com');
    } else if (selected === 'outlook') {
      setHost('outlook.office365.com');
    } else if (selected === 'yahoo') {
      setHost('imap.mail.yahoo.com');
    } else if (selected === 'demo') {
      setEmail('demo@onebox.ai');
      setHost('imap.onebox.ai');
    } else {
      setHost('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const targetUser = provider === 'demo' ? 'demo@onebox.ai' : email;
      if (!targetUser) {
        throw new Error('Please enter a valid email address');
      }

      await emailService.connectAccount({
        user: targetUser,
        password: password,
        host: host,
        provider: provider,
      });

      setSuccessMsg(`Successfully connected ${targetUser}!`);
      setTimeout(() => {
        onAccountAdded(targetUser);
        onClose();
        setSuccessMsg('');
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to connect account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="connect-modal-backdrop">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="connect-modal-card"
        >
          {/* Header */}
          <div className="connect-modal-header">
            <div className="connect-modal-title">
              <div className="connect-icon-wrapper">
                <IconMail style={{ width: 18, height: 18 }} />
              </div>
              <h2>Connect Email Account</h2>
            </div>
            <button
              onClick={onClose}
              className="connect-modal-close"
              title="Close"
            >
              <IconX style={{ width: 18, height: 18 }} />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="connect-modal-body">
            {/* Provider Tabs */}
            <div>
              <span className="connect-section-label">
                Select Connection Method
              </span>
              <div className="connect-provider-tabs">
                <button
                  type="button"
                  onClick={() => handleProviderSelect('demo')}
                  className={`connect-tab-btn ${provider === 'demo' ? 'active' : ''}`}
                >
                  <IconZap style={{ width: 18, height: 18, color: '#f59e0b' }} />
                  <span>Quick Demo</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleProviderSelect('gmail')}
                  className={`connect-tab-btn ${provider === 'gmail' ? 'active' : ''}`}
                >
                  <IconMail style={{ width: 18, height: 18, color: '#ef4444' }} />
                  <span>Gmail</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleProviderSelect('outlook')}
                  className={`connect-tab-btn ${provider === 'outlook' ? 'active' : ''}`}
                >
                  <IconGlobe style={{ width: 18, height: 18, color: '#3b82f6' }} />
                  <span>Outlook</span>
                </button>
              </div>
            </div>

            {/* Content per Provider */}
            {provider === 'demo' ? (
              <div className="connect-demo-box">
                <div className="connect-demo-title">
                  <IconZap style={{ width: 16, height: 16, color: '#f59e0b' }} /> Instant Zero-Setup Mode
                </div>
                <p className="connect-demo-desc">
                  No passwords or environment variables required! Instantly connects a demo inbox prepopulated with realistic emails, categorization tags, and AI features.
                </p>
              </div>
            ) : (
              <>
                <div className="connect-field-group">
                  <label className="connect-field-label">
                    Email Address
                  </label>
                  <div className="connect-input-wrapper">
                    <IconMail className="connect-input-icon" style={{ width: 16, height: 16 }} />
                    <input
                      type="email"
                      required
                      placeholder="user@domain.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="connect-input-field"
                    />
                  </div>
                </div>

                <div className="connect-field-group">
                  <label className="connect-field-label">
                    Password / App Password
                  </label>
                  <div className="connect-input-wrapper">
                    <IconLock className="connect-input-icon" style={{ width: 16, height: 16 }} />
                    <input
                      type="password"
                      placeholder="••••••••••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="connect-input-field"
                    />
                  </div>
                </div>

                <div className="connect-field-group">
                  <label className="connect-field-label">
                    IMAP Host Server
                  </label>
                  <div className="connect-input-wrapper">
                    <IconServer className="connect-input-icon" style={{ width: 16, height: 16 }} />
                    <input
                      type="text"
                      placeholder="imap.gmail.com"
                      value={host}
                      onChange={e => setHost(e.target.value)}
                      className="connect-input-field"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Status Messages */}
            {successMsg && (
              <div className="connect-alert-success">
                <IconCheck style={{ width: 16, height: 16 }} /> {successMsg}
              </div>
            )}

            {errorMsg && (
              <div className="connect-alert-error">
                {errorMsg}
              </div>
            )}

            {/* Action Buttons */}
            <div className="connect-modal-actions">
              <button
                type="button"
                onClick={onClose}
                className="connect-btn-cancel"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="connect-btn-submit"
              >
                {loading ? 'Connecting...' : provider === 'demo' ? 'Connect Demo Inbox' : 'Connect Account'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
