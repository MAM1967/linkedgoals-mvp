# Development Environment Setup

This guide explains how to set up the local development environment for LinkedGoals MVP.

## Prerequisites

### Required Software Versions

- **Node.js**: v20.x or higher (required for Cloud Functions)
- **npm**: v10.x or higher (comes with Node.js)
- **Git**: Latest version
- **Firebase CLI**: v13.x or higher

#### Version Management

We recommend using `nvm` (Node Version Manager) to manage Node.js versions:

```bash
# Install Node.js v20 (latest LTS)
nvm install 20
nvm use 20

# Verify versions
node --version  # Should show v20.x.x
npm --version   # Should show v10.x.x
```

### Firebase CLI Installation

```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login

# Verify installation
firebase --version
```

## Project Setup

### 1. Clone the Repository

```bash
git clone https://github.com/MAM1967/linkedgoals-mvp.git
cd linkedgoals-mvp
```

### 2. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install Cloud Functions dependencies
cd functions
npm install
cd ..
```

### 3. Environment Variables Configuration

#### Frontend Environment Variables

Create a `.env` file in the project root by copying from the example:

```bash
cp env.example .env
```

Configure the following variables in `.env`:

```bash
# LinkedIn OAuth Configuration
VITE_LINKEDIN_CLIENT_ID=7880c93kzzfsgj
VITE_LINKEDIN_REDIRECT_URI=http://localhost:5173/linkedin

# Firebase Configuration (for local development)
VITE_FIREBASE_PROJECT_ID=linkedgoals-d7053
VITE_FIREBASE_AUTH_DOMAIN=linkedgoals-d7053.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://linkedgoals-d7053-default-rtdb.firebaseio.com
VITE_FIREBASE_STORAGE_BUCKET=linkedgoals-d7053.firebasestorage.app
```

#### Backend Environment Variables (Cloud Functions)

Configure secrets for Cloud Functions (required for LinkedIn integration):

```bash
# Set LinkedIn client secret
firebase functions:secrets:set LINKEDIN_CLIENT_SECRET

# When prompted, enter your LinkedIn app client secret
```

### 4. Firebase Project Configuration

```bash
# Select the Firebase project
firebase use linkedgoals-d7053

# Or if working with multiple projects
firebase use --add linkedgoals-d7053
```

## Database Setup (Firebase Emulators)

### Start Firebase Emulators

The project is configured to use Firebase Emulators for local development:

```bash
# Start all emulators (recommended for full development)
firebase emulators:start

# Or start specific emulators only
npm run firebase:emulators  # Firestore + Auth only
```

### Emulator Configuration

The emulators will start on the following ports:

- **Firestore**: http://localhost:8080
- **Authentication**: http://localhost:9099
- **Firebase UI**: http://localhost:4000 (emulator dashboard)
- **Hosting**: http://localhost:5000
- **Cloud Functions**: http://localhost:5001

### Emulator Data Persistence

- Emulator data is stored in the `.firebase/` directory
- Data persists between emulator restarts
- To reset emulator data: `firebase emulators:start --import=./seed-data --export-on-exit`

## Local Development Server

### Starting the Development Server

```bash
# Start the Vite development server
npm run dev

# Alternative: Start with emulators
npm run dev & firebase emulators:start
```

The application will be available at:

- **Frontend**: http://localhost:5173
- **Firebase Emulator UI**: http://localhost:4000

### Development Scripts

```bash
# Development server with hot reload
npm run dev

# Type checking
npm run build

# Linting
npm run lint

# Testing
npm run test              # Unit tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report
npm run test:e2e          # End-to-end tests
npm run test:e2e:open     # Interactive E2E testing

# Firebase operations
npm run firebase:emulators  # Start emulators
```

## IDE Configuration

### Required VS Code Extensions

The project includes recommended extensions in `.vscode/extensions.json`:

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "firebase.vscode-firebase-explorer",
    "ms-vscode.vscode-json"
  ]
}
```

### VS Code Settings

Configure your VS Code workspace with these settings:

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  }
}
```

### Code Formatting

The project uses Prettier with these settings (`.prettierrc`):

- **Semi-colons**: Required
- **Quotes**: Double quotes
- **Tab width**: 2 spaces
- **Trailing commas**: ES5 style

## Mock Data Setup

### Seeding Development Data

For development with realistic data, use the Firebase Emulator with seed data:

```bash
# Create seed data (first time setup)
firebase emulators:start --import=./seed-data --export-on-exit

# Use the admin dashboard to create test users and goals
# Visit http://localhost:5173/admin/login
```

### Test User Accounts

For development, create these test accounts through the emulator:

```typescript
// Test users for development
const testUsers = [
  {
    email: "developer@linkedgoals.app",
    displayName: "Developer User",
    role: "user",
  },
  {
    email: "admin@linkedgoals.app",
    displayName: "Admin User",
    role: "admin",
  },
];
```

### LinkedIn OAuth Development

For LinkedIn OAuth testing in development:

1. **Create LinkedIn App** (if not exists):

   - Go to [LinkedIn Developer Portal](https://developer.linkedin.com/)
   - Create new app with redirect URI: `http://localhost:5173/linkedin`

2. **Update Environment Variables**:

   ```bash
   VITE_LINKEDIN_REDIRECT_URI=http://localhost:5173/linkedin
   ```

3. **Test OAuth Flow**:
   - Visit http://localhost:5173/login
   - Click "Login with LinkedIn"
   - Authorize the application
   - Should redirect back to local dashboard

## Troubleshooting

### Common Issues

#### Port Conflicts

```bash
# Check if ports are in use
lsof -i :5173  # Vite dev server
lsof -i :8080  # Firestore emulator

# Kill processes if needed
kill -9 <PID>
```

#### Node Version Issues

```bash
# Ensure Node.js v20+
node --version

# If using older version
nvm install 20
nvm use 20
```

#### Firebase Authentication Issues

```bash
# Re-login to Firebase
firebase logout
firebase login

# Check project selection
firebase projects:list
firebase use linkedgoals-d7053
```

#### Dependency Issues

```bash
# Clear npm cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install

# Clear function dependencies too
rm -rf functions/node_modules functions/package-lock.json
cd functions && npm install && cd ..
```

### Environment Verification

Run this verification script to ensure everything is set up correctly:

```bash
# Check Node.js and npm versions
node --version && npm --version

# Check Firebase CLI
firebase --version

# Check project dependencies
npm list --depth=0

# Verify environment variables
echo "LinkedIn Client ID: $VITE_LINKEDIN_CLIENT_ID"
echo "Redirect URI: $VITE_LINKEDIN_REDIRECT_URI"

# Test build process
npm run build
```

## Development Workflow

### Daily Development Setup

1. **Start Emulators**:

   ```bash
   firebase emulators:start
   ```

2. **Start Development Server** (in new terminal):

   ```bash
   npm run dev
   ```

3. **Open Application**:
   - Frontend: http://localhost:5173
   - Emulator UI: http://localhost:4000

### Before Committing Code

```bash
# Run linting and fix issues
npm run lint

# Run tests
npm run test

# Build to check for errors
npm run build
```

### Hot Reload Features

- **Frontend**: Automatic reload on file changes
- **Firestore Rules**: Auto-reload when `firestore.rules` changes
- **Cloud Functions**: Auto-rebuild with `--watch` flag
- **TypeScript**: Incremental compilation with type checking

This setup provides a complete development environment that mirrors the production system while enabling rapid development and testing.
