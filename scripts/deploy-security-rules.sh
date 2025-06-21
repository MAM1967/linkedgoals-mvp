#!/bin/bash

# Deploy Firestore Security Rules to All Environments
# This script deploys environment-specific security rules to each Firebase project

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    print_error "Firebase CLI not found. Please install it first:"
    echo "npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in
if ! firebase projects:list &> /dev/null; then
    print_warning "Please log in to Firebase first:"
    echo "firebase login"
    exit 1
fi

print_status "Starting deployment of Firestore security rules to all environments..."

# Function to deploy rules to environment
deploy_rules() {
    local env_name=$1
    local project_id=$2
    local rules_file=$3
    
    print_status "Deploying rules to $env_name environment..."
    
    # Check if rules file exists
    if [ ! -f "$rules_file" ]; then
        print_error "Rules file not found: $rules_file"
        return 1
    fi
    
    # Switch to the environment
    firebase use "$project_id"
    
    # Deploy rules using the specific rules file
    if firebase deploy --only firestore:rules --project="$project_id"; then
        print_success "Rules deployed successfully to $env_name ($project_id)"
    else
        print_error "Failed to deploy rules to $env_name ($project_id)"
        return 1
    fi
}

# Backup current firebase.json
cp firebase.json firebase.json.backup
print_status "Created backup of firebase.json"

# Deploy to Development Environment
print_status "=== DEVELOPMENT ENVIRONMENT ==="
# Temporarily update firebase.json to use dev rules
sed 's/"firestore.rules"/"firestore.rules.dev"/g' firebase.json > firebase.json.tmp
mv firebase.json.tmp firebase.json

deploy_rules "Development" "linkedgoals-dev" "firestore.rules.dev"

echo

# Deploy to Staging Environment  
print_status "=== STAGING ENVIRONMENT ==="
# Temporarily update firebase.json to use staging rules
cp firebase.json.backup firebase.json
sed 's/"firestore.rules"/"firestore.rules.staging"/g' firebase.json > firebase.json.tmp
mv firebase.json.tmp firebase.json

deploy_rules "Staging" "linkedgoals-staging" "firestore.rules.staging"

echo

# Deploy to Production Environment
print_status "=== PRODUCTION ENVIRONMENT ==="
# Restore original firebase.json (uses firestore.rules)
cp firebase.json.backup firebase.json

deploy_rules "Production" "linkedgoals-d7053" "firestore.rules"

# Cleanup
rm -f firebase.json.backup firebase.json.tmp

# Switch back to production as default
firebase use linkedgoals-d7053

echo
print_success "🎉 Security rules deployed to all environments successfully!"
echo
print_status "Summary:"
echo "✅ Development (linkedgoals-dev) - using firestore.rules.dev"
echo "✅ Staging (linkedgoals-staging) - using firestore.rules.staging"  
echo "✅ Production (linkedgoals-d7053) - using firestore.rules"
echo
print_warning "Note: Each environment has different security rules:"
echo "- Development: Permissive rules for easier testing"
echo "- Staging: Production-like rules with test data"
echo "- Production: Strict security rules"