# 🚀 Exact Setup Steps - Copy & Paste Ready

## Step 1: Generate Firebase CI Tokens

**Run these in your terminal (copy/paste exactly):**

```bash
# Development Token
firebase use linkedgoals-development
firebase login:ci
```
↑ **Copy the token from above** = `FIREBASE_TOKEN_DEV`

```bash
# Staging Token
firebase use linkedgoals-staging
firebase login:ci
```
↑ **Copy the token from above** = `FIREBASE_TOKEN_STAGING`

```bash
# Production Token
firebase use linkedgoals-d7053
firebase login:ci
```
↑ **Copy the token from above** = `FIREBASE_TOKEN_PROD`

---

## Step 2: Create Service Accounts

### Development Service Account
**Click this link:** https://console.cloud.google.com/iam-admin/serviceaccounts?project=linkedgoals-development

**Follow these exact steps:**
1. Click **"Create Service Account"**
2. **Service account name:** `github-actions-dev`
3. **Description:** `GitHub Actions for development environment`
4. Click **"Create and Continue"**
5. **Add roles:** 
   - `Firebase Admin`
   - `Cloud Functions Admin` 
   - `Firebase Hosting Admin`
6. Click **"Continue"** → **"Done"**
7. **In the service accounts list**, click on `github-actions-dev@linkedgoals-development.iam.gserviceaccount.com`
8. Go to **"Keys"** tab → **"Add Key"** → **"Create new key"** → **"JSON"**
9. **Download the JSON file** → **Copy entire contents** = `FIREBASE_SERVICE_ACCOUNT_DEV`

### Staging Service Account
**Click this link:** https://console.cloud.google.com/iam-admin/serviceaccounts?project=linkedgoals-staging

**Follow these exact steps:**
1. Click **"Create Service Account"**
2. **Service account name:** `github-actions-staging`
3. **Description:** `GitHub Actions for staging environment`
4. Click **"Create and Continue"**
5. **Add roles:** 
   - `Firebase Admin`
   - `Cloud Functions Admin` 
   - `Firebase Hosting Admin`
6. Click **"Continue"** → **"Done"**
7. **In the service accounts list**, click on `github-actions-staging@linkedgoals-staging.iam.gserviceaccount.com`
8. Go to **"Keys"** tab → **"Add Key"** → **"Create new key"** → **"JSON"**
9. **Download the JSON file** → **Copy entire contents** = `FIREBASE_SERVICE_ACCOUNT_STAGING`

### Production Service Account
**Click this link:** https://console.cloud.google.com/iam-admin/serviceaccounts?project=linkedgoals-d7053

**Follow these exact steps:**
1. Click **"Create Service Account"**
2. **Service account name:** `github-actions-prod`
3. **Description:** `GitHub Actions for production environment`
4. Click **"Create and Continue"**
5. **Add roles:** 
   - `Firebase Admin`
   - `Cloud Functions Admin` 
   - `Firebase Hosting Admin`
6. Click **"Continue"** → **"Done"**
7. **In the service accounts list**, click on `github-actions-prod@linkedgoals-d7053.iam.gserviceaccount.com`
8. Go to **"Keys"** tab → **"Add Key"** → **"Create new key"** → **"JSON"**
9. **Download the JSON file** → **Copy entire contents** = `FIREBASE_SERVICE_ACCOUNT_PROD`

---

## Step 3: Add Secrets to GitHub

**Go to your GitHub repo secrets:** https://github.com/YOUR_USERNAME/YOUR_REPO_NAME/settings/secrets/actions

**Click "New repository secret" for each of these 6 secrets:**

### Secret 1: Development Service Account
- **Name:** `FIREBASE_SERVICE_ACCOUNT_DEV`
- **Value:** [Entire contents of the dev JSON file you downloaded]

### Secret 2: Development Token
- **Name:** `FIREBASE_TOKEN_DEV`
- **Value:** [Token from Step 1 - development]

### Secret 3: Staging Service Account
- **Name:** `FIREBASE_SERVICE_ACCOUNT_STAGING`
- **Value:** [Entire contents of the staging JSON file you downloaded]

### Secret 4: Staging Token
- **Name:** `FIREBASE_TOKEN_STAGING`
- **Value:** [Token from Step 1 - staging]

### Secret 5: Production Service Account
- **Name:** `FIREBASE_SERVICE_ACCOUNT_PROD`
- **Value:** [Entire contents of the production JSON file you downloaded]

### Secret 6: Production Token
- **Name:** `FIREBASE_TOKEN_PROD`
- **Value:** [Token from Step 1 - production]

---

## Step 4: Create GitHub Environments

**Go to:** https://github.com/YOUR_USERNAME/YOUR_REPO_NAME/settings/environments

**Create these 3 environments:**
1. Click **"New environment"** → Name: `development`
2. Click **"New environment"** → Name: `staging`  
3. Click **"New environment"** → Name: `production`

**For the production environment:**
1. Click **"production"**
2. Check **"Required reviewers"** (optional)
3. Under **"Deployment branches"** → **"Selected branches"** → Add `main`

---

## Step 5: Test the Setup

**After completing steps 1-4, test each environment:**

```bash
# Test development deployment
git checkout develop
git commit --allow-empty -m "Test dev deployment"
git push origin develop

# Test staging deployment
git checkout staging
git commit --allow-empty -m "Test staging deployment"
git push origin staging

# Test production deployment
git checkout main
git commit --allow-empty -m "Test prod deployment"
git push origin main
```

**Check results at:**
- **Development:** https://linkedgoals-development.web.app
- **Staging:** https://linkedgoals-staging.web.app  
- **Production:** https://app.linkedgoals.app

---

## ✅ Verification Checklist

- [ ] Generated 3 Firebase CI tokens
- [ ] Created 3 service accounts with correct roles
- [ ] Downloaded 3 JSON key files
- [ ] Added 6 secrets to GitHub repository (names must match exactly)
- [ ] Created 3 GitHub environments
- [ ] Tested deployments to all 3 environments
- [ ] All environments are accessible via their URLs

---

## 🆘 Troubleshooting

**GitHub Actions not running?**
- Check the **Actions** tab in your GitHub repo
- Verify branch names match exactly: `develop`, `staging`, `main`
- Check that all 6 secrets are named exactly as shown above

**Firebase deployment errors?**
- Verify project IDs in the service account JSON files match
- Check that service accounts have all 3 required roles
- Regenerate CI tokens if they expire

**Service account permission errors?**
- Make sure you added all 3 roles: Firebase Admin, Cloud Functions Admin, Firebase Hosting Admin
- Wait a few minutes for permissions to propagate

---

**🎯 Result:** Full CI/CD automation across all three environments!