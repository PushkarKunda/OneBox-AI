# OneBox-AI - Complete Email Management Platform

A full-stack professional email management platform featuring AI-powered email classification, real-time synchronization, and a modern React frontend. Built for businesses and individuals who need powerful email organization and processing capabilities.

## 🚀 **Overview**

OneBox-AI is a comprehensive email onebox solution that combines:
- **AI-powered email classification** using Hugging Face models
- **Real-time email synchronization** from multiple IMAP accounts
- **Professional React frontend** with modern UI/UX
- **Elasticsearch integration** for fast search and indexing
- **Webhook notifications** and Slack integration
- **Multi-account support** with unified inbox experience

## 📁 **Project Structure**

```
OneBox-AI/
├── email-onebox-backend/          # Node.js backend with AI processing
│   ├── src/
│   │   ├── services/
│   │   │   ├── imap.service.js           # Email synchronization
│   │   │   ├── ai.service.js             # AI classification
│   │   │   ├── elasticsearch.service.js  # Search & indexing
│   │   │   └── notification.service.js   # Webhooks & Slack
│   │   └── index.js                      # Main server
│   ├── package.json
│   └── docker-compose.yml               # Elasticsearch setup
├── email-onebox-frontend/         # React TypeScript frontend
│   ├── src/
│   │   ├── components/                   # UI components
│   │   ├── services/                     # API integration
│   │   ├── contexts/                     # React contexts
│   │   └── App.tsx                       # Main application
│   └── package.json
└── README.md                            # This file
```

## ✨ **Features**

### 🤖 **Backend (AI-Powered Email Processing)**
- **Multi-Account IMAP Sync**: Connect multiple email accounts simultaneously
- **AI Email Classification**: Automatic categorization using Hugging Face models
- **Real-time Processing**: Instant email processing as they arrive
- **Elasticsearch Integration**: Fast search and advanced querying
- **Webhook Notifications**: Real-time alerts for important emails
- **Slack Integration**: Direct notifications to Slack channels
- **RESTful API**: Clean API endpoints for frontend integration

### 🎨 **Frontend (Modern Email Client)**
- **Professional UI**: Clean, business-appropriate design with animations
- **Advanced Search**: Multi-field search with filters (date, sender, account)
- **Dark/Light Theme**: Automatic theme switching with user preferences
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Real-time Updates**: Live email updates with toast notifications
- **Email Management**: Priority indicators, read/unread status, attachments
- **Sidebar Navigation**: Organized folders, labels, and quick filters

## 🛠 **Tech Stack**

### **Backend**
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **Elasticsearch** - Search and indexing
- **Hugging Face** - AI model integration
- **Node-IMAP** - Email synchronization
- **Axios** - HTTP client for webhooks

### **Frontend**
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Framer Motion** - Smooth animations
- **React Toastify** - User notifications
- **CSS Custom Properties** - Theming system

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js (v16 or higher)
- Docker and Docker Compose
- Email accounts with IMAP access
- (Optional) Slack webhook URL
- (Optional) External webhook endpoint

### **1. Clone the Repository**
```bash
git clone https://github.com/PushkarKunda/OneBox-AI.git
cd OneBox-AI
```

### **2. Setup Backend**
```bash
cd email-onebox-backend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your email credentials and API keys

# Start Elasticsearch
docker-compose up -d

# Start the backend server
npm start
```

The backend will start on `http://localhost:3001`

### **3. Setup Frontend**
```bash
cd ../email-onebox-frontend

# Install dependencies
npm install

# Start the development server
npm start
```

The frontend will start on `http://localhost:3000`

## ⚙️ **Configuration**

### **Backend Environment Variables**
Create `.env` file in `email-onebox-backend/`:

```env
# Email Account 1
IMAP_USER_1=your-email1@gmail.com
IMAP_PASSWORD_1=your-app-password-1
IMAP_HOST_1=imap.gmail.com

# Email Account 2  
IMAP_USER_2=your-email2@gmail.com
IMAP_PASSWORD_2=your-app-password-2
IMAP_HOST_2=imap.gmail.com

# AI Classification
HUGGINGFACE_API_KEY=your-huggingface-api-key

# Notifications (Optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
EXTERNAL_WEBHOOK_URL=https://webhook.site/your-uuid

# Elasticsearch
ELASTICSEARCH_NODE=http://localhost:9200
```

### **Email Setup (Gmail)**
1. Enable 2-factor authentication
2. Generate app-specific passwords
3. Use app passwords in the configuration

## 📊 **API Endpoints**

### **GET /api/emails**
Search and retrieve emails with optional filters.

**Query Parameters:**
- `q` - Search query (optional)
- `account` - Filter by email account (optional)

**Response:**
```json
{
  "hits": {
    "hits": [
      {
        "_id": "email-id",
        "_source": {
          "from": "sender@example.com",
          "to": ["recipient@example.com"],
          "subject": "Email Subject",
          "date": "2025-01-19T12:00:00Z",
          "body": "Email content...",
          "account": "your-email@gmail.com",
          "classification": "Important"
        }
      }
    ]
  }
}
```

## 🤖 **AI Features**

### **Email Classification**
The AI service automatically categorizes emails into:
- **Important** - Urgent business emails, deadlines
- **Interested** - Newsletters, updates you've engaged with
- **Not Interested** - Promotional emails, spam
- **Uncategorized** - When confidence is too low

### **Classification Confidence**
- Uses confidence thresholds to ensure accuracy
- Falls back to "Uncategorized" for ambiguous emails
- Continuously learns from email patterns

## 📱 **Frontend Features**

### **Search & Filters**
- **Global Search** - Search across all email content
- **Advanced Filters** - Date range, sender, account, attachments
- **Quick Filters** - Unread, today's emails, specific folders
- **Live Search** - Real-time results as you type

### **Email Management**
- **Priority Indicators** - Visual markers for urgent emails
- **Read/Unread Status** - Clear visual distinction
- **Account Labels** - See which account received each email
- **Attachment Indicators** - Quick identification of emails with files

### **Theme System**
- **Light Theme** - Clean, professional appearance
- **Dark Theme** - Easy on the eyes for extended use
- **System Preference** - Automatic theme based on OS settings

## 🔧 **Development**

### **Backend Development**
```bash
cd email-onebox-backend
npm run dev  # Start with nodemon for auto-reload
```

### **Frontend Development**  
```bash
cd email-onebox-frontend
npm start    # Start with hot reload
npm build    # Build for production
npm test     # Run tests
```

## 🚀 **Deployment**

### **Backend Deployment**
1. Set up Elasticsearch cluster
2. Configure environment variables
3. Deploy Node.js application
4. Set up process manager (PM2)

### **Frontend Deployment**
1. Build the React application
2. Deploy to static hosting (Netlify, Vercel)
3. Update API endpoints for production

## 📈 **Monitoring & Analytics**

- **Email Processing Stats** - Track classification accuracy
- **Search Analytics** - Monitor search patterns  
- **Performance Metrics** - API response times
- **User Engagement** - Frontend interaction tracking

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 **License**

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 **Acknowledgments**

- **Hugging Face** for AI model APIs
- **Elasticsearch** for powerful search capabilities
- **React Team** for the excellent frontend framework
- **Framer Motion** for smooth animations
- **Community contributors** for various open-source libraries

## 📧 **Support**

For support, questions, or feature requests:
- Open an issue on GitHub
- Email: t79077788@gmail.com
- Create a discussion for general questions

---

**OneBox-AI** - Revolutionizing email management with AI-powered intelligence and modern design. 🚀