import { onCall } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import * as admin from "firebase-admin";
import axios from "axios";

// Initialize Firebase Admin SDK
admin.initializeApp();

const LINKEDIN_CLIENT_ID = defineSecret("LINKEDIN_CLIENT_ID");
const LINKEDIN_CLIENT_SECRET = defineSecret("LINKEDIN_CLIENT_SECRET");
const LINKEDIN_REDIRECT_URI = defineSecret("LINKEDIN_REDIRECT_URI");

interface LinkedInTokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  // OIDC ID token is also typically returned here
  id_token?: string;
}

// Updated to match LinkedIn's /v2/userinfo OIDC endpoint response
interface LinkedInUserInfoResponse {
  sub: string; // Subject - User ID
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  email?: string;
  email_verified?: boolean;
  locale?: string;
}

export const linkedinLogin = onCall(
  {
    secrets: [
      LINKEDIN_CLIENT_ID,
      LINKEDIN_CLIENT_SECRET,
      LINKEDIN_REDIRECT_URI,
    ],
    region: "us-central1", // Explicitly set region if needed
  },
  async (request) => { // Changed from 'data' to 'request' as per v2 onCall convention
    try {
      // For v2 onCall, data is under request.data
      const code = request.data?.code;
      if (!code) {
        console.error("❌ No LinkedIn authorization code provided. Data received:", request.data);
        throw new Error("Missing authorization code");
      }
      console.log("✅ Received LinkedIn code:", code);

      const clientId = process.env.LINKEDIN_CLIENT_ID;
      const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
      const redirectUri = process.env.LINKEDIN_REDIRECT_URI;

      if (!clientId || !clientSecret || !redirectUri) {
        console.error("❌ LinkedIn config missing. Got:", { clientId, clientSecret: !!clientSecret, redirectUri });
        throw new Error("Missing LinkedIn configuration");
      }
      console.log("✅ LinkedIn config loaded successfully");

      let accessToken: string = "";
      try {
        console.log("🔄 Exchanging code for access token...");
        const tokenResponse = await axios.post<LinkedInTokenResponse>(
          "https://www.linkedin.com/oauth/v2/accessToken",
          new URLSearchParams({
            grant_type: "authorization_code",
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
          }).toString(),
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          }
        );
        accessToken = tokenResponse.data.access_token;
        console.log("✅ LinkedIn access token acquired:", accessToken ? accessToken.substring(0, 10) + "..." : "EMPTY_TOKEN");
         if (!accessToken) {
          console.error("❌ Access token was not found in LinkedIn's response:", tokenResponse.data);
          throw new Error("Failed to obtain access token from LinkedIn");
        }
      } catch (err: any) {
        console.error("❌ Error exchanging code for token. Original error:", err.message);
        if (axios.isAxiosError(err)) {
            console.error("❌ Axios error during token exchange:", {
                data: err.response?.data,
                status: err.response?.status,
                headers: err.response?.headers,
            });
        }
        throw new Error("Failed to exchange code for token");
      }

      let userInfo: LinkedInUserInfoResponse;
      try {
        console.log("🔄 Fetching LinkedIn user info using /v2/userinfo endpoint...");
        console.log("🔍 Using access token for userinfo:", accessToken ? accessToken.substring(0, 10) + "..." : "EMPTY_TOKEN");
        
        const userInfoResponse = await axios.get<LinkedInUserInfoResponse>(
          "https://api.linkedin.com/v2/userinfo", // Switched to OIDC userinfo endpoint
          {
            headers: { 
              Authorization: `Bearer ${accessToken}`,
            }
          }
        );
        
        console.log("📊 LinkedIn userinfo API response status:", userInfoResponse.status);
        
        if (!userInfoResponse.data) {
          console.error("❌ LinkedIn userinfo response has no data property");
          throw new Error("Empty response data from LinkedIn userinfo API");
        }
        
        userInfo = userInfoResponse.data;
        console.log("✅ LinkedIn user info:", JSON.stringify(userInfo));

        if (!userInfo.email) {
            console.warn("⚠️ Email not found in LinkedIn userinfo response. User may not have a primary email or permission was not granted effectively.");
            // Decide if this is a critical error or if you can proceed without email
            // For now, we'll throw an error if email is absolutely required.
            throw new Error("Email address not available from LinkedIn userinfo.");
        }

      } catch (err: any) {
        console.error("❌ Error fetching LinkedIn userinfo. Original error:", err.message);
        if (axios.isAxiosError(err)) {
            console.error("❌ Axios error during userinfo fetch:",{
                data: err.response?.data,
                status: err.response?.status,
                headers: err.response?.headers,
            });
        } else {
            console.error("❌ Non-Axios error during userinfo fetch:", err);
        }
        throw new Error("Failed to fetch LinkedIn userinfo");
      }
      
      const email = userInfo.email; // Email should be directly available here
      if (!email) { // Double check email after userInfo assignment.
        console.error("❌ Critical: Email is missing from user info after successful fetch. UserInfo:", JSON.stringify(userInfo));
        throw new Error("Critical: Email not retrieved from LinkedIn.");
      }
      console.log("✅ LinkedIn email from userinfo:", email);


      let userRecord;
      try {
        userRecord = await admin.auth().getUserByEmail(email);
        console.log("✅ Firebase user exists:", userRecord.uid);
      } catch (err: any) {
        console.log("ℹ️ Firebase user not found. Creating...");
        try {
          const displayName = userInfo.name || `${userInfo.given_name || ""} ${userInfo.family_name || ""}`.trim();
          userRecord = await admin.auth().createUser({
            uid: userInfo.sub, // Use LinkedIn's 'sub' as Firebase UID for consistency
            email,
            emailVerified: userInfo.email_verified || false,
            displayName: displayName,
            photoURL: userInfo.picture,
          });
          
          // Optionally, store more detailed profile in Firestore, linked by Firebase UID (which is LinkedIn sub)
          await admin.firestore().collection("users").doc(userRecord.uid).set({
            linkedinId: userInfo.sub, // Redundant if UID is sub, but good for clarity
            firstName: userInfo.given_name,
            lastName: userInfo.family_name,
            fullName: userInfo.name, // if available
            email, // already in auth record
            locale: userInfo.locale,
            // Store other fields as needed
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          console.log("✅ Firebase user created with UID:", userRecord.uid);

        } catch (createErr: any) {
          console.error("❌ Error creating Firebase user:", createErr);
          // Check if it's because the UID (from sub) already exists if you didn't fetch by email first
          if (createErr.code === 'auth/uid-already-exists') {
            console.warn("⚠️ Firebase user with UID (from LinkedIn sub) already exists. Fetching this user...");
            userRecord = await admin.auth().getUser(userInfo.sub);
          } else {
            throw new Error("Failed to create Firebase user");
          }
        }
      }

      let customToken = "";
      try {
        customToken = await admin.auth().createCustomToken(userRecord.uid);
        console.log("✅ Firebase custom token created for UID:", userRecord.uid);
      } catch (err: any) {
        console.error("❌ Error creating custom token:", err);
        throw new Error("Failed to create custom token");
      }

      console.log("🎉 LinkedIn login flow completed.");
      return { customToken };
    } catch (error: any) {
      console.error("🔥 Top-level linkedinLogin error. Message:", error.message);
      throw new Error(
        error.message || "An error occurred during LinkedIn authentication"
      );
    }
  }
);