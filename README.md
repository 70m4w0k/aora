<div align="center">
  <br />
  <h1>Aora - Household Management App</h1>
  <br />

  <div>
    <img src="https://img.shields.io/badge/-React_Native-black?style=for-the-badge&logoColor=white&logo=react&color=61DAFB" alt="react.js" />
    <img src="https://img.shields.io/badge/-Appwrite-black?style=for-the-badge&logoColor=white&logo=appwrite&color=FD366E" alt="appwrite" />
    <img src="https://img.shields.io/badge/NativeWind-black?style=for-the-badge&logoColor=white&logo=tailwindcss&color=06B6D4" alt="nativewind" />
  </div>

  <h3 align="center">A Complete Household Management Solution</h3>

   <div align="center">
     Manage your household tasks, expenses, and shopping lists easily and efficiently
    </div>
</div>

## 📋 Table of Contents

1. 🏠 [Introduction](#introduction)
2. ⚙️ [Tech Stack](#tech-stack)
3. 🔋 [Features](#features)
4. 🤸 [Quick Start](#quick-start)
5. 📱 [App Structure](#app-structure)
6. 🔄 [Database Collections](#database-collections)

## 🏠 Introduction

Aora is a comprehensive household management application designed to streamline shared living spaces. Initially adapted from a tutorial project, it has been refactored and enhanced to focus on three main functionalities that every household needs: a shared shopping list, expense tracking and sharing (like Tricount), and a shared chores calendar.

Built with React Native and Expo for cross-platform compatibility, and using Appwrite as a backend service, Aora provides a seamless experience for managing household responsibilities and finances.

## ⚙️ Tech Stack

- **React Native** - Mobile application framework
- **Expo** - Development platform for React Native
- **NativeWind** - Tailwind CSS for React Native
- **Appwrite** - Backend as a Service (BaaS)
- **React Navigation** - Routing and navigation

## 🔋 Features

### 📊 Dashboard
- Overview of pending chores, shopping items, and expenses
- Quick access to all main functionalities
- Personalized user greeting

### 📅 Chores Calendar
- Create and assign recurring household tasks
- Mark chores as completed
- Track chore history with timestamps and assignees
- Weekly view calendar for visual task management
- Filter tasks by status (done/pending)

### 🛒 Shopping List
- Add items with quantities and categories
- Assign shopping responsibilities to household members
- Mark items as purchased
- Filter items by category
- Real-time updates for all household members

### 💰 Expense Sharing
- Track shared expenses (similar to Tricount)
- Split costs between household members
- View balance summary showing who owes what
- Record settlements when debts are paid
- Filter expenses by user involvement

### 👤 User Management
- Secure authentication system
- User profiles with avatar and color assignment
- Clear visualization of who completed which tasks

## 🤸 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Appwrite Account](https://appwrite.io/) (for backend)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/aora.git
   cd aora
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Configure Appwrite:
   - Create a new project in Appwrite
   - Set up the required collections (see [Database Collections](#database-collections))
   - Update the Appwrite configuration in `lib/appwrite.js`

4. Start the development server:
   ```bash
   npm start
   # or
   yarn start
   ```

5. Use Expo Go app on your mobile device to scan the QR code and run the app

### Configuration

1. Create `.env` file from `ENV_TEMPLATE.md`
2. Set your Appwrite endpoint and project IDs
3. See `APPWRITE_CONFIG_SETUP.md` for detailed configuration

## 🚀 Self-Hosted Deployment

To deploy Tipi with your self-hosted Appwrite instance:

1. **Set up Cloudflare Tunnel** (exposes Appwrite without port forwarding):
   - Run `scripts/setup-cloudflare-tunnel.sh` on your self-hosted computer
   - Or follow manual setup in `SELF_HOST_DEPLOYMENT.md`

2. **Configure Appwrite** for public access:
   - See `APPWRITE_TUNNEL_CONFIG.md` for Appwrite configuration

3. **Update app configuration**:
   - Update `.env` with your Cloudflare Tunnel domain
   - See `ENV_TEMPLATE.md` for required variables

4. **Build and deploy**:
   - Build iOS: `npm run build:ios`
   - Build Android: `npm run build:android`
   - Install on devices and test

5. **Verify deployment**:
   - Run `scripts/verify-deployment.sh` to test connectivity
   - Follow `DEPLOYMENT_TESTING_CHECKLIST.md` for comprehensive testing

See `SELF_HOST_DEPLOYMENT.md` for complete deployment guide.

## 📱 App Structure

The app is organized into several main sections:

```
app/
├── (auth)/ - Authentication screens
├── (chores)/ - Chores management screens
├── (tabs)/ - Main tab navigation
│   ├── home.jsx - Dashboard
│   ├── chores.jsx - Chores list view
│   ├── shopping.jsx - Shopping list
│   ├── expenses.jsx - Expense tracking
│   └── profile.jsx - User profile
└── search/ - Search functionality

components/ - Reusable UI components
context/ - Global state management
lib/ - Appwrite integration and utilities
```

## 🔄 Database Collections

The app uses the following Appwrite collections:

1. **userCollection** - Stores user profiles
2. **choresCollection** - Stores chore definitions
3. **choresImplementationCollection** - Tracks chore completions
4. **taskCollection** - Stores recurring tasks
5. **tasksDoneCollection** - Tracks task completions
6. **shoppingItemsCollection** - Stores shopping list items
7. **expensesCollection** - Stores expense records
8. **expenseSettlementsCollection** - Tracks debt settlements

To set up these collections in Appwrite, follow these steps:
1. Create a new project in the Appwrite console
2. Create a new database
3. Create each collection with the appropriate attributes
4. Set up the required indexes and permissions
5. Update the collection IDs in the `appwriteConfig` object in `lib/appwrite.js`
