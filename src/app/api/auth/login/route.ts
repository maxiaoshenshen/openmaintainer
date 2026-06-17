import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_GITHUB_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/github/callback`;
  
  const scopes = [
    "repo",
    "read:user",
    "read:org",
  ].join(" ");

  const state = Math.random().toString(36).substring(7);

  if (!clientId) {
    return NextResponse.json(
      { error: "GitHub OAuth not configured" },
      { status: 503 }
    );
  }

  const authUrl = new URL("https://github.com/login/oauth/authorize");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", scopes);
  authUrl.searchParams.set("state", state);

  return NextResponse.json({
    authUrl: authUrl.toString(),
    state,
    message: "Redirect user to authUrl to initiate GitHub OAuth flow",
  });
}
