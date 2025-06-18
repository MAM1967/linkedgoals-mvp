import * as admin from "firebase-admin";
import { getAuth } from "firebase-admin/auth";
import { onRequest, onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import { defineSecret } from "firebase-functions/params";
import axios from "axios";
import { Resend } from "resend";
import * as crypto from "crypto";

admin.initializeApp();

const LINKEDIN_CLIENT_SECRET = defineSecret("LINKEDIN_CLIENT_SECRET");
const RESEND_API_KEY = defineSecret("RESEND_API_KEY");

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

export const sendVerificationEmail = onCall(
  {
    secrets: [RESEND_API_KEY],
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "The function must be called while authenticated."
      );
    }

    const resend = new Resend(RESEND_API_KEY.value());

    const email = request.auth.token.email;
    const userName = request.auth.token.name || email?.split("@")[0];

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    try {
      const firestore = getFirestore();

      // Store verification token in Firestore
      await firestore
        .collection("emailVerifications")
        .doc(request.auth.uid)
        .set({
          token: verificationToken,
          email: email,
          verified: false,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        });

      // Construct verification URL
      const verificationUrl = `https://us-central1-linkedgoals-d7053.cloudfunctions.net/verifyEmail?token=${verificationToken}`;

      // Send email using Resend
      const emailPayload = {
        from: "LinkedGoals <noreply@linkedgoals.app>",
        to: [email!],
        subject: "Verify your email address - LinkedGoals",
        html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email - LinkedGoals</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background: linear-gradient(135deg, #0077B5, #005885); padding: 40px 30px; text-align: center; }
        .logo { color: white; font-size: 32px; font-weight: bold; margin: 0; }
        .content { padding: 40px 30px; }
        .welcome-text { font-size: 24px; color: #333; margin-bottom: 20px; }
        .message { font-size: 16px; color: #666; margin-bottom: 30px; }
        .verify-button { display: inline-block; background: linear-gradient(135deg, #0077B5, #005885); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
        .verify-button:hover { background: linear-gradient(135deg, #005885, #004070); }
        .footer { background-color: #f8f9fa; padding: 30px; text-align: center; color: #666; font-size: 14px; }
        .security-note { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        .url-display { background-color: #f8f9fa; padding: 10px; border-radius: 5px; word-break: break-all; font-family: monospace; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="logo">🎯 LinkedGoals</h1>
        </div>
        <div class="content">
            <h2 class="welcome-text">Hi ${userName}!</h2>
            <p class="message">Welcome to LinkedGoals! Please verify your email address to activate all features and start achieving your professional goals.</p>
            
            <div style="text-align: center;">
                <a href="${verificationUrl}" class="verify-button">Verify Email Address</a>
            </div>
            
            <div class="security-note">
                <strong>Security Notice:</strong> If you didn't create this account, please ignore this email. This verification link will expire in 24 hours.
            </div>
            
            <p style="color: #999; font-size: 12px;">
                If the button doesn't work, copy and paste this link into your browser:
            </p>
            <p class="url-display">${verificationUrl}</p>
        </div>
        <div class="footer">
            <p>© 2025 LinkedGoals. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`,
        text: `Hi ${userName},

Welcome to LinkedGoals! Please verify your email address to activate all features.

Click this link to verify your email:
${verificationUrl}

If you didn't create this account, please ignore this email.
This link will expire in 24 hours.

© 2025 LinkedGoals. All rights reserved.`,
      };

      const sendResult = await resend.emails.send(emailPayload);

      if (sendResult.error) {
        throw new Error(`Resend API error: ${sendResult.error.message}`);
      }

      logger.info(`✅ Verification email sent to: ${email}`);
      return {
        success: true,
        message: "Verification email sent successfully.",
      };
    } catch (error: any) {
      logger.error("❌ Failed to send verification email:", error);
      throw new HttpsError(
        "internal",
        "Failed to send verification email",
        error.message
      );
    }
  }
);

export const verifyEmail = onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    const token = req.query.token as string;

    if (!token) {
      res.status(400).json({ error: "Verification token is required." });
      return;
    }

    const firestore = getFirestore();

    // Find verification record by token
    const verificationQuery = await firestore
      .collection("emailVerifications")
      .where("token", "==", token)
      .where("verified", "==", false)
      .limit(1)
      .get();

    if (verificationQuery.empty) {
      res.status(400).json({ error: "Invalid or expired verification token." });
      return;
    }

    const verificationDoc = verificationQuery.docs[0];
    const verificationData = verificationDoc.data();

    // Check if token has expired
    if (verificationData.expiresAt.toDate() < new Date()) {
      res.status(400).json({ error: "Verification token has expired." });
      return;
    }

    // Mark as verified
    await verificationDoc.ref.update({
      verified: true,
      verifiedAt: new Date(),
    });

    logger.info(`✅ Email verified for user: ${verificationDoc.id}`);

    // Redirect to success page
    res.redirect("https://app.linkedgoals.app/?emailVerified=true");
  } catch (error: any) {
    logger.error("❌ Email verification failed:", error);
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
});

// Additional helper functions that were deleted
export const getEmailStats = onCall(async (request) => {
  // Placeholder for email stats
  logger.info("Getting email stats");
  return { stats: "placeholder" };
});

export const sendAnnouncement = onCall(async (request) => {
  // Placeholder for announcements
  logger.info("Sending announcement");
  return { success: true };
});

export const syncUsersToFirestore = onCall(async (request) => {
  // Placeholder for user sync
  logger.info("Syncing users to Firestore");
  return { success: true };
});
