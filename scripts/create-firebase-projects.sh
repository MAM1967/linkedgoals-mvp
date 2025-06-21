#!/bin/bash

# Firebase Multi-Environment Setup Script
# This script creates the development and staging Firebase projects and configures them

set -e

echo "🚀 Setting up Firebase multi-environment infrastructure..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Function to create Firebase project and get configuration
create_project() {
    local project_id=$1
    local display_name=$2
    local env_type=$3
    
    echo -e "${YELLOW}📋 Creating Firebase project: ${project_id}${NC}"
    
    # Create project
    if firebase projects:create "$project_id" --display-name "$display_name"; then
        echo -e "${GREEN}✅ Project ${project_id} created successfully${NC}"
        
        # Switch to the project
        firebase use "$project_id"
        
        # Initialize Firebase services
        echo -e "${BLUE}🔧 Initializing Firebase services for ${project_id}...${NC}"
        
        # Enable Firestore
        firebase firestore:databases:create --location=us-central1 --project="$project_id" || true
        
        # Deploy Firestore rules for the environment
        if [ "$env_type" = "dev" ]; then
            firebase deploy --only firestore:rules --project="$project_id" --config="firestore.rules.dev" || true
        elif [ "$env_type" = "staging" ]; then
            firebase deploy --only firestore:rules --project="$project_id" --config="firestore.rules.staging" || true
        fi
        
        # Create a web app and get configuration
        echo -e "${BLUE}📱 Creating web app for ${project_id}...${NC}"
        
        # Add web app (this will return the config)
        WEB_APP_CONFIG=$(firebase apps:create web "LinkedGoals-$env_type" --project="$project_id" 2>/dev/null || echo "App creation may have failed")
        
        # Get the Firebase config
        echo -e "${BLUE}📋 Getting Firebase configuration for ${project_id}...${NC}"
        CONFIG_OUTPUT=$(firebase apps:sdkconfig web --project="$project_id" 2>/dev/null || echo "Config retrieval may have failed")
        
        # Save configuration to file for manual update
        echo "$CONFIG_OUTPUT" > "firebase-config-$env_type.js"
        echo -e "${GREEN}✅ Configuration saved to firebase-config-$env_type.js${NC}"
        
        echo -e "${YELLOW}🔧 Manual steps required for ${project_id}:${NC}"
        echo "1. Go to https://console.firebase.google.com/project/${project_id}"
        echo "2. Enable Authentication > Sign-in method > Add new provider > Custom"
        echo "3. Enable Firestore Database"
        echo "4. Enable Cloud Functions"
        echo "5. Enable Hosting"
        echo "6. Copy the configuration from firebase-config-$env_type.js to src/config/firebase-$env_type.ts"
        echo
        
        return 0
    else
        echo -e "${RED}❌ Failed to create project ${project_id}${NC}"
        return 1
    fi
}

# Function to update configuration files
update_config_file() {
    local env_type=$1
    local linkedin_client_id=$2
    
    local config_file="src/config/firebase-$env_type.ts"
    
    if [ -f "firebase-config-$env_type.js" ]; then
        echo -e "${BLUE}🔧 Updating configuration file: $config_file${NC}"
        
        # Note: Manual intervention required here since config format varies
        echo -e "${YELLOW}⚠️  Please manually update $config_file with values from firebase-config-$env_type.js${NC}"
        echo "   and set linkedinClientId to: $linkedin_client_id"
    fi
}

# Get LinkedIn client IDs for different environments
LINKEDIN_PROD_CLIENT_ID="7880c93kzzfsgj"
LINKEDIN_DEV_CLIENT_ID="7880c93kzzfsgj-dev"  # Will need separate dev app
LINKEDIN_STAGING_CLIENT_ID="7880c93kzzfsgj-staging"  # Will need separate staging app

echo -e "${BLUE}📋 Project Information:${NC}"
echo "Production: linkedgoals-d7053 (existing)"
echo "Development: linkedgoals-dev (to be created)"  
echo "Staging: linkedgoals-staging (to be created)"
echo

# Create development environment
echo -e "${YELLOW}🔧 Creating development environment...${NC}"
create_project "linkedgoals-dev" "LinkedGoals Development" "dev"
update_config_file "dev" "$LINKEDIN_DEV_CLIENT_ID"

echo

# Create staging environment  
echo -e "${YELLOW}🔧 Creating staging environment...${NC}"
create_project "linkedgoals-staging" "LinkedGoals Staging" "staging"
update_config_file "staging" "$LINKEDIN_STAGING_CLIENT_ID"

echo

# Switch back to production as default
firebase use linkedgoals-d7053

echo -e "${GREEN}🎉 Firebase projects created successfully!${NC}"
echo
echo -e "${YELLOW}📋 Configuration Files Created:${NC}"
echo "- firebase-config-dev.js (copy contents to src/config/firebase-dev.ts)"
echo "- firebase-config-staging.js (copy contents to src/config/firebase-staging.ts)"
echo
echo -e "${YELLOW}📋 LinkedIn OAuth Apps Needed:${NC}"
echo "Create these LinkedIn OAuth applications:"
echo "1. LinkedGoals Development - Client ID: $LINKEDIN_DEV_CLIENT_ID"
echo "   Redirect URIs:"
echo "   - https://linkedgoals-dev.web.app/linkedin"
echo "   - http://localhost:5173/linkedin"
echo
echo "2. LinkedGoals Staging - Client ID: $LINKEDIN_STAGING_CLIENT_ID"
echo "   Redirect URIs:"
echo "   - https://linkedgoals-staging.web.app/linkedin"
echo
echo "3. Production already configured - Client ID: $LINKEDIN_PROD_CLIENT_ID"
echo
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo "1. Update environment variable files (.env.development, .env.staging)"
echo "2. Create LinkedIn OAuth apps with above details"
echo "3. Update Firebase configuration files with real values"
echo "4. Set up GitHub repository secrets (see scripts/setup-github-secrets.md)"
echo "5. Deploy security rules: ./scripts/deploy-security-rules.sh"
echo "6. Test deployments: ./scripts/deploy-environment.sh dev"
echo
echo -e "${GREEN}✅ Multi-environment setup complete!${NC}"