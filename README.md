# LinkedGoals MVP

A comprehensive goal management platform with LinkedIn integration and admin dashboard for user management and GDPR/CCPA compliance.

> ✅ **Deployment Status**: All critical GitHub Actions issues resolved (Dec 2024)

## 🚀 Features

### User Features

- **LinkedIn OAuth Integration**: Secure authentication via LinkedIn
- **Goal Management**: Create, track, and manage personal goals
- **Real-time Updates**: Live synchronization with Firebase
- **Responsive Design**: Works on desktop and mobile devices

### Admin Features ✅

- **Admin Dashboard**: Comprehensive administrative interface
- **User Management**: View, disable, enable, and delete user accounts
- **Goal Oversight**: Monitor all user goals across the platform
- **Metrics & Analytics**: Real-time platform statistics
- **GDPR/CCPA Compliance**: Full user data management for legal compliance

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Firebase (Firestore, Authentication, Cloud Functions)
- **Styling**: CSS3 with modern design patterns
- **Authentication**: Firebase Auth + LinkedIn OAuth + Admin Email/Password
- **Deployment**: Firebase Hosting + Cloud Functions

## 📁 Project Structure

```
src/
├── components/          # Reusable React components
├── pages/              # Main application pages
│   ├── admin/          # Admin dashboard pages
│   │   ├── AdminDashboard.tsx
│   │   ├── UserManagement.tsx
│   │   └── GoalManagement.tsx
│   └── ...
├── lib/                # Utilities and Firebase config
├── hooks/              # Custom React hooks
└── ...

functions/              # Firebase Cloud Functions
├── src/
│   ├── index.ts        # Main functions (linkedinlogin, manageUser)
│   └── ...
└── ...

docs/                   # Comprehensive project documentation
├── 01-architecture.md
├── 15-admin-dashboard-plan.md
└── ...
```

## 🔧 Development Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Firebase CLI
- Firebase project with Authentication, Firestore, and Functions enabled

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd linkedgoals-mvp
   ```

2. **Install dependencies**

   ```bash
   npm install
   cd functions && npm install && cd ..
   ```

3. **Firebase Configuration**

   - Update `src/lib/firebase.ts` with your Firebase config
   - Set up LinkedIn OAuth credentials
   - Configure Firestore security rules

4. **Environment Setup**
   ```bash
   # Set up Firebase functions secrets
   firebase functions:secrets:set LINKEDIN_CLIENT_SECRET
   ```

### Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to Firebase
firebase deploy

# Deploy only functions
firebase deploy --only functions

# Run tests
npm run test
```

## 🔐 Admin Dashboard Setup

### 1. Create Admin User

1. Go to Firebase Authentication console
2. Create a new user with email/password
3. Copy the generated UID

### 2. Set Admin Role

1. Go to Firestore console
2. Create document in `users` collection:
   ```javascript
   // Document ID: [copied UID]
   {
     email: "admin@example.com",
     fullName: "Admin User",
     role: "admin",
     createdAt: [current timestamp]
   }
   ```

### 3. Access Admin Dashboard

- Navigate to `/admin`
- Login with admin credentials
- Access user management, goal oversight, and platform metrics

## 📊 Admin Dashboard Features

### User Management (GDPR/CCPA Compliant)

- **View Users**: Paginated list with search and filters
- **Disable Users**: Block access while preserving data
- **Enable Users**: Restore access for disabled accounts
- **Delete Users**: Permanent removal with confirmation
- **User Status**: Visual indicators for account status

### Analytics & Metrics

- Total registered users
- New users in last 24 hours
- Total goals created
- Real-time platform statistics

### Goal Management

- View all goals across all users
- Goal details and creation dates
- User attribution and tracking

## 🔒 Security & Compliance

### Authentication

- Firebase Authentication with custom tokens
- LinkedIn OAuth integration
- Separate admin authentication system
- Role-based access control

### Data Protection

- Firestore security rules with admin privileges
- User data isolation
- Audit trails for admin actions
- GDPR/CCPA compliance features

### Security Rules

```javascript
// Firestore rules include admin helper function
function isAdmin() {
  return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}
```

## 🚀 Deployment

### Frontend Deployment

```bash
npm run build
firebase deploy --only hosting
```

### Backend Deployment

```bash
cd functions
npm run build
firebase deploy --only functions
```

### Full Deployment

```bash
npm run build
firebase deploy
```

## 📚 Documentation

Comprehensive documentation is available in the `docs/` directory:

- **Architecture**: System design and data flow
- **File Structure**: Detailed breakdown of project organization
- **Development Setup**: Environment configuration guide
- **Admin Dashboard**: Complete admin feature documentation
- **Testing**: Testing strategies and guidelines
- **Deployment**: Production deployment guide

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e
```

## 🔄 Development Workflow

### For Feature Development

1. Create feature branch
2. Make changes
3. Test locally with `npm run dev`
4. Build and test with `npm run build && npm run preview`
5. Deploy functions if needed: `firebase deploy --only functions`
6. Create pull request

### For Admin Dashboard Changes

1. Make frontend changes
2. Update functions if needed
3. Build project: `npm run build`
4. Test with: `npm run preview`
5. Deploy: `firebase deploy`

## 📈 Platform Status

- ✅ User Authentication (LinkedIn OAuth)
- ✅ Goal Management System
- ✅ Real-time Data Sync
- ✅ Admin Dashboard (Complete)
- ✅ User Management (GDPR/CCPA Compliant)
- ✅ Cloud Functions (Gen 2)
- ✅ Security Rules
- ✅ Production Deployment

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- Check the documentation in `docs/`
- Review Firebase Console logs
- Check Firestore security rules
- Verify admin role assignments

## 🎉 Recent Updates

- ✅ **Admin Dashboard**: Fully implemented with user management
- ✅ **GDPR/CCPA Compliance**: Complete user data management
- ✅ **Cloud Functions**: Updated to Gen 2 with improved performance
- ✅ **Security**: Enhanced role-based access control
- ✅ **Documentation**: Comprehensive project documentation
