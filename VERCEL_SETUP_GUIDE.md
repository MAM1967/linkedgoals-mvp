# Vercel Setup Guide for LinkedIn OAuth

This guide will help you migrate from Firebase Functions to Vercel's serverless functions to handle LinkedIn OAuth.

## Why Vercel?

Since you're on Firebase's free Spark plan (which doesn't include Cloud Functions), Vercel provides:

- ✅ **Free serverless functions** (100,000 invocations/month)
- ✅ **Easy deployment** with GitHub integration
- ✅ **No cold starts** for the first few requests
- ✅ **Built-in environment variable management**

## Prerequisites

1. GitHub account
2. LinkedIn Developer App with correct redirect URIs
3. Your LinkedIn Client ID and Client Secret

## Step 1: Install Dependencies

```bash
npm install @vercel/node vercel
```

## Step 2: Create Environment File

Create a `.env` file in your project root (copy from `env.example`):

```bash
# LinkedIn OAuth Configuration
VITE_LINKEDIN_CLIENT_ID=7880c93kzzfsgj
VITE_LINKEDIN_REDIRECT_URI=https://your-domain.vercel.app/linkedin

# API Configuration (for Vercel deployment)
LINKEDIN_CLIENT_ID=7880c93kzzfsgj
LINKEDIN_CLIENT_SECRET=your_actual_client_secret_here
LINKEDIN_REDIRECT_URI=https://your-domain.vercel.app/linkedin
ALLOWED_ORIGIN=https://your-domain.vercel.app
```

## Step 3: Setup Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Sign up with your GitHub account
3. Install the Vercel GitHub app on your repository

## Step 4: Deploy to Vercel

### Option A: Automatic GitHub Deployment (Recommended)

1. Push your code to GitHub
2. In Vercel dashboard, click "New Project"
3. Import your repository
4. Vercel will auto-detect it's a Vite project
5. Add environment variables in Vercel dashboard:
   - `LINKEDIN_CLIENT_ID`: Your LinkedIn app's Client ID
   - `LINKEDIN_CLIENT_SECRET`: Your LinkedIn app's Client Secret
   - `LINKEDIN_REDIRECT_URI`: https://your-project-name.vercel.app/linkedin
   - `ALLOWED_ORIGIN`: https://your-project-name.vercel.app

### Option B: Manual Deployment

```bash
# Install Vercel CLI globally
npm install -g vercel

# Deploy from your project directory
vercel

# Follow the prompts:
# - Link to existing project? N
# - What's your project's name? linkedgoals-mvp
# - In which directory is your code located? ./
# - Want to override the settings? N

# Set environment variables
vercel env add LINKEDIN_CLIENT_SECRET
vercel env add LINKEDIN_REDIRECT_URI
vercel env add ALLOWED_ORIGIN
```

## Step 5: Update LinkedIn App Configuration

1. Go to [LinkedIn Developer Portal](https://developer.linkedin.com/apps)
2. Select your app
3. Go to "Auth" tab
4. Update "Authorized redirect URLs for your app":
   - Add: `https://your-project-name.vercel.app/linkedin`
   - Remove old Firebase URLs if no longer needed

## Step 6: Update Frontend Environment

Update your local `.env` file with your new Vercel domain:

```bash
VITE_LINKEDIN_REDIRECT_URI=https://your-project-name.vercel.app/linkedin
```

## Step 7: Test the Deployment

1. Visit your Vercel URL
2. Click "Sign in with LinkedIn"
3. Check browser developer tools for any errors
4. Verify the OAuth flow completes successfully

## Troubleshooting

### Common Issues:

1. **CORS Errors**:

   - Make sure `ALLOWED_ORIGIN` environment variable is set correctly
   - Check that your domain matches exactly (https vs http)

2. **LinkedIn Redirect URI Mismatch**:

   - Verify the redirect URI in LinkedIn app matches your Vercel domain exactly
   - Make sure you're using `https://` (not `http://`)

3. **Environment Variables Not Working**:

   - In Vercel dashboard, go to Settings > Environment Variables
   - Make sure all variables are set for "Production"
   - Redeploy after adding/changing environment variables

4. **API Route Not Found (404)**:
   - Verify `api/linkedin-login.ts` file exists
   - Check the Vercel function logs in the dashboard

### Vercel Function Logs

To debug your API routes:

1. Go to Vercel dashboard
2. Select your project
3. Go to "Functions" tab
4. Click on your function to see logs

## Development Workflow

For local development with the Vercel API:

```bash
# Run Vercel dev server (simulates Vercel environment locally)
npm run vercel:dev

# In another terminal, run your Vite dev server
npm run dev
```

This allows you to test the API routes locally before deploying.

## Cost Considerations

Vercel Free Plan includes:

- 100,000 function invocations/month
- 100GB bandwidth/month
- 1,000 build minutes/month

This is typically more than enough for MVP testing and small applications.

## Next Steps

1. **Custom Domain**: You can add a custom domain in Vercel settings
2. **Environment Separation**: Set up different environment variables for staging/production
3. **Monitoring**: Use Vercel's built-in analytics to monitor function performance

## Migration Benefits

✅ **No more Firebase Functions caching issues**
✅ **Faster cold starts**
✅ **Better developer experience with instant deployments**
✅ **Free tier that actually works for your use case**
✅ **Integrated with GitHub for automatic deployments**

Your LinkedIn OAuth should now work much more reliably without the Firebase Functions limitations!
