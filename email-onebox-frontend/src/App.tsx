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
import ComposeModal from './components/ComposeModal';

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
  const [allEmails, setAllEmails] = useState<Email[]>([]);
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState('inbox');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [showComposeModal, setShowComposeModal] = useState(false);

  // Filter emails based on selected folder and active filters
  const filterEmails = (emailList: Email[], folder: string, quickFilter: string) => {
    let filtered = emailList;
    
    // Filter by folder first
    switch (folder) {
      case 'inbox':
        filtered = emailList.filter(email => 
          email._source?.boxName?.toLowerCase() === 'inbox' || 
          !email._source?.boxName
        );
        break;
      case 'sent':
        filtered = emailList.filter(email => 
          email._source?.boxName?.toLowerCase() === 'sent'
        );
        break;
      case 'drafts':
        filtered = emailList.filter(email => 
          email._source?.boxName?.toLowerCase() === 'drafts'
        );
        break;
      case 'starred':
        filtered = emailList.filter(email => 
          email._source?.subject?.includes('⭐') || 
          email._source?.subject?.toLowerCase().includes('important') ||
          email._source?.subject?.toLowerCase().includes('urgent') ||
          (email._id?.length || 0) % 5 === 0 // Deterministic "starred" logic
        );
        break;
      case 'archive':
        filtered = emailList.filter(email => 
          email._source?.boxName?.toLowerCase() === 'archive'
        );
        break;
      case 'trash':
        filtered = emailList.filter(email => 
          email._source?.boxName?.toLowerCase() === 'trash'
        );
        break;
      default:
        // For other folders or 'all', show all emails
        break;
    }
    
    // Apply quick filter if active
    if (quickFilter) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      switch (quickFilter) {
        case 'unread':
          // Deterministic "unread" logic based on email properties
          filtered = filtered.filter(email => 
            (email._id?.length || 0) % 3 === 0 || 
            email._source?.subject?.toLowerCase().includes('new')
          );
          break;
        case 'today':
          filtered = filtered.filter(email => {
            const emailDate = new Date(email._source?.date);
            emailDate.setHours(0, 0, 0, 0);
            return emailDate.getTime() === today.getTime();
          });
          break;
        case 'attachments':
          // Deterministic attachment logic
          filtered = filtered.filter(email => 
            email._source?.body?.toLowerCase().includes('attachment') || 
            email._source?.body?.toLowerCase().includes('attached') ||
            email._source?.subject?.toLowerCase().includes('attachment') ||
            (email._id?.length || 0) % 4 === 0
          );
          break;
        case 'important':
          filtered = filtered.filter(email => 
            email._source?.subject?.includes('URGENT') || 
            email._source?.subject?.toLowerCase().includes('important') ||
            email._source?.subject?.toLowerCase().includes('priority') ||
            email._source?.from?.toLowerCase().includes('noreply') === false
          );
          break;
      }
    }
    
    return filtered;
  };
  
  // Update emails when folder or filter changes
  useEffect(() => {
    const filtered = filterEmails(allEmails, selectedFolder, activeFilter);
    setEmails(filtered);
  }, [allEmails, selectedFolder, activeFilter]);

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
      setAllEmails(results);
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
    setActiveFilter(''); // Clear any active quick filter
    
    const folderName = folder.charAt(0).toUpperCase() + folder.slice(1);
    toast.info(`Switched to ${folderName} folder`);
  };

  const handleAccountSelect = (account: string) => {
    setSelectedAccount(account);
    setActiveFilter(''); // Clear any active quick filter
    // Trigger search with selected account
    handleAdvancedSearch('', {
      query: '',
      account: account,
      sender: '',
      dateFrom: '',
      dateTo: '',
      hasAttachment: false,
      isUnread: false,
    });
    toast.info(account ? `Switched to ${account}` : 'Showing all accounts');
  };

  const handleQuickFilter = (filter: string) => {
    const newFilter = activeFilter === filter ? '' : filter; // Toggle filter
    setActiveFilter(newFilter);
    
    const filterName = filter === 'unread' ? 'unread emails' :
                      filter === 'today' ? "today's emails" :
                      filter === 'attachments' ? 'emails with attachments' :
                      filter === 'important' ? 'important emails' : filter;
    
    if (newFilter === '') {
      toast.info('Filter cleared');
    } else {
      toast.info(`Showing ${filterName}`);
    }
  };

  const handleCompose = () => {
    setShowComposeModal(true);
    setSidebarOpen(false);
  };

  const unreadCount = allEmails.filter(email => 
    // Consistent unread logic matching the filter
    (email._id?.length || 0) % 3 === 0 || 
    email._source?.subject?.toLowerCase().includes('new')
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
              selectedAccount={selectedAccount}
              onAccountSelect={handleAccountSelect}
              onQuickFilter={handleQuickFilter}
              onCompose={handleCompose}
              emails={allEmails}
              activeFilter={activeFilter}
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
                    {emails.length} email{emails.length !== 1 ? 's' : ''} in {selectedFolder.charAt(0).toUpperCase() + selectedFolder.slice(1)}
                    {activeFilter && ` (${activeFilter})`}
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
          onCompose={handleCompose}
          onRefresh={handleRefresh}
          onSearch={() => toast.info('Advanced search is in the header!')}
        />
        
        <ComposeModal 
          isOpen={showComposeModal}
          onClose={() => setShowComposeModal(false)}
          defaultAccount={selectedAccount}
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
