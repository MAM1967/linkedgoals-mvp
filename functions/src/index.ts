import * as admin from "firebase-admin";
import { getAuth } from "firebase-admin/auth";
import { onRequest, onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import { defineSecret } from "firebase-functions/params";
import axios from "axios";

admin.initializeApp();

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

export const linkedinlogin = onRequest(
  {
    secrets: [LINKEDIN_CLIENT_SECRET],
    cors: "https://app.linkedgoals.app",
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

      logger.info("🔑 Received authorization code.");

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
      logger.info(
        "✅ Token exchange successful. Scope:",
        tokenResponse.data.scope
      );

      logger.info("👤 Fetching user info via OpenID Connect...");
      const userInfoResponse = await axios.get<OpenIDUserInfo>(
        "https://api.linkedin.com/v2/userinfo",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const userInfo = userInfoResponse.data;
      logger.info("✅ OpenID Connect userinfo fetched:", {
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
