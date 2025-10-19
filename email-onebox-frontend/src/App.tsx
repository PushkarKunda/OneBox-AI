import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './themes.css';
import './App.css';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import AdvancedSearchBar from './components/AdvancedSearchBar';
import EmailList from './components/EmailList';
import EmailDetail from './components/EmailDetail';
import { ThemeProvider } from './contexts/ThemeContext';
import { Email, emailService } from './services/api';
import FloatingActionButton from './components/FloatingActionButton';

interface SearchFilters {
  query: string;
  account: string;
  sender: string;
  dateFrom: string;
  dateTo: string;
  hasAttachment: boolean;
  isUnread: boolean;
}

function App() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState('inbox');
  const [refreshing, setRefreshing] = useState(false);

  // Load initial emails
  useEffect(() => {
    handleAdvancedSearch('', {
      query: '',
      account: '',
      sender: '',
      dateFrom: '',
      dateTo: '',
      hasAttachment: false,
      isUnread: false,
    });
  }, []);

  const handleAdvancedSearch = async (query: string, filters: SearchFilters) => {
    setLoading(true);
    setError(null);
    try {
      // For now, we'll just use the basic search functionality
      // In a real app, you'd send all filters to the backend
      const results = await emailService.searchEmails(query || filters.query, filters.account);
      setEmails(results);
      setSelectedEmail(null);
      
      if (results.length > 0) {
        toast.success(`Found ${results.length} emails`);
      } else {
        toast.info('No emails found for your search criteria');
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to fetch emails';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSelect = (email: Email) => {
    setSelectedEmail(email);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await handleAdvancedSearch('', {
        query: '',
        account: '',
        sender: '',
        dateFrom: '',
        dateTo: '',
        hasAttachment: false,
        isUnread: false,
      });
      toast.success('Emails refreshed!');
    } catch (error) {
      toast.error('Failed to refresh emails');
    } finally {
      setRefreshing(false);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleFolderSelect = (folder: string) => {
    setSelectedFolder(folder);
    setSidebarOpen(false);
    // In a real app, you'd filter emails by folder
    toast.info(`Switched to ${folder} folder`);
  };

  const unreadCount = emails.filter(email => 
    // Simulated unread logic - in real app this would come from email data
    Math.random() > 0.7
  ).length;

  return (
    <ThemeProvider>
      <div className="App">
        <Header 
          onMenuToggle={toggleSidebar}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          unreadCount={unreadCount}
        />
        
        <div className="main-layout">
          <AnimatePresence>
            <Sidebar 
              isOpen={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
              selectedFolder={selectedFolder}
              onFolderSelect={handleFolderSelect}
            />
          </AnimatePresence>
          
          <div className="content-area">
            <AdvancedSearchBar 
              onSearch={handleAdvancedSearch} 
              loading={loading} 
            />
            
            {error && (
              <motion.div 
                className="error-message"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {error}
              </motion.div>
            )}
            
            <div className="app-content">
              <motion.div 
                className="email-list-panel"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <div className="email-count">
                  <motion.span
                    key={emails.length}
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    {emails.length} email{emails.length !== 1 ? 's' : ''} found
                  </motion.span>
                  {loading && (
                    <motion.div 
                      className="loading-indicator"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      ↻
                    </motion.div>
                  )}
                </div>
                <EmailList 
                  emails={emails} 
                  onEmailSelect={handleEmailSelect}
                  selectedEmailId={selectedEmail?._id}
                />
              </motion.div>
              
              <motion.div 
                className="email-detail-panel"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <EmailDetail email={selectedEmail} />
              </motion.div>
            </div>
          </div>
        </div>
        
        <FloatingActionButton 
          onCompose={() => toast.info('Compose feature coming soon!')}
          onRefresh={handleRefresh}
          onSearch={() => toast.info('Advanced search is in the header!')}
        />
        
        <ToastContainer
          position="bottom-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
        />
      </div>
    </ThemeProvider>
  );
}

export default App;
