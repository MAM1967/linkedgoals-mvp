#!/bin/bash

# Firebase Multi-Environment Setup Script
# This script creates the development and staging Firebase projects

set -e

echo "🚀 Setting up Firebase multi-environment infrastructure..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}❌ Firebase CLI not found. Please install it first:${NC}"
    echo "npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in
if ! firebase projects:list &> /dev/null; then
    echo -e "${YELLOW}⚠️  Please log in to Firebase first:${NC}"
    echo "firebase login"
    exit 1
fi

echo -e "${GREEN}✅ Firebase CLI found and user authenticated${NC}"

# Function to create Firebase project
create_project() {
    local project_id=$1
    local display_name=$2
    
    echo -e "${YELLOW}📋 Creating Firebase project: ${project_id}${NC}"
    
    # Create project
    if firebase projects:create "$project_id" --display-name "$display_name"; then
        echo -e "${GREEN}✅ Project ${project_id} created successfully${NC}"
        
        # Switch to the project
        firebase use "$project_id"
        
        # Enable required APIs
        echo -e "${YELLOW}🔧 Enabling required services for ${project_id}...${NC}"
        
        # Note: API enabling via CLI might require gcloud CLI
        # These commands might need to be run separately via gcloud
        echo "You may need to enable these services manually in the Firebase Console:"
        echo "- Firestore Database"
        echo "- Cloud Functions"
        echo "- Firebase Authentication" 
        echo "- Firebase Hosting"
        echo "- Cloud Storage"
        
        return 0
    else
        echo -e "${RED}❌ Failed to create project ${project_id}${NC}"
        return 1
    fi
}

# Create development environment
echo -e "${YELLOW}🔧 Creating development environment...${NC}"
create_project "linkedgoals-dev" "LinkedGoals Development"

# Create staging environment  
echo -e "${YELLOW}🔧 Creating staging environment...${NC}"
create_project "linkedgoals-staging" "LinkedGoals Staging"

# Switch back to production as default
firebase use linkedgoals-d7053

echo -e "${GREEN}🎉 Firebase projects created successfully!${NC}"
echo
echo -e "${YELLOW}📋 Next steps:${NC}"
echo "1. Update Firebase SDK configurations in src/config/ files"
echo "2. Enable required services in Firebase Console for each project:"
echo "   - https://console.firebase.google.com/project/linkedgoals-dev"
echo "   - https://console.firebase.google.com/project/linkedgoals-staging"
echo "3. Create service accounts for GitHub Actions"
echo "4. Set up GitHub repository secrets"
echo "5. Create LinkedIn OAuth apps for each environment"
echo
echo -e "${GREEN}✅ Multi-environment setup complete!${NC}"