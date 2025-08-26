# 🌍 Trip Sliptos - Smart Trip Expense Tracker

<div align="center">
  <img src="public/my-notion-face-transparent.png" alt="Trip Sliptos Logo" width="100" height="100">
  
  **Split Trip Expenses Effortlessly**
  
  Track, split, and settle expenses with friends, family, or colleagues during your trips. No more awkward money conversations.

  ![Next.js](https://img.shields.io/badge/Next.js-15.3.4-black?style=flat-square&logo=next.js)
  ![React](https://img.shields.io/badge/React-19.0.0-blue?style=flat-square&logo=react)
  ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
  ![Firebase](https://img.shields.io/badge/Firebase-11.9.1-orange?style=flat-square&logo=firebase)
  ![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-teal?style=flat-square&logo=tailwindcss)
</div>

## ✨ Features

### 🎯 **Core Functionality**
- **Trip Management**: Create and organize trips with multiple members
- **Expense Tracking**: Add expenses with detailed categorization and splitting options
- **Smart Settlements**: Automatically calculate optimal payment settlements
- **Member Invitations**: Invite people via email with secure token-based system
- **Real-time Updates**: Live expense tracking and member management

### 💰 **Expense Management**
- **Flexible Splitting**: Equal split or custom amounts per person
- **Multiple Categories**: Food, accommodation, transport, activities, shopping, and more
- **Multi-currency Support**: Track expenses in different currencies
- **Payment Tracking**: Record who paid for each expense
- **Expense History**: Complete audit trail of all trip expenses

### 🤝 **Collaboration Features**
- **Member Management**: Add/remove trip members easily
- **Email Invitations**: Send secure invitation links via email
- **Role-based Access**: Trip creators can manage trip settings
- **Guest Access**: Accept invitations and join trips seamlessly

### 📊 **Settlement System**
- **Optimized Calculations**: Minimize the number of transactions needed
- **Clear Breakdown**: See exactly who owes what to whom
- **Settlement Tracking**: Mark settlements as complete
- **Final Summary**: Complete overview when trips are finalized

### 🎨 **Modern UI/UX**
- **Glass Morphism Design**: Beautiful, modern interface with glass effects
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Dark/Light Theme**: Adaptive theming for user preference
- **Smooth Animations**: Polished interactions and transitions
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

### **Backend & Database**
- **Database**: Firebase Firestore (NoSQL)
- **Authentication**: Firebase Auth
- **File Storage**: Firebase Storage
- **API**: Next.js API routes
- **Email Service**: Resend for invitation emails

### **Development Tools**
- **Package Manager**: npm
- **Build Tool**: Next.js with Turbopack
- **Linting**: ESLint
- **Date Handling**: date-fns
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

   # Email Service (Resend)
   RESEND_API_KEY=your_resend_api_key

   # App Configuration
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Configure Firebase**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Firestore Database
   - Enable Authentication (Email/Password)
   - Add your domain to authorized domains

5. **Set up Firestore Security Rules**
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
5. Start adding expenses!

### Adding Expenses
1. Navigate to your trip page
2. Click "Add Expense" button
3. Enter expense details:
   - Name and description
   - Amount and currency
   - Category (food, transport, etc.)
   - Who paid for it
   - How to split it (equal or custom)
4. Select which members to include in the split
5. Save the expense

### Managing Settlements
1. Add all trip expenses throughout your journey
2. When ready, click "Finalize Trip" (trip creator only)
3. View the optimized settlement plan
4. Share settlement details with trip members
5. Mark settlements as complete when paid

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
│   │   └── email/               # Email-related endpoints
│   ├── components/              # Reusable React components
│   ├── invite/                  # Invitation acceptance page
│   ├── login/                   # Authentication pages
│   └── trips/                   # Trip management pages
├── components/                  # UI component library
│   ├── theme/                   # Theme configuration
│   └── ui/                      # Base UI components
├── firebase/                    # Firebase configuration
├── lib/                         # Utility functions
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

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Design Inspiration**: Modern glass morphism design trends
- **Icons**: Lucide React and React Icons libraries
- **UI Components**: Radix UI for accessible primitives
- **Email Service**: Resend for reliable email delivery
- **Database**: Firebase for real-time data management

## 📞 Support

For support, email [support@tripsliptos.app](mailto:support@tripsliptos.app) or join our community discussions.

---

<div align="center">
  Made with ❤️ by [Pranesh Joshi](https://github.com/pranesh25joshi)
  
  **[Live Demo](https://tripper.pranesh.xyz)** | **[Report Bug](https://github.com/pranesh25joshi/tripperrrrrOP/issues)** | **[Request Feature](https://github.com/pranesh25joshi/tripperrrrrOP/issues)**
</div>
