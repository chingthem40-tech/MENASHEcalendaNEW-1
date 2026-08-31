/**
 * Replit Auth uses an HttpOnly same-origin session cookie.
 *
 * Keep this small compatibility helper for upload/client APIs that still
 * accept a token-provider callback. Browser requests authenticate through
 * credentials: "include"; no provider token is exposed to JavaScript.
 */
export async function getAuthToken(): Promise<null> {
  return null;
}