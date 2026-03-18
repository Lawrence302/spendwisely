# SpendWisely - Personal Finance Manager

SpendWisely is a comprehensive, mobile-first personal finance application designed to help users track their income, expenses, and budgets with ease. Built with a modern tech stack and powered by Firebase, it offers real-time synchronization, secure authentication, and a polished user experience.

## 🚀 Key Features

### 🔐 Authentication & Security
*   **Google Sign-In**: Secure and easy authentication using Firebase Auth.
*   **Private Data**: Each user's data is isolated and protected by strict Firestore Security Rules.
*   **Cloud Sync**: All data is stored in the cloud and synced across all devices in real-time.

### 💰 Transaction Management
*   **Income & Expense Tracking**: Record both earnings and spending with detailed categories.
*   **Recurring Transactions**: Set transactions to repeat daily, weekly, monthly, or yearly. The app automatically generates new records when due.
*   **Receipt Attachments**: Upload and store images of receipts directly to transactions using Firebase Storage.
*   **Search & Filter**: Quickly find transactions by description, category, or date range.
*   **Export Data**: Export your transaction history to CSV or JSON formats for external analysis.

### 📊 Budgeting & Analytics
*   **Monthly Budgets**: Set spending limits for specific categories (e.g., Groceries, Entertainment).
*   **Budget Watch**: Proactive Dashboard alerts that warn you when you reach 80% of a budget or exceed it.
*   **Progress Tracking**: Visual indicators show how much of your budget remains, with color-coded status (Green/Amber/Red).
*   **Visual Charts**: Interactive pie charts for category breakdown and line charts for daily spending trends.
*   **Surplus/Deficit Tracking**: Monthly bar charts visualizing the net difference between income and expenses.
*   **Cumulative Balance**: Long-term line chart tracking your total net worth trajectory over time.

### 🎨 Personalization & UX
*   **Dark Mode**: Full support for light and dark themes, synced to your user profile.
*   **Multi-Currency**: Choose from the world's 5 most popular currencies (USD, EUR, GBP, JPY, CAD) with automatic currency symbol formatting.
*   **PWA (Progressive Web App)**: Install SpendWisely on your home screen for a native-like experience, offline access, and faster loading.
*   **Modern Navigation**: Optimized for all devices with a clean top header and dropdown menu on mobile, and a persistent sidebar on desktop.
*   **Responsive UI**: Seamless experience across mobile, tablet, and desktop screens.

---

## 🛠️ Tech Stack

*   **Frontend**: React 18+, TypeScript, Vite
*   **Styling**: Tailwind CSS (Utility-first CSS)
*   **Icons**: Lucide React
*   **Animations**: Motion (Framer Motion)
*   **Backend/Database**: Firebase (Firestore, Authentication, Storage)
*   **Date Handling**: date-fns
*   **Charts**: Recharts

---

## 📂 Project Structure

```text
/
├── src/
│   ├── components/       # Reusable UI and feature components
│   │   ├── Budgets.tsx         # Budget management view
│   │   ├── Charts.tsx          # Data visualization components
│   │   ├── Settings.tsx        # User profile and preferences
│   │   ├── TransactionForm.tsx # Add/Edit transaction modal
│   │   ├── TransactionList.tsx # History view with filters
│   │   └── UI.tsx              # Base UI components (Button, Card, etc.)
│   ├── contexts/         # React Context providers
│   │   └── FirebaseContext.tsx # Global state for Auth and Firestore
│   ├── lib/              # Library configurations and utilities
│   │   ├── firebase.ts         # Firebase SDK initialization
│   │   └── utils.ts            # Helper functions (cn utility)
│   ├── App.tsx           # Main application shell and routing
│   ├── constants.ts      # Global constants (categories, colors)
│   ├── types.ts          # TypeScript interfaces and enums
│   ├── main.tsx          # Application entry point
│   └── index.css         # Global styles and Tailwind imports
├── firebase-blueprint.json # Database schema definition
├── firestore.rules       # Security rules for Firestore
└── package.json          # Project dependencies and scripts
```

---

## 🗄️ Database Schema (Firestore)

### `users` Collection
Stores user profile information and preferences.
*   `uid`: Unique User ID (Document ID)
*   `email`: User's email address
*   `displayName`: User's name
*   `photoURL`: Profile picture URL
*   `currency`: Preferred currency (USD, EUR, etc.)
*   `theme`: Appearance preference (light/dark)

### `transactions` Collection
Stores all income and expense records.
*   `id`: Unique transaction ID
*   `uid`: Owner's User ID
*   `date`: ISO 8601 timestamp
*   `amount`: Numeric value
*   `category`: Transaction category
*   `paymentMethod`: Cash, Card, or Online
*   `description`: Optional notes
*   `type`: "Income" or "Expense"
*   `isRecurring`: Boolean flag
*   `recurringInterval`: daily, weekly, monthly, or yearly
*   `lastGenerated`: Timestamp of last auto-generation
*   `receiptUrl`: URL to receipt image in Storage

### `budgets` Collection
Stores monthly category limits.
*   `id`: Unique budget ID
*   `uid`: Owner's User ID
*   `category`: Budgeted category
*   `amount`: Monthly limit
*   `month`: Format "YYYY-MM"

---

## 🛡️ Security Rules

The application implements a "Default Deny" security model:
*   **Authentication Required**: Users must be signed in to access any data.
*   **Ownership Isolation**: Users can only read, create, update, or delete documents where the `uid` matches their own `auth.uid`.
*   **Data Validation**: All writes are validated against the schema (types, required fields, and constraints like string length and positive amounts).
*   **Immutable Fields**: Critical fields like `uid` and `id` cannot be modified after creation.

---

## ⚙️ Setup & Installation

### Prerequisites
*   Node.js (v18+)
*   Firebase Project

### Local Development
1.  **Clone the repository**.
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Configure Firebase**:
    Create a `firebase-applet-config.json` in the root directory with your Firebase credentials:
    ```json
    {
      "apiKey": "YOUR_API_KEY",
      "authDomain": "YOUR_AUTH_DOMAIN",
      "projectId": "YOUR_PROJECT_ID",
      "storageBucket": "YOUR_STORAGE_BUCKET",
      "messagingSenderId": "YOUR_MESSAGING_SENDER_ID",
      "appId": "YOUR_APP_ID",
      "firestoreDatabaseId": "(default)"
    }
    ```
4.  **Start the development server**:
    ```bash
    npm run dev
    ```
5.  **Build for production**:
    ```bash
    npm run build
    ```

---

## 📖 User Guide

1.  **Sign In**: Click the "Sign in with Google" button on the landing page.
2.  **Install App**: Look for the "Install SpendWisely" banner at the top of your dashboard to add the app to your home screen.
3.  **Dashboard**: View your current month's summary, spending trends, and category breakdown. Check the **Budget Watch** section for any overspending alerts and monitor your **Surplus/Deficit** and **Cumulative Balance** charts.
4.  **Add Record**: Click the Floating Action Button (FAB) on mobile or the "Add Record" button on desktop to log a new transaction.
5.  **Navigation (Mobile)**: Use the top header icons to switch between Dashboard, History, and Budgets. Access Settings, About, and Logout via the "More" (three dots) dropdown menu.
6.  **History**: Navigate to the "History" tab to view, search, and filter all past transactions. You can also edit or delete records here.
7.  **Budgets**: Go to the "Budgets" tab to set monthly limits for your categories and track your progress.
8.  **About**: Learn more about the app's mission and features in the "About" section, accessible from the mobile dropdown or desktop sidebar.
9.  **Settings**: Customize your experience by switching to Dark Mode or changing your preferred currency.

---

## 📄 License
This project is for educational and personal use.
