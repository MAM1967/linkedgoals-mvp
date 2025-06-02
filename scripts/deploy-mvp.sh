#!/bin/bash

# LinkedGoals MVP Deployment Script
# This script builds, tests, and deploys the app for MVP testing

set -e  # Exit on any error

echo "🚀 LinkedGoals MVP Deployment Starting..."
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Step 1: Clean install dependencies
print_status "Installing dependencies..."
npm ci

# Step 2: Run tests
print_status "Running unit tests..."
if npm test -- --watchAll=false; then
    print_success "All tests passed! ✅"
else
    print_error "Tests failed! Please fix before deploying."
    exit 1
fi

# Step 3: Build for production
print_status "Building for production..."
if npm run build; then
    print_success "Build completed successfully! ✅"
    
    # Show build stats
    echo ""
    print_status "Build Statistics:"
    ls -la dist/
    echo ""
else
    print_error "Build failed! Please check errors above."
    exit 1
fi

# Step 4: Deploy to Firebase
print_status "Deploying to Firebase Hosting..."
if firebase deploy --only hosting; then
    print_success "Deployment completed! ✅"
else
    print_error "Deployment failed! Please check Firebase configuration."
    exit 1
fi

# Step 5: Display URLs and next steps
echo ""
echo "================================================"
print_success "🎉 LinkedGoals MVP Successfully Deployed!"
echo "================================================"
echo ""
print_status "Your app is now available at:"
echo "  📱 Firebase URL: https://linkedgoals-d7053.web.app"
echo "  🌐 Custom Domain: https://app.linkedgoals.app (once DNS is configured)"
echo ""
print_status "Next Steps for MVP Testing:"
echo "  1. Configure custom domain in Firebase Console:"
echo "     https://console.firebase.google.com/project/linkedgoals-d7053/hosting"
echo ""
echo "  2. Update your DNS settings for linkedgoals.app"
echo "     Add A records for 'app' subdomain"
echo ""
echo "  3. Update marketing page links to point to:"
echo "     https://app.linkedgoals.app"
echo ""
echo "  4. Test the app on mobile and desktop"
echo ""
echo "  5. Share with MVP testers!"
echo ""
print_warning "Remember: Custom domain may take 24-48 hours to propagate"
echo ""
print_status "For detailed setup guide, see: DOMAIN_SETUP_GUIDE.md"
echo "================================================" 