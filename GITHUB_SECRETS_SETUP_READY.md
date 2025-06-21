# 🚀 GitHub Secrets Setup - Ready to Execute

## 📋 **Your Project Information**
```
✅ Development: linkedgoals-development  
✅ Staging:     linkedgoals-staging
✅ Production:  linkedgoals-d7053
```

## 🎯 **Step 1: Generate Firebase CI Tokens (You do this)**

Run these commands in your terminal:

```bash
# Development Token
firebase use linkedgoals-development
firebase login:ci
# Copy the token → This is FIREBASE_TOKEN_DEV

# Staging Token  
firebase use linkedgoals-staging
firebase login:ci
# Copy the token → This is FIREBASE_TOKEN_STAGING

# Production Token
firebase use linkedgoals-d7053
firebase login:ci  
# Copy the token → This is FIREBASE_TOKEN_PROD
```

## 🔑 **Step 2: Create Service Account Keys**

### Development Service Account
1. **Go to**: https://console.cloud.google.com/iam-admin/serviceaccounts?project=linkedgoals-development
2. **Click**: "Create Service Account"
3. **Name**: `github-actions-dev`
4. **Roles**: Add these roles:
   - Firebase Admin
   - Cloud Functions Admin
   - Firebase Hosting Admin
5. **Create Key**: JSON format
6. **Download** → This JSON content is `FIREBASE_SERVICE_ACCOUNT_DEV`

### Staging Service Account  
1. **Go to**: https://console.cloud.google.com/iam-admin/serviceaccounts?project=linkedgoals-staging
2. **Click**: "Create Service Account"
3. **Name**: `github-actions-staging`
4. **Roles**: Same as above
5. **Create Key**: JSON format
6. **Download** → This JSON content is `FIREBASE_SERVICE_ACCOUNT_STAGING`

### Production Service Account
1. **Go to**: https://console.cloud.google.com/iam-admin/serviceaccounts?project=linkedgoals-d7053
2. **Click**: "Create Service Account" 
3. **Name**: `github-actions-prod`
4. **Roles**: Same as above
5. **Create Key**: JSON format
6. **Download** → This JSON content is `FIREBASE_SERVICE_ACCOUNT_PROD`

## 🔐 **Step 3: Add Secrets to GitHub**

1. **Go to your repo**: `https://github.com/YOUR_USERNAME/YOUR_REPO_NAME/settings/secrets/actions`
2. **Click**: "New repository secret" for each:

### Development Secrets
```
Name: FIREBASE_SERVICE_ACCOUNT_DEV
Value: [Entire contents of dev service account JSON file]

Name: FIREBASE_TOKEN_DEV  
Value: [Token from firebase login:ci for linkedgoals-development]
```

### Staging Secrets
```
Name: FIREBASE_SERVICE_ACCOUNT_STAGING
Value: [Entire contents of staging service account JSON file]

Name: FIREBASE_TOKEN_STAGING
Value: [Token from firebase login:ci for linkedgoals-staging]
```

### Production Secrets
```
Name: FIREBASE_SERVICE_ACCOUNT_PROD
Value: [Entire contents of production service account JSON file]

Name: FIREBASE_TOKEN_PROD
Value: [Token from firebase login:ci for linkedgoals-d7053]
```

## 🛡️ **Step 4: Set Up GitHub Environments**

1. **Go to**: `https://github.com/YOUR_USERNAME/YOUR_REPO_NAME/settings/environments`
2. **Create environments**:
   - `development`
   - `staging` 
   - `production`

3. **For production**, add protection:
   - ✅ Required reviewers (optional)
   - ✅ Deployment branches: `main` only

## ✅ **Step 5: Test the Setup**

After adding all secrets, test each environment:

```bash
# Test development (auto-deploys to linkedgoals-development)
git checkout develop
git push origin develop

# Test staging (auto-deploys to linkedgoals-staging)  
git checkout staging
git push origin staging

# Test production (auto-deploys to linkedgoals-d7053)
git checkout main
git push origin main
```

## 🎯 **Quick Checklist**

- [ ] Generated 3 Firebase CI tokens
- [ ] Created 3 service accounts in Google Cloud Console
- [ ] Downloaded 3 JSON key files
- [ ] Added 6 secrets to GitHub repository
- [ ] Created 3 GitHub environments
- [ ] Tested deployments work

## 🆘 **If You Need Help**

**Service Account Roles Issue?**
```bash
# Add roles via CLI if needed:
gcloud projects add-iam-policy-binding linkedgoals-development \
  --member="serviceAccount:github-actions-dev@linkedgoals-development.iam.gserviceaccount.com" \
  --role="roles/firebase.admin"
```

**GitHub Actions Not Triggering?**
- Check branch names match workflow files
- Verify secrets are named exactly as shown above
- Check GitHub Actions tab for error details

**Firebase Permission Errors?**
- Verify project IDs match exactly
- Regenerate CI tokens if needed
- Check service account has correct roles

---

**🚀 Ready to go!** Follow these steps and you'll have full CI/CD automation for all three environments.