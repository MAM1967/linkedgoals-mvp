#!/bin/bash

# Multi-Environment Setup Validation Script
# This script validates that all Firebase environments are properly configured

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# Function to print colored output
print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
}

print_check() {
    echo -n "🔍 Checking $1... "
}

print_pass() {
    echo -e "${GREEN}✅ PASS${NC}"
    ((PASSED++))
}

print_fail() {
    echo -e "${RED}❌ FAIL${NC}"
    echo -e "${RED}   $1${NC}"
    ((FAILED++))
}

print_warning() {
    echo -e "${YELLOW}⚠️  WARNING${NC}"
    echo -e "${YELLOW}   $1${NC}"
    ((WARNINGS++))
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if Firebase CLI is installed
check_firebase_cli() {
    print_check "Firebase CLI installation"
    if command -v firebase &> /dev/null; then
        print_pass
    else
        print_fail "Firebase CLI not found. Install with: npm install -g firebase-tools"
    fi
}

# Check if user is logged in
check_firebase_auth() {
    print_check "Firebase authentication"
    if firebase projects:list &> /dev/null; then
        print_pass
    else
        print_fail "Not logged into Firebase. Run: firebase login"
    fi
}

# Check if project aliases exist
check_project_aliases() {
    print_check "Firebase project aliases"
    
    if [ -f ".firebaserc" ]; then
        if grep -q '"dev"' .firebaserc && grep -q '"staging"' .firebaserc && grep -q '"prod"' .firebaserc; then
            print_pass
        else
            print_fail "Missing project aliases in .firebaserc. Run setup script to create them."
        fi
    else
        print_fail ".firebaserc file not found"
    fi
}

# Check if configuration files exist
check_config_files() {
    print_check "Configuration files"
    
    local missing_files=()
    
    if [ ! -f "src/config/firebase-dev.ts" ]; then
        missing_files+=("src/config/firebase-dev.ts")
    fi
    
    if [ ! -f "src/config/firebase-staging.ts" ]; then
        missing_files+=("src/config/firebase-staging.ts")
    fi
    
    if [ ! -f "src/config/firebase-prod.ts" ]; then
        missing_files+=("src/config/firebase-prod.ts")
    fi
    
    if [ ! -f "src/config/index.ts" ]; then
        missing_files+=("src/config/index.ts")
    fi
    
    if [ ${#missing_files[@]} -eq 0 ]; then
        print_pass
    else
        print_fail "Missing files: ${missing_files[*]}"
    fi
}

# Check environment variable files
check_env_files() {
    print_check "Environment variable files"
    
    local missing_env_files=()
    
    if [ ! -f ".env.development" ]; then
        missing_env_files+=(".env.development")
    fi
    
    if [ ! -f ".env.staging" ]; then
        missing_env_files+=(".env.staging")
    fi
    
    if [ ! -f ".env.production" ]; then
        missing_env_files+=(".env.production")
    fi
    
    if [ ${#missing_env_files[@]} -eq 0 ]; then
        print_pass
    else
        print_fail "Missing files: ${missing_env_files[*]}"
    fi
}

# Check security rules files
check_security_rules() {
    print_check "Firestore security rules files"
    
    local missing_rules=()
    
    if [ ! -f "firestore.rules" ]; then
        missing_rules+=("firestore.rules")
    fi
    
    if [ ! -f "firestore.rules.dev" ]; then
        missing_rules+=("firestore.rules.dev")
    fi
    
    if [ ! -f "firestore.rules.staging" ]; then
        missing_rules+=("firestore.rules.staging")
    fi
    
    if [ ${#missing_rules[@]} -eq 0 ]; then
        print_pass
    else
        print_fail "Missing files: ${missing_rules[*]}"
    fi
}

# Check GitHub Actions workflows
check_github_workflows() {
    print_check "GitHub Actions workflows"
    
    local missing_workflows=()
    
    if [ ! -f ".github/workflows/deploy-dev.yml" ]; then
        missing_workflows+=("deploy-dev.yml")
    fi
    
    if [ ! -f ".github/workflows/deploy-staging.yml" ]; then
        missing_workflows+=("deploy-staging.yml")
    fi
    
    if [ ! -f ".github/workflows/firebase-hosting-merge.yml" ]; then
        missing_workflows+=("firebase-hosting-merge.yml")
    fi
    
    if [ ${#missing_workflows[@]} -eq 0 ]; then
        print_pass
    else
        print_fail "Missing workflows: ${missing_workflows[*]}"
    fi
}

# Check package.json scripts
check_package_scripts() {
    print_check "Package.json environment scripts"
    
    if [ -f "package.json" ]; then
        local missing_scripts=()
        
        if ! grep -q '"build:dev"' package.json; then
            missing_scripts+=("build:dev")
        fi
        
        if ! grep -q '"build:staging"' package.json; then
            missing_scripts+=("build:staging")
        fi
        
        if ! grep -q '"deploy:dev"' package.json; then
            missing_scripts+=("deploy:dev")
        fi
        
        if ! grep -q '"deploy:staging"' package.json; then
            missing_scripts+=("deploy:staging")
        fi
        
        if [ ${#missing_scripts[@]} -eq 0 ]; then
            print_pass
        else
            print_fail "Missing scripts: ${missing_scripts[*]}"
        fi
    else
        print_fail "package.json not found"
    fi
}

# Check LinkedIn client ID configuration
check_linkedin_config() {
    print_check "LinkedIn OAuth configuration"
    
    local issues=()
    
    # Check if LinkedIn client ID is configured
    if grep -q "7880c93kzzfsgj" .env.production; then
        # Production is configured
        if grep -q "YOUR_.*_LINKEDIN_CLIENT_ID" src/config/firebase-dev.ts; then
            issues+=("Development LinkedIn client ID not configured")
        fi
        
        if grep -q "YOUR_.*_LINKEDIN_CLIENT_ID" src/config/firebase-staging.ts; then
            issues+=("Staging LinkedIn client ID not configured")
        fi
    else
        issues+=("Production LinkedIn client ID not found")
    fi
    
    if [ ${#issues[@]} -eq 0 ]; then
        print_pass
    else
        print_warning "Issues found: ${issues[*]}"
    fi
}

# Check Firebase projects exist
check_firebase_projects() {
    print_check "Firebase projects accessibility"
    
    local project_issues=()
    
    # Check production project
    if ! firebase use linkedgoals-d7053 &> /dev/null; then
        project_issues+=("Production project (linkedgoals-d7053) not accessible")
    fi
    
    # Check dev project (might not exist yet)
    if ! firebase use linkedgoals-dev &> /dev/null; then
        project_issues+=("Development project (linkedgoals-dev) not accessible - run setup script")
    fi
    
    # Check staging project (might not exist yet)
    if ! firebase use linkedgoals-staging &> /dev/null; then
        project_issues+=("Staging project (linkedgoals-staging) not accessible - run setup script")
    fi
    
    # Switch back to production
    firebase use linkedgoals-d7053 &> /dev/null || true
    
    if [ ${#project_issues[@]} -eq 0 ]; then
        print_pass
    else
        print_warning "Projects need setup: ${project_issues[*]}"
    fi
}

# Check deployment scripts
check_deployment_scripts() {
    print_check "Deployment scripts"
    
    local missing_scripts=()
    
    if [ ! -f "scripts/create-firebase-projects.sh" ]; then
        missing_scripts+=("create-firebase-projects.sh")
    fi
    
    if [ ! -f "scripts/deploy-environment.sh" ]; then
        missing_scripts+=("deploy-environment.sh")
    fi
    
    if [ ! -f "scripts/deploy-security-rules.sh" ]; then
        missing_scripts+=("deploy-security-rules.sh")
    fi
    
    # Check if scripts are executable
    for script in scripts/*.sh; do
        if [ -f "$script" ] && [ ! -x "$script" ]; then
            missing_scripts+=("$script (not executable)")
        fi
    done
    
    if [ ${#missing_scripts[@]} -eq 0 ]; then
        print_pass
    else
        print_fail "Issues: ${missing_scripts[*]}"
    fi
}

# Main validation
main() {
    echo -e "${BLUE}🔍 LinkedGoals Multi-Environment Setup Validation${NC}"
    echo -e "${BLUE}=================================================${NC}"
    
    print_header "Prerequisites"
    check_firebase_cli
    check_firebase_auth
    
    print_header "Project Configuration"
    check_project_aliases
    check_firebase_projects
    
    print_header "Code Configuration"
    check_config_files
    check_env_files
    check_security_rules
    
    print_header "CI/CD Setup"
    check_github_workflows
    check_package_scripts
    check_deployment_scripts
    
    print_header "OAuth Configuration"
    check_linkedin_config
    
    # Summary
    echo -e "\n${BLUE}=== VALIDATION SUMMARY ===${NC}"
    echo -e "${GREEN}✅ Passed: $PASSED${NC}"
    echo -e "${YELLOW}⚠️  Warnings: $WARNINGS${NC}"
    echo -e "${RED}❌ Failed: $FAILED${NC}"
    
    if [ $FAILED -eq 0 ]; then
        echo -e "\n${GREEN}🎉 Setup validation completed successfully!${NC}"
        
        if [ $WARNINGS -gt 0 ]; then
            echo -e "${YELLOW}📋 Next steps to complete setup:${NC}"
            echo "1. Run: ./scripts/create-firebase-projects.sh"
            echo "2. Create LinkedIn OAuth apps (see scripts/setup-linkedin-oauth.md)"
            echo "3. Update Firebase configuration files with real values"
            echo "4. Set up GitHub repository secrets"
        else
            echo -e "${GREEN}✅ All configurations are ready for deployment!${NC}"
        fi
        
        echo -e "\n${BLUE}🚀 Ready to deploy:${NC}"
        echo "./scripts/deploy-environment.sh dev"
        echo "./scripts/deploy-environment.sh staging"
        echo "./scripts/deploy-environment.sh prod"
        
    else
        echo -e "\n${RED}❌ Setup validation failed. Please fix the issues above.${NC}"
        exit 1
    fi
}

# Run validation
main