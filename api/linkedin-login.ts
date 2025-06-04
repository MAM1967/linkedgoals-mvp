import { VercelRequest, VercelResponse } from "@vercel/node";

interface LinkedInTokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
}

interface LinkedInUserInfoResponse {
  sub: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  email?: string;
  email_verified?: boolean;
  locale?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader(
    "Access-Control-Allow-Origin",
    process.env.ALLOWED_ORIGIN || "*"
  );
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    console.log("🚀 LinkedIn OAuth API route called");

    const { code, state, code_verifier } = req.body;

    console.log("📦 Received parameters:", {
      code: code ? "present" : "missing",
      state: state ? "present" : "missing",
      code_verifier: code_verifier
        ? `present (${code_verifier.length} chars)`
        : "missing",
    });

    if (!code) {
      console.error("❌ Missing authorization code");
      res.status(400).json({ error: "Missing authorization code" });
      return;
    }

    if (!code_verifier) {
      console.error("❌ Missing PKCE code verifier");
      res.status(400).json({ error: "Missing PKCE code verifier" });
      return;
    }

    // Get LinkedIn configuration from environment variables
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
    const redirectUri = process.env.LINKEDIN_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      console.error("❌ LinkedIn config missing");
      res.status(500).json({ error: "Missing LinkedIn configuration" });
      return;
    }

    console.log("✅ LinkedIn config loaded successfully");
    console.log("🔄 Exchanging code for access token with PKCE...");

    // Token exchange with PKCE
    const tokenRequestParams = new URLSearchParams({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
      code_verifier: code_verifier,
    });

    const tokenResponse = await fetch(
      "https://www.linkedin.com/oauth/v2/accessToken",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: tokenRequestParams.toString(),
      }
    );

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error("❌ LinkedIn token exchange failed:", errorData);
      res.status(400).json({
        error: "Failed to exchange code for token",
        details: errorData,
      });
      return;
    }

    const tokenData: LinkedInTokenResponse = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      console.error("❌ No access token in LinkedIn response");
      res.status(400).json({ error: "Failed to obtain access token" });
      return;
    }

    console.log("✅ LinkedIn access token acquired");

    // Fetch user info using LinkedIn's OIDC endpoint
    console.log("🔄 Fetching LinkedIn user info...");

    const userInfoResponse = await fetch(
      "https://api.linkedin.com/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!userInfoResponse.ok) {
      const errorData = await userInfoResponse.text();
      console.error("❌ LinkedIn userinfo fetch failed:", errorData);
      res.status(400).json({
        error: "Failed to fetch user information",
        details: errorData,
      });
      return;
    }

    const userInfo: LinkedInUserInfoResponse = await userInfoResponse.json();
    console.log("✅ LinkedIn user info retrieved");

    if (!userInfo.email) {
      console.error("❌ No email in LinkedIn user info");
      res.status(400).json({
        error: "Email address not available from LinkedIn",
      });
      return;
    }

    // Return user data for frontend processing
    res.status(200).json({
      success: true,
      user: {
        id: userInfo.sub,
        email: userInfo.email,
        name: userInfo.name,
        firstName: userInfo.given_name,
        lastName: userInfo.family_name,
        picture: userInfo.picture,
        emailVerified: userInfo.email_verified || false,
        locale: userInfo.locale,
      },
      // For Firebase auth, you can create custom token here if needed
      // or handle Firebase auth on the frontend
    });
  } catch (error: any) {
    console.error("🔥 LinkedIn OAuth error:", error);
    res.status(500).json({
      error: "LinkedIn authentication failed",
      message: error.message,
    });
  }
}
