import * as admin from "firebase-admin";
import { getAuth } from "firebase-admin/auth";
import { onRequest, onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import { defineSecret } from "firebase-functions/params";
import axios from "axios";

admin.initializeApp();

const LINKEDIN_CLIENT_SECRET = defineSecret("LINKEDIN_CLIENT_SECRET");



export const linkedinlogin = onRequest(
  {
    secrets: [LINKEDIN_CLIENT_SECRET],
    cors: [
      "https://app.linkedgoals.app",
      "https://linkedgoals-staging.web.app", 
      "https://linkedgoals-development.web.app",
      "http://localhost:5173"
    ],
  },
  async (req, res) => {
    if (req.method === "OPTIONS") {
      res.set("Access-Control-Allow-Methods", "POST");
      res.set("Access-Control-Allow-Headers", "Content-Type");
      res.set("Access-Control-Max-Age", "3600");
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

      // Determine redirect URI based on origin header
      const origin = req.get('origin') || req.get('referer') || '';
      let redirectUri = "https://app.linkedgoals.app/linkedin"; // Default to production
      
      if (origin.includes('linkedgoals-staging.web.app')) {
        redirectUri = "https://linkedgoals-staging.web.app/linkedin";
      } else if (origin.includes('linkedgoals-development.web.app')) {
        redirectUri = "https://linkedgoals-development.web.app/linkedin";
      } else if (origin.includes('localhost')) {
        redirectUri = "http://localhost:5173/linkedin";
      }
      
      logger.info("🔑 Received authorization code.");
      logger.info("🌍 Origin:", origin);
      logger.info("🔗 Using redirect URI:", redirectUri);

      const tokenResponse = await axios.post(
        "https://www.linkedin.com/oauth/v2/accessToken",
        new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
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
      logger.info(
        "✅ Token exchange successful. Scope:",
        tokenResponse.data.scope
      );

      logger.info("👤 Fetching LinkedIn profile using API v2...");
      const profileResponse = await axios.get(
        "https://api.linkedin.com/v2/me",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      logger.info("📧 Fetching LinkedIn email using API v2...");
      const emailResponse = await axios.get(
        "https://api.linkedin.com/v2/emailAddresses?q=members&projection=(elements*(handle~))",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const userInfo = {
        sub: profileResponse.data.id,
        email: emailResponse.data.elements[0]["handle~"].emailAddress,
        name: `${profileResponse.data.localizedFirstName} ${profileResponse.data.localizedLastName}`,
        email_verified: true,
        picture: profileResponse.data.profilePicture?.displayImage || null,
      };

      logger.info("✅ LinkedIn API v2 data fetched:", {
        sub: userInfo.sub,
        name: userInfo.name,
        email: userInfo.email,
      });

      if (!userInfo.sub || !userInfo.email) {
        throw new Error("Missing user ID or email from LinkedIn.");
      }

      const auth = getAuth();
      const displayName = userInfo.name || userInfo.email.split("@")[0];

      let userRecord;
      try {
        userRecord = await auth.getUserByEmail(userInfo.email);
        logger.info(
          "✅ Existing Firebase user found by email:",
          userRecord.uid
        );

        await auth.updateUser(userRecord.uid, {
          displayName: userRecord.displayName || displayName,
          photoURL: userRecord.photoURL || userInfo.picture,
        });
        logger.info("✅ User profile updated with LinkedIn data.");
      } catch (error: any) {
        if (error.code === "auth/user-not-found") {
          const userId = `linkedin|${userInfo.sub}`;
          logger.info(
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
          logger.info("✅ New Firebase user created:", userRecord.uid);
        } else {
          throw error;
        }
      }

      const customToken = await auth.createCustomToken(userRecord.uid);
      logger.info(
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
      logger.error(
        "🔥 LinkedIn authentication function failed:",
        error.message
      );
      if (error.response) {
        logger.error("📋 Status:", error.response.status);
        logger.error("📋 Data:", error.response.data);
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

export const manageUser = onCall(async (request) => {
  // Ensure the user calling the function is authenticated
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  // Check if the user is an admin
  const adminUid = request.auth.uid;
  const firestore = getFirestore();
  const adminUserDoc = await firestore.collection("users").doc(adminUid).get();

  if (!adminUserDoc.exists || adminUserDoc.data()?.role !== "admin") {
    throw new HttpsError(
      "permission-denied",
      "You must be an admin to perform this action."
    );
  }

  const { uid, action } = request.data;
  if (!uid || !action) {
    throw new HttpsError(
      "invalid-argument",
      'The function must be called with a "uid" and "action" argument.'
    );
  }

  const auth = getAuth();

  try {
    if (action === "disable") {
      await auth.updateUser(uid, { disabled: true });
      logger.info(`Admin ${adminUid} disabled user ${uid}`);
      return { status: "success", message: `User ${uid} has been disabled.` };
    } else if (action === "enable") {
      await auth.updateUser(uid, { disabled: false });
      logger.info(`Admin ${adminUid} enabled user ${uid}`);
      return { status: "success", message: `User ${uid} has been enabled.` };
    } else if (action === "delete") {
      await auth.deleteUser(uid);
      await firestore.collection("users").doc(uid).delete();
      logger.info(`Admin ${adminUid} deleted user ${uid}`);
      return { status: "success", message: `User ${uid} has been deleted.` };
    } else {
      throw new HttpsError("invalid-argument", "Invalid action specified.");
    }
  } catch (error: any) {
    logger.error("Error managing user:", error);
    throw new HttpsError(
      "internal",
      "An unexpected error occurred.",
      error.message
    );
  }
});
