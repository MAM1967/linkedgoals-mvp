//
//  linkedinauth.ts
//  
//
//  Created by Michael McDermott on 4/10/25.
//
//

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import fetch from "node-fetch-native";

if (!admin.apps.length) {
  admin.initializeApp();
}

const LINKEDIN_CLIENT_ID = "7880c93kzzfsgj";
const LINKEDIN_CLIENT_SECRET = "WPL_AP1.OwZS9ToJmefiA0oJ.hZGloA==";
const REDIRECT_URI = "https://linkedgoals-d7053.web.app/linkedin";

export const linkedinLogin = functions.https.onRequest(async (req, res) => {
  // ✅ Handle CORS
  res.setHeader("Access-Control-Allow-Origin", "https://linkedgoals-d7053.web.app");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  const code = req.query.code as string;
  if (!code) {
    res.status(400).send("Missing LinkedIn OAuth code");
    return;
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
        client_id: LINKEDIN_CLIENT_ID,
        client_secret: LINKEDIN_CLIENT_SECRET,
      }).toString(),
    });

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) throw new Error("Failed to get access token");

    // Get profile (using OpenID Connect userinfo)
    const profileRes = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const profileData = await profileRes.json();
    const email = profileData.email;

    if (!email) throw new Error("Email not found");

    const userRecord = await admin.auth().getUserByEmail(email).catch(() =>
      admin.auth().createUser({ email })
    );

    const customToken = await admin.auth().createCustomToken(userRecord.uid);
    console.log("LinkedIn email:", email);
    console.log("Firebase UID:", userRecord.uid);
    res.status(200).json({ token: customToken });
  } catch (err) {
    console.error("LinkedIn login error:", err);
    res.status(500).json({ error: "LinkedIn login failed" });
  }
});






