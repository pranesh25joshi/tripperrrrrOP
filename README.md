# 🌍 Trip Sliptos - AI-Powered Smart Trip Expense Tracker

<div align="center">
  <img src="public/my-notion-face-transparent.png" alt="Trip Sliptos Logo" width="100" height="100">
  
  **Split Trip Expenses Effortlessly with Voice AI & Automated Reports**
  
  Track, split, and settle expenses with friends, family, or colleagues during your trips. Features voice AI announcements, automated email summaries, and professional PDF reports. No more awkward money conversations.

  ![Next.js](https://img.shields.io/badge/Next.js-15.3.4-black?style=flat-square&logo=next.js)
  ![React](https://img.shields.io/badge/React-19.0.0-blue?style=flat-square&logo=react)
  ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
  ![Firebase](https://img.shields.io/badge/Firebase-11.9.1-orange?style=flat-square&logo=firebase)
  ![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-teal?style=flat-square&logo=tailwindcss)
  ![ElevenLabs](https://img.shields.io/badge/ElevenLabs-Voice%20AI-purple?style=flat-square)
</div>

## ✨ Features

### 🎯 **Core Functionality**
- **Trip Management**: Create and organize trips with multiple members
- **Expense Tracking**: Add expenses with detailed categorization and splitting options
- **Smart Settlements**: Automatically calculate optimal payment settlements with precision rounding
- **Member Invitations**: Invite people via email with secure token-based system
- **Real-time Updates**: Live expense tracking and member management

### 🎤 **AI-Powered Voice Features** ⭐ NEW
- **Voice Announcements**: Intelligent ElevenLabs TTS integration for expense confirmations
- **Smart Audio Feedback**: Real-time voice confirmation when expenses are added
- **Trip Completion Announcements**: Comprehensive voice summary when trips are finalized
- **Mobile Voice Toggle**: Easy voice controls optimized for mobile expense entry
- **Credit Protection**: Built-in API usage monitoring to prevent overcharges

### 📧 **Automated Email System** ⭐ NEW
- **Trip Summary Emails**: Automated comprehensive email reports when trips are completed
- **Professional PDF Attachments**: Detailed multi-page PDF reports with expense breakdowns
- **Member Notifications**: All trip members receive automatic email summaries
- **HTML Email Templates**: Beautiful, responsive email layouts with full trip details
- **Settlement Instructions**: Clear payment instructions included in email summaries

### 📊 **Advanced PDF Reports** ⭐ NEW
- **Multi-Page Professional Reports**: Comprehensive PDF documents with expense analytics
- **Category Analysis**: Detailed breakdown by expense categories with percentages
- **Member Summaries**: Individual balances, payment history, and settlement status
- **Daily Spending Patterns**: Timeline view of expenses throughout the trip
- **Settlement Instructions**: Step-by-step payment guides to settle all balances
- **Multi-Currency Support**: Accurate currency formatting and conversion handling

### 💰 **Enhanced Expense Management**
- **Flexible Splitting**: Equal split or custom amounts per person with precision rounding
- **Multiple Categories**: Food, accommodation, transport, activities, shopping, and more
- **Multi-currency Support**: Track expenses in different currencies with accurate formatting
- **Payment Tracking**: Record who paid for each expense with detailed audit trails
- **Expense History**: Complete audit trail with improved date formatting and accuracy

### 🤝 **Collaboration Features**
- **Member Management**: Add/remove trip members easily
- **Email Invitations**: Send secure invitation links via email with Resend service
- **Role-based Access**: Trip creators can manage trip settings
- **Guest Access**: Accept invitations and join trips seamlessly

### 📊 **Advanced Settlement System**
- **Optimized Calculations**: Minimize transactions with improved algorithms and precision
- **Floating-Point Accuracy**: Proper rounding to avoid precision errors
- **Clear Breakdown**: See exactly who owes what to whom with accurate calculations
- **Settlement Tracking**: Mark settlements as complete
- **Final Summary**: Complete overview with voice announcements when trips are finalized

### 🎨 **Modern UI/UX**
- **Glass Morphism Design**: Beautiful, modern interface with glass effects
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Dark/Light Theme**: Adaptive theming for user preference
- **Smooth Animations**: Polished interactions and transitions
- **Voice Controls**: Mobile-optimized voice toggle for hands-free operation
- **Intuitive Navigation**: Easy-to-use interface for all user levels

## 🛠️ Technology Stack

### **Frontend**
- **Framework**: Next.js 15.3.4 with App Router
- **UI Library**: React 19.0.0
- **Language**: TypeScript 5.0
- **Styling**: Tailwind CSS 4.0 with custom glass morphism effects
- **Icons**: Lucide React, React Icons
- **UI Components**: Radix UI primitives
- **State Management**: Zustand for global state
- **PDF Generation**: jsPDF with jspdf-autotable for professional reports
- **Voice AI**: ElevenLabs REST API for intelligent text-to-speech

### **Backend & Services**
- **Database**: Firebase Firestore (NoSQL)
- **Authentication**: Firebase Auth
- **File Storage**: Firebase Storage
- **API**: Next.js API routes
- **Email Service**: Resend for professional email delivery
- **Voice AI**: ElevenLabs TTS with credit monitoring and usage protection
- **PDF Processing**: Server-side PDF generation with comprehensive formatting

### **Development Tools**
- **Package Manager**: npm
- **Build Tool**: Next.js with Turbopack
- **Linting**: ESLint
- **Date Handling**: date-fns with improved formatting
- **Notifications**: Sonner for toast messages

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager
- Firebase project with Firestore enabled

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/pranesh25joshi/tripperrrrrOP.git
   cd tripsliptos
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

   # Email Service (Resend) - Required for automated email summaries
   RESEND_API_KEY=your_resend_api_key

   # ElevenLabs Voice AI - Required for voice announcements
   ELEVENLABS_API_KEY=your_elevenlabs_api_key

   # App Configuration
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Configure Firebase**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Firestore Database
   - Enable Authentication (Email/Password)
   - Add your domain to authorized domains

5. **Set up External Services**
   
   **Resend Email Service:**
   - Sign up at [Resend](https://resend.com)
   - Get your API key from the dashboard
   - Configure sender domain (optional but recommended)
   
   **ElevenLabs Voice AI:**
   - Create account at [ElevenLabs](https://elevenlabs.io)
   - Get your API key from settings
   - Choose voice models for text-to-speech (default: Rachel)

6. **Set up Firestore Security Rules**
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Users can read/write their own profile
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
       
       // Trip members can read/write trip data
       match /trips/{tripId} {
         allow read, write: if request.auth != null && 
           request.auth.uid in resource.data.members;
       }
       
       // Expense access for trip members
       match /expenses/{expenseId} {
         allow read, write: if request.auth != null;
       }
       
       // Invitation tokens
       match /invitationTokens/{tokenId} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

6. **Run the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📱 Usage Guide

### Creating a Trip
1. Sign up or log in to your account
2. Click "Start a New Trip" on the homepage
3. Fill in trip details (name, description, dates, currency)
4. Invite members via email addresses
5. Start adding expenses with voice confirmation!

### Adding Expenses with Voice AI
1. Navigate to your trip page
2. Click "Add Expense" button (voice toggle available on mobile)
3. Enter expense details:
   - Name and description
   - Amount and currency
   - Category (food, transport, etc.)
   - Who paid for it
   - How to split it (equal or custom)
4. Select which members to include in the split
5. Save the expense and hear voice confirmation
6. Use voice toggle for hands-free operation on mobile

### Automated Email Reports
1. Add all trip expenses throughout your journey
2. When ready, click "Finalize Trip" (trip creator only)
3. System automatically generates:
   - Professional PDF report with complete expense breakdown
   - Comprehensive email summary sent to all members
   - Settlement instructions for easy payment coordination
4. Voice announcement confirms trip completion and email delivery
5. All members receive detailed PDF attachments via email

### Managing Settlements with Precision
1. View optimized settlement calculations with accurate rounding
2. Settlements minimize number of transactions needed
3. Share settlement details via automated emails
4. Mark settlements as complete when paid
5. All calculations handle multi-currency with proper formatting

### Inviting Members
1. From the trip page, click "Invite People"
2. Enter email addresses of people to invite
3. Invitation emails are sent automatically
4. Invitees click the link to join the trip
5. They can immediately start viewing and adding expenses

## 🏗️ Project Structure

```
tripsliptos/
├── app/                          # Next.js app directory
│   ├── (with-header)/           # Layout with header
│   │   └── trips/               # Trip-related pages
│   ├── api/                     # API routes
│   │   └── email/               # Email automation endpoints
│   │       ├── send-trip-summary/ # Automated PDF email reports
│   │       ├── send-invite/     # Member invitation emails
│   │       └── verify-invite/   # Invitation verification
│   ├── components/              # Reusable React components
│   ├── invite/                  # Invitation acceptance page
│   ├── login/                   # Authentication pages
│   └── trips/                   # Trip management pages
├── components/                  # UI component library
│   ├── theme/                   # Theme configuration
│   └── ui/                      # Base UI components
├── firebase/                    # Firebase configuration
├── lib/                         # Utility functions and services
│   ├── pdfGenerator.ts         # Professional PDF report generation
│   ├── tts.ts                  # ElevenLabs voice AI integration
│   └── utils.ts                # General utilities
├── public/                      # Static assets
├── stores/                      # Zustand state management
│   ├── useAuthStore.ts         # Authentication state
│   ├── useExpenseStore.ts      # Expense management
│   └── useTripStore.ts         # Trip management
└── package.json                # Dependencies and scripts
```

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start development server with Turbopack
npm run allmight     # Start dev server on custom host (127.0.0.1:3001)

# Production
npm run build        # Build for production
npm start           # Start production server

# Code Quality
npm run lint        # Run ESLint
```

## 🆕 Recent Updates & Features

### Voice AI Integration (Latest)
- **ElevenLabs TTS**: Professional voice announcements for expense confirmations
- **Mobile Optimization**: Voice toggle specifically designed for mobile expense entry
- **Credit Protection**: Built-in API usage monitoring to prevent unexpected charges
- **Unified Voice System**: Prevents overlapping announcements for better UX

### Automated Email System (Latest)
- **Trip Summary Emails**: Comprehensive automated reports when trips are completed
- **PDF Attachments**: Professional multi-page reports with complete expense analytics
- **Member Notifications**: All trip members receive automatic email summaries
- **HTML Templates**: Beautiful, responsive email layouts with full trip details

### Enhanced Data Accuracy (Latest)
- **Precision Calculations**: Improved balance calculations with proper floating-point rounding
- **Multi-Currency Support**: Accurate currency formatting throughout PDF and email reports
- **Date Consistency**: Standardized date formatting across all interfaces
- **Settlement Optimization**: Improved algorithms to minimize required transactions

## 🎯 Key Technical Achievements

- **Real-time Voice Feedback**: Instant audio confirmation for expense submissions
- **Professional PDF Generation**: Multi-page reports with expense analytics and settlement instructions
- **Automated Email Delivery**: Comprehensive trip summaries with PDF attachments sent to all members
- **Precision Financial Calculations**: Accurate balance calculations with proper rounding to avoid floating-point errors
- **Mobile-First Voice UX**: Optimized voice controls for hands-free expense entry on mobile devices
- **API Credit Management**: Built-in monitoring and protection for external service usage

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Voice AI**: ElevenLabs for professional text-to-speech capabilities
- **Email Service**: Resend for reliable email delivery and professional templates
- **PDF Generation**: jsPDF and jspdf-autotable for comprehensive report generation
- **Design Inspiration**: Modern glass morphism design trends
- **Icons**: Lucide React and React Icons libraries
- **UI Components**: Radix UI for accessible primitives
- **Database**: Firebase for real-time data management and authentication

## 📞 Support

For support, email [support@tripsliptos.app](mailto:support@tripsliptos.app) or join our community discussions.

**Features Highlights:**
- 🎤 Voice AI announcements with ElevenLabs
- 📧 Automated email summaries with PDF reports
- 💰 Precision financial calculations
- 📱 Mobile-optimized voice controls
- 🔒 API credit protection and monitoring

---

<div align="center">
  Made with ❤️ by [Pranesh Joshi](https://github.com/pranesh25joshi)
  
  **[Live Demo](https://tripper.pranesh.xyz)** | **[Report Bug](https://github.com/pranesh25joshi/tripperrrrrOP/issues)** | **[Request Feature](https://github.com/pranesh25joshi/tripperrrrrOP/issues)**
</div>
