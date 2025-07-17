/* eslint-disable @typescript-eslint/no-explicit-any */
import { logger } from "firebase-functions/v2";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onRequest } from "firebase-functions/v2/https";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { defineSecret } from "firebase-functions/params";
import axios from "axios";
import * as admin from "firebase-admin";
import { EmailService } from "./emailService";
import * as crypto from "crypto";

// Export scheduled weekly email function
export { sendWeeklyEmails } from "./weeklyEmailScheduler";

admin.initializeApp();

const LINKEDIN_CLIENT_SECRET = defineSecret("LINKEDIN_CLIENT_SECRET");
const RESEND_API_KEY = defineSecret("RESEND_API_KEY");

// EmailService will be initialized lazily when needed
function ensureEmailServiceInitialized() {
  EmailService.initialize(RESEND_API_KEY.value());
}

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
    cors: ["https://app.linkedgoals.app", "https://linkedgoals-staging.web.app"],
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
          redirect_uri: req.headers.origin?.includes("staging") 
            ? "https://linkedgoals-staging.web.app/linkedin"
            : "https://app.linkedgoals.app/linkedin",
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
      const firestore = getFirestore();
      let isNewUser = false;

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
          isNewUser = true;
        } else {
          throw error;
        }
      }

      // Create or update Firestore user document
      const userDocRef = firestore.collection("users").doc(userRecord.uid);
      const userDoc = await userDocRef.get();

      if (!userDoc.exists || isNewUser) {
        const userData = {
          uid: userRecord.uid,
          email: userRecord.email || userInfo.email,
          displayName: userRecord.displayName || displayName,
          fullName: userRecord.displayName || displayName,
          photoURL: userRecord.photoURL || userInfo.picture || null,
          disabled: userRecord.disabled || false,
          emailVerified:
            userRecord.emailVerified || userInfo.email_verified || false,
          createdAt: isNewUser
            ? Timestamp.now()
            : Timestamp.fromDate(new Date(userRecord.metadata.creationTime)),
          updatedAt: Timestamp.now(),
          role: "user", // Default role
          linkedinProfile: {
            sub: userInfo.sub,
            given_name: userInfo.given_name,
            family_name: userInfo.family_name,
            email_verified: userInfo.email_verified || false,
          },
        };

        await userDocRef.set(userData);
        logger.info(
          `✅ Created Firestore document for user: ${userRecord.uid}`
        );
      } else {
        // Update existing document with LinkedIn profile info
        const updates: any = {
          updatedAt: Timestamp.now(),
          linkedinProfile: {
            sub: userInfo.sub,
            given_name: userInfo.given_name,
            family_name: userInfo.family_name,
            email_verified: userInfo.email_verified || false,
          },
        };

        // Update fields if they're missing
        const existingData = userDoc.data();
        if (!existingData?.fullName && displayName) {
          updates.fullName = displayName;
        }
        if (!existingData?.photoURL && userInfo.picture) {
          updates.photoURL = userInfo.picture;
        }

        await userDocRef.update(updates);
        logger.info(
          `✅ Updated Firestore document for user: ${userRecord.uid}`
        );
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

// Sync Firebase Auth users to Firestore
export const syncUsersToFirestore = onCall(async (request) => {
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

  try {
    const auth = getAuth();
    let nextPageToken: string | undefined;
    let processedCount = 0;
    let createdCount = 0;
    let updatedCount = 0;

    logger.info("Starting user sync from Firebase Auth to Firestore...");

    do {
      // List users from Firebase Auth (1000 at a time)
      const listUsersResult = await auth.listUsers(1000, nextPageToken);

      for (const userRecord of listUsersResult.users) {
        try {
          const userDoc = await firestore
            .collection("users")
            .doc(userRecord.uid)
            .get();

          if (!userDoc.exists) {
            // Create new Firestore document for Auth users that don't have one
            const userData = {
              uid: userRecord.uid,
              email: userRecord.email || "No email provided",
              displayName: userRecord.displayName || "Unknown User",
              fullName: userRecord.displayName || "Unknown User",
              photoURL: userRecord.photoURL || null,
              disabled: userRecord.disabled || false,
              emailVerified: userRecord.emailVerified || false,
              createdAt: Timestamp.fromDate(
                new Date(userRecord.metadata.creationTime)
              ),
              updatedAt: Timestamp.now(),
              role: "user", // Default role
              // Add LinkedIn profile info if it's a LinkedIn user
              ...(userRecord.uid.startsWith("linkedin") && {
                linkedinProfile: {
                  sub: userRecord.uid.replace("linkedin|", ""),
                  email_verified: userRecord.emailVerified || false,
                },
              }),
            };

            await firestore
              .collection("users")
              .doc(userRecord.uid)
              .set(userData);
            createdCount++;
            logger.info(
              `✅ Created Firestore document for user: ${userRecord.uid} (${userRecord.email})`
            );
          } else {
            // Update existing document with any missing essential fields
            const existingData = userDoc.data();
            const updates: any = {};

            if (!existingData?.fullName && userRecord.displayName) {
              updates.fullName = userRecord.displayName;
            }
            if (!existingData?.email && userRecord.email) {
              updates.email = userRecord.email;
            }
            if (!existingData?.createdAt) {
              updates.createdAt = Timestamp.fromDate(
                new Date(userRecord.metadata.creationTime)
              );
            }
            if (existingData?.disabled !== userRecord.disabled) {
              updates.disabled = userRecord.disabled;
            }

            if (Object.keys(updates).length > 0) {
              updates.updatedAt = Timestamp.now();
              await firestore
                .collection("users")
                .doc(userRecord.uid)
                .update(updates);
              updatedCount++;
              logger.info(
                `🔄 Updated Firestore document for user: ${userRecord.uid}`
              );
            }
          }
          processedCount++;
        } catch (error) {
          logger.error(`❌ Error processing user ${userRecord.uid}:`, error);
        }
      }

      nextPageToken = listUsersResult.pageToken;

      if (nextPageToken) {
        logger.info(
          `📄 Processed ${processedCount} users, continuing with next page...`
        );
      }
    } while (nextPageToken);

    const message = `User sync completed! Processed: ${processedCount}, Created: ${createdCount}, Updated: ${updatedCount}`;
    logger.info(`🎉 ${message}`);

    return {
      status: "success",
      message,
      stats: {
        processedCount,
        createdCount,
        updatedCount,
      },
    };
  } catch (error) {
    logger.error("💥 Error syncing users:", error);
    throw new HttpsError(
      "internal",
      "An unexpected error occurred during user sync.",
      error instanceof Error ? error.message : "Unknown error"
    );
  }
});

// Email verification function
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

    const { email, userId } = request.data;
    if (!email || !userId) {
      throw new HttpsError(
        "invalid-argument",
        "Email and userId are required."
      );
    }

    try {
      // Initialize EmailService
      ensureEmailServiceInitialized();

      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Store verification token in Firestore
      const firestore = getFirestore();
      await firestore.collection("emailVerifications").doc(userId).set({
        email,
        token: verificationToken,
        expiresAt,
        verified: false,
        createdAt: new Date(),
      });

      // Get user display name
      const userDoc = await firestore.collection("users").doc(userId).get();
      const userData = userDoc.data();
      const userName =
        userData?.displayName || userData?.fullName || email.split("@")[0];

      // Send verification email
      const result = await EmailService.sendVerificationEmail(
        email,
        verificationToken,
        userName
      );

      if (result.success) {
        logger.info(`✅ Verification email sent to ${email}`);
        return {
          success: true,
          message: "Verification email sent successfully",
        };
      } else {
        throw new Error(result.error || "Failed to send verification email");
      }
    } catch (error: any) {
      logger.error("❌ Error sending verification email:", error);
      throw new HttpsError(
        "internal",
        "Failed to send verification email",
        error.message
      );
    }
  }
);

// Email verification endpoint
export const verifyEmail = onCall(async (request) => {
  try {
    const { token } = request.data;

    if (!token || typeof token !== "string") {
      throw new HttpsError("invalid-argument", "Invalid verification token");
    }

    const firestore = getFirestore();

    // Find verification record
    const verificationQuery = await firestore
      .collection("emailVerifications")
      .where("token", "==", token)
      .limit(1)
      .get();

    if (verificationQuery.empty) {
      logger.error("❌ No verification record found for token:", token);
      throw new HttpsError(
        "not-found",
        "Invalid or expired verification token"
      );
    }

    const verificationDoc = verificationQuery.docs[0];
    const verificationData = verificationDoc.data();
    logger.info("🔍 Found verification record:", {
      id: verificationDoc.id,
      verified: verificationData.verified,
      expiresAt: verificationData.expiresAt,
      verifiedAt: verificationData.verifiedAt,
    });

    // Check if token is expired
    if (verificationData.expiresAt.toDate() < new Date()) {
      logger.error("❌ Token expired:", verificationData.expiresAt.toDate());
      throw new HttpsError(
        "deadline-exceeded",
        "Verification token has expired"
      );
    }

    // Check if already verified
    if (verificationData.verified) {
      logger.info("✅ Email already verified for user:", verificationDoc.id);
      return {
        success: true,
        message: "Email already verified",
      };
    }

    // Update verification status
    await verificationDoc.ref.update({
      verified: true,
      verifiedAt: new Date(),
    });

    // Update user's email verification status
    await firestore.collection("users").doc(verificationDoc.id).set(
      {
        emailVerified: true,
        emailVerificationDate: new Date(),
      },
      { merge: true }
    );

    logger.info(`✅ Email verified for user: ${verificationDoc.id}`);

    // Return success response
    return {
      success: true,
      message: "Email verified successfully",
    };
  } catch (error: any) {
    logger.error("❌ Error verifying email:", error);
    logger.error("❌ Error details:", {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    throw new HttpsError("internal", `Internal server error: ${error.message}`);
  }
});

// Send welcome email when user is created
export const onUserCreate = onDocumentCreated(
  {
    document: "users/{userId}",
    secrets: [RESEND_API_KEY],
  },
  async (event) => {
    const userData = event.data?.data();
    if (!userData) return;

    const { email, displayName, fullName } = userData;
    if (!email) return;

    try {
      // Initialize EmailService
      ensureEmailServiceInitialized();

      const userName = displayName || fullName || email.split("@")[0];

      // Send welcome email
      const result = await EmailService.sendWelcomeEmail(email, userName);

      if (result.success) {
        logger.info(`✅ Welcome email sent to ${email}`);
      } else {
        logger.error(
          `❌ Failed to send welcome email to ${email}: ${result.error}`
        );
      }
    } catch (error: any) {
      logger.error("❌ Error in onUserCreate email trigger:", error);
    }
  }
);

// Admin function to get email stats
export const getEmailStats = onCall(
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

    // Check if the user is an admin
    const adminUid = request.auth.uid;
    const firestore = getFirestore();
    const adminUserDoc = await firestore
      .collection("users")
      .doc(adminUid)
      .get();

    if (!adminUserDoc.exists || adminUserDoc.data()?.role !== "admin") {
      throw new HttpsError(
        "permission-denied",
        "You must be an admin to access email stats."
      );
    }

    try {
      // Initialize EmailService
      ensureEmailServiceInitialized();

      const { days = 30 } = request.data || {};
      const stats = await EmailService.getEmailStats(days);

      return {
        success: true,
        stats,
        period: `${days} days`,
      };
    } catch (error: any) {
      logger.error("❌ Error getting email stats:", error);
      throw new HttpsError(
        "internal",
        "Failed to get email stats",
        error.message
      );
    }
  }
);

// Admin function to send announcement emails
export const sendAnnouncement = onCall(
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

    // Check if the user is an admin
    const adminUid = request.auth.uid;
    const firestore = getFirestore();
    const adminUserDoc = await firestore
      .collection("users")
      .doc(adminUid)
      .get();

    if (!adminUserDoc.exists || adminUserDoc.data()?.role !== "admin") {
      throw new HttpsError(
        "permission-denied",
        "You must be an admin to send announcements."
      );
    }

    const { subject, content, targetEmails } = request.data;
    if (!subject || !content || !targetEmails || !Array.isArray(targetEmails)) {
      throw new HttpsError(
        "invalid-argument",
        "Subject, content, and targetEmails array are required."
      );
    }

    try {
      const adminData = adminUserDoc.data();
      const adminName =
        adminData?.displayName || adminData?.fullName || "LinkedGoals Admin";

      const result = await EmailService.sendAnnouncement(
        targetEmails,
        subject,
        content,
        adminName
      );

      if (result.success) {
        logger.info(
          `✅ Announcement sent to ${targetEmails.length} recipients`
        );
        return {
          success: true,
          message: `Announcement sent to ${targetEmails.length} recipients`,
        };
      } else {
        throw new Error(result.error || "Failed to send announcement");
      }
    } catch (error: any) {
      logger.error("❌ Error sending announcement:", error);
      throw new HttpsError(
        "internal",
        "Failed to send announcement",
        error.message
      );
    }
  }
);
