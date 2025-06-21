# GitHub Secrets Setup Guide

This guide explains how to set up the required GitHub repository secrets for multi-environment Firebase deployment.

## Required Secrets

### Development Environment
- `FIREBASE_SERVICE_ACCOUNT_DEV`
- `FIREBASE_TOKEN_DEV`

### Staging Environment  
- `FIREBASE_SERVICE_ACCOUNT_STAGING`
- `FIREBASE_TOKEN_STAGING`

### Production Environment
- `FIREBASE_SERVICE_ACCOUNT_PROD` (or rename existing `FIREBASE_SERVICE_ACCOUNT_LINKEDGOALS_D7053`)
- `FIREBASE_TOKEN_PROD`

## Step 1: Generate Service Account Keys

### For Development Environment

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select the `linkedgoals-dev` project
3. Navigate to **IAM & Admin** > **Service Accounts**
4. Click **Create Service Account**
5. Name: `github-actions-dev`
6. Description: `Service account for GitHub Actions deployment to development`
7. Click **Create and Continue**
8. Grant these roles:
   - Firebase Admin
   - Cloud Functions Admin  
   - Firebase Hosting Admin
9. Click **Done**
10. Find the service account and click the **Keys** tab
11. Click **Add Key** > **Create New Key** > **JSON**
12. Download the JSON file - this is your `FIREBASE_SERVICE_ACCOUNT_DEV` secret

### For Staging Environment

Repeat the above steps for the `linkedgoals-staging` project:
- Service account name: `github-actions-staging`
- Secret name: `FIREBASE_SERVICE_ACCOUNT_STAGING`

### For Production Environment

Repeat the above steps for the `linkedgoals-d7053` project:
- Service account name: `github-actions-prod`
- Secret name: `FIREBASE_SERVICE_ACCOUNT_PROD`

## Step 2: Generate Firebase CI Tokens

For each environment, generate a Firebase CI token:

```bash
# Development
firebase use linkedgoals-dev
firebase login:ci
# Copy the token for FIREBASE_TOKEN_DEV

# Staging  
firebase use linkedgoals-staging
firebase login:ci
# Copy the token for FIREBASE_TOKEN_STAGING

# Production
firebase use linkedgoals-d7053  
firebase login:ci
# Copy the token for FIREBASE_TOKEN_PROD
```

## Step 3: Add Secrets to GitHub

1. Go to your GitHub repository
2. Navigate to **Settings** > **Secrets and variables** > **Actions**
3. Click **New repository secret** for each secret:

### Development Secrets
- **Name**: `FIREBASE_SERVICE_ACCOUNT_DEV`
- **Value**: Entire contents of the dev service account JSON file

- **Name**: `FIREBASE_TOKEN_DEV`  
- **Value**: CI token generated for dev environment

### Staging Secrets
- **Name**: `FIREBASE_SERVICE_ACCOUNT_STAGING`
- **Value**: Entire contents of the staging service account JSON file

- **Name**: `FIREBASE_TOKEN_STAGING`
- **Value**: CI token generated for staging environment

### Production Secrets
- **Name**: `FIREBASE_SERVICE_ACCOUNT_PROD`
- **Value**: Entire contents of the prod service account JSON file

- **Name**: `FIREBASE_TOKEN_PROD`
- **Value**: CI token generated for production environment

## Step 4: Set Up GitHub Environments

1. Go to **Settings** > **Environments**
2. Create environments:
   - `development`
   - `staging` 
   - `production`

3. For production environment, consider adding:
   - **Required reviewers**: Team leads who must approve production deployments
   - **Deployment branches**: Only `main` branch can deploy to production

## Step 5: Verify Setup

Test each environment by pushing to the respective branches:

```bash
# Test development deployment
git checkout -b develop
git push origin develop

# Test staging deployment  
git checkout -b staging
git push origin staging

# Test production deployment
git checkout main
git push origin main
```

## Security Best Practices

1. **Rotate secrets regularly**: Service account keys should be rotated every 90 days
2. **Minimal permissions**: Each service account should have only the permissions needed
3. **Environment protection**: Use GitHub environment protection rules for production
4. **Monitor access**: Review service account usage in Google Cloud Console regularly

## Troubleshooting

### Common Issues

1. **"Insufficient permissions" error**
   - Verify service account has correct roles
   - Check that the project ID matches the secret

2. **"Invalid service account" error**
   - Ensure the entire JSON content is copied correctly
   - Check for extra spaces or missing characters

3. **"Authentication failed" error**
   - Regenerate the Firebase CI token
   - Verify the project ID in the command matches the secret

4. **Workflow not triggering**
   - Check branch names match workflow triggers
   - Verify GitHub environment names match workflow files

### Getting Help

If you encounter issues:
1. Check the GitHub Actions logs for detailed error messages
2. Verify all secrets are set correctly in the repository settings
3. Test Firebase CLI commands locally with the same credentials
4. Review Firebase project permissions in Google Cloud Console

## Verification Checklist

- [ ] All service accounts created in Google Cloud Console
- [ ] All service account keys downloaded
- [ ] All Firebase CI tokens generated
- [ ] All GitHub secrets added
- [ ] GitHub environments configured
- [ ] Test deployments successful for all environments
- [ ] Production environment has proper protection rules