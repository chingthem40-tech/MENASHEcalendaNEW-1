import { supabase } from "./supabase";

export async function getAuthToken(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

let authFetchInstalled = false;

function isSameOriginApiRequest(input: RequestInfo | URL): boolean {
  const raw =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : input.url;
  const url = new URL(raw, window.location.href);
  return url.origin === window.location.origin && url.pathname.startsWith("/api/");
}

/**
 * Several established feature clients call fetch directly. Install one
 * same-origin guard so all /api requests carry the current Supabase token.
 */
export function installAuthFetch(): void {
  if (authFetchInstalled) return;
  authFetchInstalled = true;

  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    if (!isSameOriginApiRequest(input)) {
      return originalFetch(input, init);
    }

    const headers = new Headers(
      init?.headers ?? (input instanceof Request ? input.headers : undefined),
    );
    if (!headers.has("Authorization")) {
      const token = await getAuthToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
    }
    return originalFetch(input, { ...init, headers });
  };
}