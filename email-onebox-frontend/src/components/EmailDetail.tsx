import React from 'react';
import { Email } from '../services/api';

interface EmailDetailProps {
  email: Email | null;
}

const EmailDetail: React.FC<EmailDetailProps> = ({ email }) => {
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

  return (
    <div className="email-detail">
      <div className="email-detail-header">
        <h2 className="email-detail-subject">{email._source?.subject || 'No Subject'}</h2>
        <div className="email-detail-meta">
          <div className="email-detail-from">
            <strong>From:</strong> {email._source?.from || 'Unknown'}
          </div>
          <div className="email-detail-to">
            <strong>To:</strong> {Array.isArray(email._source?.to) ? email._source.to.join(', ') : (email._source?.to || 'Unknown')}
          </div>
          <div className="email-detail-date">
            <strong>Date:</strong> {email._source?.date ? formatDate(email._source.date) : 'Unknown'}
          </div>
          <div className="email-detail-account">
            <strong>Account:</strong> {email._source?.account || 'Unknown'}
          </div>
          {email._source?.boxName && (
            <div className="email-detail-box">
              <strong>Folder:</strong> {email._source.boxName}
            </div>
          )}
        </div>
      </div>
      
      <div className="email-detail-body">
        <div
          className="email-body-content"
          dangerouslySetInnerHTML={{ __html: email._source?.body || 'No content available' }}
        />
      </div>
    </div>
  );
};

export default EmailDetail;