// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

console.log("Hello from Functions!") 
console.log("Testing for old code - " + new Date().toISOString());
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

serve(async (req) => {
  try {
    // Parse the incoming request body
    const { code } = await req.json();

    if (!code) {
      return new Response(
        JSON.stringify({ error: "Missing authorization code" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get secrets from environment
    const clientId = Deno.env.get("LINKEDIN_CLIENT_ID");
    const clientSecret = Deno.env.get("LINKEDIN_CLIENT_SECRET");
    const redirectUri = Deno.env.get("LINKEDIN_REDIRECT_URI");

    if (!clientId || !clientSecret || !redirectUri) {
      return new Response(
        JSON.stringify({ error: "Missing LinkedIn configuration" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Exchange code for access token
    const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to get access token", details: tokenData }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const accessToken = tokenData.access_token;

    // Fetch user profile
    const profileRes = await fetch("https://api.linkedin.com/v2/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const profile = await profileRes.json();

    // Fetch user email
    const emailRes = await fetch(
      "https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const emailData = await emailRes.json();

    return new Response(
      JSON.stringify({
        profile,
        email: emailData,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Unexpected error", details: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/linkedin-login' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
