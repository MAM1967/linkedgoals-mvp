# Dependencies & Package Management

This document provides information about the project's dependencies and how to manage them in the LinkedGoals MVP.

## Package Manager

The project uses **npm** as the package manager, evidenced by `package-lock.json` files in both the root directory and the `functions/` directory.

## Frontend Dependencies

### Core Framework Dependencies

#### **React Ecosystem** (v18.2.0)

- **`react`** & **`react-dom`**: Core React library for building user interfaces
- **`@types/react`** & **`@types/react-dom`**: TypeScript definitions for React
- **Why chosen**: Industry standard for building modern web applications with strong TypeScript support

#### **React Router** (v6.0.0)

- **`react-router-dom`**: Client-side routing for single-page application navigation
- **`@types/react-router-dom`**: TypeScript definitions
- **Why chosen**: Standard routing solution for React apps with excellent TypeScript support

#### **TypeScript** (v5.0.2)

- **`typescript`**: Static type checking for JavaScript
- **Why chosen**: Essential for large-scale applications, provides type safety and better developer experience

### UI & Styling Dependencies

#### **Icon Libraries**

- **`@fortawesome/fontawesome-svg-core`** (v6.7.2): Core FontAwesome library
- **`@fortawesome/free-solid-svg-icons`** & **`@fortawesome/free-brands-svg-icons`**: Icon sets
- **`@fortawesome/react-fontawesome`**: React integration for FontAwesome
- **`react-icons`** (v4.12.0): Alternative icon library
- **Why chosen**: Comprehensive icon libraries with React integration

#### **Charts & Data Visualization**

- **`chart.js`** (v4.4.9): Canvas-based charting library
- **`react-chartjs-2`** (v5.3.0): React wrapper for Chart.js
- **Why chosen**: Robust charting solution for goal progress visualization

### Firebase Integration

#### **Firebase SDK** (v11.9.0)

- **`firebase`**: Complete Firebase SDK for web
- **Services used**: Authentication, Firestore, Cloud Functions, Hosting
- **Why chosen**: Comprehensive backend-as-a-service with real-time capabilities

### Development & Build Tools

#### **Vite** (v6.3.5)

- **`vite`**: Modern build tool and development server
- **`@vitejs/plugin-react`**: React integration for Vite
- **Why chosen**: Faster build times and hot module replacement compared to webpack

#### **Testing Framework**

- **`jest`** (v29.0.0): JavaScript testing framework
- **`@testing-library/react`** (v14.0.0): React testing utilities
- **`@testing-library/jest-dom`**: Custom Jest matchers for DOM testing
- **`jest-environment-jsdom`**: Browser-like environment for testing
- **Why chosen**: Industry standard testing stack with excellent React support

#### **Code Quality Tools**

- **`eslint`** (v8.45.0): JavaScript/TypeScript linting
- **`@typescript-eslint/eslint-plugin`** & **`@typescript-eslint/parser`**: TypeScript ESLint integration
- **`globals`**: Global variables definitions for linting
- **Why chosen**: Enforces consistent code style and catches potential errors

### Specialized Dependencies

#### **Selenium WebDriver** (v4.33.0)

- **Purpose**: End-to-end testing automation
- **Why chosen**: Cross-browser testing capabilities for integration tests

## Backend Dependencies (Cloud Functions)

### Core Backend Framework

#### **Firebase Admin SDK** (v12.1.0)

- **`firebase-admin`**: Server-side Firebase SDK
- **Purpose**: User management, Firestore operations, custom token creation
- **Why chosen**: Official SDK for server-side Firebase operations

#### **Firebase Functions** (v5.0.1)

- **`firebase-functions`**: Cloud Functions runtime and utilities
- **Purpose**: Serverless function execution environment
- **Why chosen**: Integrated with Firebase ecosystem, auto-scaling

### HTTP Client & Utilities

#### **Axios** (v1.9.0)

- **Purpose**: HTTP client for LinkedIn API integration
- **Why chosen**: Promise-based HTTP client with request/response interceptors

### Backend Development Tools

#### **TypeScript** (v5.8.3)

- **Purpose**: Type safety for Cloud Functions
- **Version**: Slightly newer than frontend for latest Node.js features

#### **ESLint Configuration**

- **`@typescript-eslint/eslint-plugin`** & **`@typescript-eslint/parser`**: TypeScript linting
- **`eslint-config-google`**: Google's ESLint configuration
- **Why chosen**: Follows Google's TypeScript style guide for Cloud Functions

## Dependencies That Should NOT Be Updated

### ⚠️ **Pinned Dependencies**

#### **Firebase Functions** (v5.0.1)

- **Reason**: Major version updates require Node.js runtime changes
- **Impact**: Breaking changes in function deployment and runtime behavior
- **When to update**: Only after thorough testing in development environment

#### **React** (v18.2.0)

- **Reason**: Major version updates require migration effort
- **Impact**: Potential breaking changes in concurrent features and lifecycle methods
- **When to update**: Plan for dedicated migration sprint

#### **Node.js** (v20.x)

- **Reason**: Cloud Functions runtime requirement
- **Impact**: Functions deployment will fail with incorrect Node version
- **When to update**: Only when Firebase supports newer Node.js versions

### 🔍 **Dependencies Requiring Careful Updates**

#### **TypeScript** (v5.x)

- **Reason**: Breaking changes in type checking behavior
- **Testing required**: Full type checking and build verification

#### **Vite** (v6.x)

- **Reason**: Build configuration changes in major versions
- **Testing required**: Development server and production build verification

## Package Manager Commands

### Common Development Tasks

```bash
# Install all dependencies
npm install

# Add new dependency
npm install <package-name>

# Add development dependency
npm install --save-dev <package-name>

# Update dependencies (use with caution)
npm update

# Check for outdated packages
npm outdated

# Security audit
npm audit

# Fix security vulnerabilities
npm audit fix
```

### Frontend-Specific Commands

```bash
# Install frontend dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test

# Run linting
npm run lint
```

### Backend-Specific Commands

```bash
# Install Cloud Functions dependencies
cd functions && npm install

# Build Cloud Functions
cd functions && npm run build

# Deploy functions
cd functions && npm run deploy

# View function logs
cd functions && npm run logs
```

### Version Management

```bash
# Check exact versions
npm list --depth=0

# Check for security vulnerabilities
npm audit

# Update package-lock.json
npm install --package-lock-only

# Clean install (removes node_modules)
rm -rf node_modules package-lock.json && npm install
```

## Handling Dependency Conflicts

### Common Conflict Resolution Strategies

#### **Peer Dependency Conflicts**

```bash
# Install with legacy peer deps (temporary fix)
npm install --legacy-peer-deps

# Force installation (use cautiously)
npm install --force
```

#### **Version Conflicts**

```bash
# Check dependency tree
npm list <package-name>

# Find conflicting dependencies
npm ls --depth=0 | grep "UNMET DEPENDENCY"

# Override dependency versions (package.json)
{
  "overrides": {
    "problematic-package": "^1.2.3"
  }
}
```

#### **TypeScript Version Conflicts**

```bash
# Install specific TypeScript version
npm install --save-dev typescript@5.0.2

# Check TypeScript compiler version
npx tsc --version
```

### Troubleshooting Steps

1. **Clear npm cache**:

   ```bash
   npm cache clean --force
   ```

2. **Delete node_modules and reinstall**:

   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Check for conflicting global packages**:

   ```bash
   npm list -g --depth=0
   ```

4. **Verify Node.js version compatibility**:
   ```bash
   node --version  # Should be v20.x for this project
   ```

## Dependency Update Strategy

### Monthly Maintenance

- Check for security vulnerabilities: `npm audit`
- Review outdated packages: `npm outdated`
- Update patch versions of low-risk dependencies
- Test thoroughly in development environment

### Quarterly Reviews

- Evaluate major version updates for core dependencies
- Plan migration efforts for breaking changes
- Update development dependencies (testing tools, linters)

### Before Production Releases

- Run full dependency audit: `npm audit`
- Verify no high-severity vulnerabilities
- Test all functionality with updated dependencies
- Update package-lock.json: `npm ci`

## Security Considerations

### Vulnerability Management

- Regular security audits with `npm audit`
- Monitor GitHub Dependabot alerts
- Update dependencies with security patches promptly
- Use `npm ci` in CI/CD for reproducible builds

### Best Practices

- Pin exact versions for critical dependencies
- Use `package-lock.json` for version consistency
- Avoid installing packages with `--force` unless necessary
- Review dependency licenses for compliance

This dependency management strategy ensures stable, secure, and maintainable code while enabling controlled updates and improvements.
