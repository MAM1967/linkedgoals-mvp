# 🌐 LinkedGoals Domain Setup Guide

## Current Status

✅ **App Deployed**: https://linkedgoals-d7053.web.app  
🎯 **Goal**: Setup `app.linkedgoals.app` as custom domain

---

## 🚀 **Step 1: Firebase Custom Domain Setup**

### **A. Add Custom Domain in Firebase Console**

1. **Open Firebase Console**: https://console.firebase.google.com/project/linkedgoals-d7053/hosting
2. **Go to Hosting Section** → Custom domains
3. **Click "Add custom domain"**
4. **Enter**: `app.linkedgoals.app`
5. **Follow verification steps** (Firebase will provide DNS records)

### **B. DNS Configuration Required**

Once you click "Add custom domain", Firebase will provide:

```
Type: A
Name: app
Value: 151.101.1.195, 151.101.65.195
```

```
Type: A
Name: app
Value: 151.101.129.195, 151.101.193.195
```

**Add these A records to your `linkedgoals.app` DNS settings**

---

## 🔗 **Step 2: Marketing Page Integration**

### **A. Update Marketing Page Links**

Your marketing page at `linkedgoals.app` should link to:

- **App URL**: `https://app.linkedgoals.app`
- **Demo/Trial buttons**: `https://app.linkedgoals.app`
- **Login/Signup**: `https://app.linkedgoals.app`

### **B. Example HTML Updates**

```html
<!-- Replace existing app links with: -->
<a href="https://app.linkedgoals.app" class="cta-button">
  Try LinkedGoals Free
</a>

<a href="https://app.linkedgoals.app" class="demo-button"> Start Your Goals </a>

<!-- Header navigation -->
<a href="https://app.linkedgoals.app" class="app-link"> Launch App </a>
```

---

## 🧪 **Step 3: MVP Testing Setup**

### **A. Create Test User Guide**

Create a simple guide for your MVP testers:

```markdown
# LinkedGoals MVP Testing Guide

## How to Access:

1. Visit: https://app.linkedgoals.app
2. Create account or sign in
3. Follow the guided goal creation process

## What to Test:

- [ ] Account creation/login
- [ ] Create a SMART goal
- [ ] Daily check-ins
- [ ] Progress tracking
- [ ] Social sharing

## Feedback:

Please report bugs or suggestions to: [your-email]
```

### **B. Firebase Security Rules for Testing**

```javascript
// Firestore rules for MVP testing
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    match /goals/{goalId} {
      allow read, write: if request.auth != null &&
        request.auth.uid == resource.data.userId;
    }

    match /checkins/{checkinId} {
      allow read, write: if request.auth != null &&
        request.auth.uid == resource.data.userId;
    }
  }
}
```

---

## 📱 **Step 4: Mobile Testing**

### **A. Progressive Web App (PWA) Setup**

Your app should work well on mobile. Test:

- **iOS Safari**: Can be added to home screen
- **Android Chrome**: Install prompt works
- **Responsive design**: All forms work on mobile

### **B. Test Checklist for Mobile**

- [ ] Goal creation form works on small screens
- [ ] Check-in buttons are easy to tap
- [ ] Text is readable (16px+ font size)
- [ ] Navigation works with thumbs
- [ ] Loading states are clear

---

## 🔒 **Step 5: Security & Performance**

### **A. Environment Variables**

Ensure your `.env` file is configured for production:

```bash
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=linkedgoals-d7053.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=linkedgoals-d7053
VITE_FIREBASE_STORAGE_BUCKET=linkedgoals-d7053.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=753801883214
VITE_FIREBASE_APP_ID=1:753801883214:web:cf46567024a37452a65d1f
```

### **B. Performance Optimization**

Your current build size: **833.84 kB** (gzipped: 230.68 kB)

- ✅ Under 1MB (good for MVP)
- Consider code splitting for future releases

---

## 🎯 **Step 6: Launch Checklist**

### **Before Going Live:**

- [ ] Custom domain `app.linkedgoals.app` is working
- [ ] Marketing page links point to custom domain
- [ ] SSL certificate is active (handled by Firebase)
- [ ] All forms work on mobile and desktop
- [ ] Error handling is user-friendly
- [ ] Privacy policy and terms are accessible
- [ ] Analytics are set up (Google Analytics/Firebase Analytics)

### **MVP Tester Onboarding:**

- [ ] Create simple onboarding email template
- [ ] Set up feedback collection method
- [ ] Prepare bug reporting system
- [ ] Plan weekly check-ins with testers

---

## 🚨 **Troubleshooting**

### **Common Issues:**

1. **Custom domain not working**: Check DNS propagation (can take 24-48 hours)
2. **SSL errors**: Firebase handles SSL automatically, wait for propagation
3. **App not loading**: Check browser console for errors
4. **Mobile issues**: Test on real devices, not just browser dev tools

### **Emergency Rollback:**

If issues arise, users can always access: https://linkedgoals-d7053.web.app

---

## 📞 **Support Contacts**

- **Firebase Console**: https://console.firebase.google.com/project/linkedgoals-d7053
- **Domain Management**: Your domain registrar for `linkedgoals.app`
- **App Status**: https://linkedgoals-d7053.web.app (backup URL)

---

_Last Updated: $(date)_
_Status: Ready for MVP Testing_ 🚀
