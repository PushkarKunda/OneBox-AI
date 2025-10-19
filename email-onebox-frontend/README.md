# EmailBox - Professional Email Client Frontend

A modern, professional email client frontend built with React, TypeScript, and Framer Motion. Features a clean design with advanced search capabilities, responsive layout, and smooth animations.

## ✨ Features

### 🎨 **Modern UI/UX**
- Clean, professional design with gradient headers
- Smooth animations and transitions using Framer Motion
- Dark/Light theme support with system preference detection
- Responsive design that works on desktop and mobile
- Emoji-based icons for better compatibility

### 📧 **Email Management**
- Advanced search with multiple filter options
- Email list with priority indicators and read/unread status
- Email detail view with rich content display
- Sidebar navigation with folders and labels
- Real-time loading states and user feedback

### 🔍 **Advanced Search**
- Search by content, sender, and account
- Date range filtering
- Attachment and unread filters
- Live search with instant results
- Filter tags for active search criteria

### 📱 **Responsive Design**
- Mobile-friendly sidebar that slides in/out
- Adaptive layout for different screen sizes
- Touch-optimized interactions
- Collapsible email panels on mobile

## 🚀 **Getting Started**

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Backend API running on `http://localhost:3001`

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd email-onebox-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```
   Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

4. **Build for production**
   ```bash
   npm run build
   ```

## 🛠 **Built With**

- **React** - Frontend framework
- **TypeScript** - Type safety and better development experience
- **Framer Motion** - Smooth animations and transitions
- **React Toastify** - User notifications and feedback
- **CSS Custom Properties** - Theme system and consistent styling

## 📁 **Project Structure**

```
src/
├── components/           # React components
│   ├── AdvancedSearchBar.tsx    # Advanced search with filters
│   ├── EmailDetail.tsx          # Individual email display
│   ├── EmailList.tsx            # Email list with animations
│   ├── Header.tsx               # App header with navigation
│   ├── SearchBar.tsx            # Basic search component
│   └── Sidebar.tsx              # Navigation sidebar
├── contexts/             # React contexts
│   └── ThemeContext.tsx         # Dark/light theme management
├── services/             # API services
│   └── api.ts                   # Email service and types
├── App.tsx               # Main application component
├── App.css               # Global application styles
├── modern.css            # Modern component styling
└── index.tsx             # Application entry point
```

## 🎨 **Theming**

The application uses CSS custom properties for consistent theming:

- **Light Theme**: Clean white backgrounds with subtle shadows
- **Dark Theme**: Dark backgrounds with improved contrast
- **Accent Colors**: Purple gradient for primary actions

## 📝 **Available Scripts**

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App (not recommended)

## 🤝 **API Integration**

The frontend expects a backend API running on `http://localhost:3001` with:

### GET `/api/emails`
Search emails with optional query parameters:
- `q` - Search query
- `account` - Filter by email account

## 🔮 **Future Enhancements**

- [ ] Email composition with rich text editor
- [ ] Data visualization for email analytics
- [ ] Advanced email previews with quick actions
- [ ] Email categories and smart sorting
- [ ] Keyboard shortcuts for power users

## 📄 **License**

This project is licensed under the MIT License.
