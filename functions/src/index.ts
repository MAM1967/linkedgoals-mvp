import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { https } from "firebase-functions";
import { defineSecret } from "firebase-functions/params";
import axios from "axios";

initializeApp();

const LINKEDIN_CLIENT_SECRET = defineSecret("LINKEDIN_CLIENT_SECRET");

interface OpenIDUserInfo {
  sub: string;
  name: string;
  given_name: string;
  family_name: string;
  email: string;
  email_verified: boolean;
  picture: string;
}

export const linkedinlogin = https.onRequest(
  {
    secrets: [LINKEDIN_CLIENT_SECRET],
    cors: "https://app.linkedgoals.app",
  },
  async (req, res) => {
    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ error: "Method Not Allowed" });
      return;
    }

    try {
      const { code } = req.body;
      if (!code) {
        res.status(400).json({ error: "Authorization code is required." });
        return;
      }

      console.log("🔑 Received authorization code.");

      const tokenResponse = await axios.post(
        "https://www.linkedin.com/oauth/v2/accessToken",
        new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: "https://app.linkedgoals.app/linkedin",
          client_id: "7880c93kzzfsgj",
          client_secret: LINKEDIN_CLIENT_SECRET.value(),
        }).toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      const accessToken = tokenResponse.data.access_token;
      console.log(
        "✅ Token exchange successful. Scope:",
        tokenResponse.data.scope
      );

      console.log("👤 Fetching user info via OpenID Connect...");
      const userInfoResponse = await axios.get<OpenIDUserInfo>(
        "https://api.linkedin.com/v2/userinfo",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const userInfo = userInfoResponse.data;
      console.log("✅ OpenID Connect userinfo fetched:", {
        sub: userInfo.sub,
        name: userInfo.name,
        email: userInfo.email,
      });

      if (!userInfo.sub || !userInfo.email) {
        throw new Error("Missing user ID or email from LinkedIn.");
      }

      // Step 3: Create or update Firebase user
      const auth = getAuth();
      const displayName = userInfo.name || userInfo.email.split("@")[0];

      let userRecord;
      try {
        // Check if a user with this email already exists. This is the key to linking social logins.
        userRecord = await auth.getUserByEmail(userInfo.email);
        console.log(
          "✅ Existing Firebase user found by email:",
          userRecord.uid
        );

        // Optionally, update their profile with the latest data from LinkedIn
        await auth.updateUser(userRecord.uid, {
          displayName: userRecord.displayName || displayName,
          photoURL: userRecord.photoURL || userInfo.picture,
        });
        console.log("✅ User profile updated with LinkedIn data.");
      } catch (error: any) {
        if (error.code === "auth/user-not-found") {
          // If no user exists with this email, create a new one.
          const userId = `linkedin|${userInfo.sub}`;
          console.log(
            "👤 No user found with email. Creating new Firebase user with UID:",
            userId
          );
          userRecord = await auth.createUser({
            uid: userId,
            email: userInfo.email,
            displayName: displayName,
            photoURL: userInfo.picture,
            emailVerified: userInfo.email_verified,
          });
          console.log("✅ New Firebase user created:", userRecord.uid);
        } else {
          // Another unexpected error occurred while fetching the user.
          throw error;
        }
      }

      // Step 4: Create a custom token for the user to sign in
      const customToken = await auth.createCustomToken(userRecord.uid);
      console.log(
        "🎫 Custom token created successfully for UID:",
        userRecord.uid
      );

      res.status(200).json({
        success: true,
        customToken,
        user: {
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: userRecord.displayName,
          photoURL: userRecord.photoURL,
        },
      });
    } catch (error: any) {
      console.error(
        "🔥 LinkedIn authentication function failed:",
        error.message
      );
      if (error.response) {
        console.error("📋 Status:", error.response.status);
        console.error("📋 Data:", error.response.data);
        res.status(error.response.status).json({
          error: "Failed to authenticate with LinkedIn.",
          details: error.response.data,
        });
      } else {
        res.status(500).json({
          error: "An unexpected error occurred.",
          details: error.message,
        });
      }
    }
  }
);
