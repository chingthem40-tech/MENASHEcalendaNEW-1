import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type AuthUser = {
  id: string;
  subject: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  fullName: string;
  imageUrl?: string;
  createdAt: string;
  publicMetadata: { isAdmin?: boolean };
  emailAddresses: Array<{ emailAddress: string }>;
};

type AuthContextValue = {
  user: AuthUser | null;
  isLoaded: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function requireAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("Auth hooks must be used inside ReplitAuthProvider");
  }
  return context;
}

export function ReplitAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/user", {
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) {
        setUser(null);
        return;
      }
      const body = (await response.json()) as {
        user?: {
          id: string;
          subject: string;
          email: string | null;
          name: string;
          imageUrl: string | null;
          isAdmin: boolean;
          createdAt?: string;
        };
      };
      const nameParts = (body.user?.name ?? "").trim().split(/\s+/);
      if (!body.user) {
        setUser(null);
        return;
      }
      setUser({
        id: body.user.id,
        subject: body.user.subject,
        email: body.user.email,
        firstName: nameParts[0] || null,
        lastName: nameParts.slice(1).join(" ") || null,
        fullName: body.user.name,
        imageUrl: body.user.imageUrl ?? undefined,
        createdAt: body.user.createdAt ?? new Date().toISOString(),
        publicMetadata: { isAdmin: body.user.isAdmin },
        emailAddresses: body.user.email
          ? [{ emailAddress: body.user.email }]
          : [],
      });
    } catch {
      setUser(null);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const signOut = useCallback(async () => {
    await fetch("/api/auth/logout", { credentials: "include" });
    setUser(null);
    window.location.assign("/");
  }, []);

  const value = useMemo(
    () => ({ user, isLoaded, refresh, signOut }),
    [isLoaded, refresh, signOut, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useUser(): {
  user: AuthUser | null;
  isLoaded: boolean;
} {
  const { user, isLoaded } = requireAuthContext();
  return { user, isLoaded };
}

export function useOrganization(): {
  membership: { role: string } | null;
} {
  const { user } = requireAuthContext();
  return {
    membership: user?.publicMetadata.isAdmin
      ? { role: "org:admin" }
      : null,
  };
}

export function useClerk(): {
  signOut: (options?: { redirectUrl?: string }) => Promise<void>;
} {
  return { signOut: requireAuthContext().signOut };
}

export function Show({
  when,
  children,
}: {
  when: "signed-in" | "signed-out";
  children: ReactNode;
}) {
  const { user, isLoaded } = requireAuthContext();
  if (!isLoaded) return null;
  if (when === "signed-in" && user) return <>{children}</>;
  if (when === "signed-out" && !user) return <>{children}</>;
  return null;
}

function AuthButton({ label }: { label: string }) {
  const returnTo = `${window.location.pathname}${window.location.search}`;
  return (
    <a
      href={`/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        minHeight: 48,
        borderRadius: 12,
        background: "#D4AF37",
        color: "#0F1829",
        fontWeight: 700,
        textDecoration: "none",
      }}
    >
      {label}
    </a>
  );
}

export function SignIn(_props?: Record<string, unknown>) {
  return (
    <div style={{ padding: 28 }}>
      <h2 style={{ margin: "0 0 8px", color: "#D4AF37", textAlign: "center" }}>
        Welcome back
      </h2>
      <p style={{ margin: "0 0 24px", color: "#A89070", textAlign: "center" }}>
        Sign in with your Replit account to continue.
      </p>
      <AuthButton label="Sign in with Replit" />
    </div>
  );
}

export function SignUp(_props?: Record<string, unknown>) {
  return (
    <div style={{ padding: 28 }}>
      <h2 style={{ margin: "0 0 8px", color: "#D4AF37", textAlign: "center" }}>
        Join Bnei Menashe
      </h2>
      <p style={{ margin: "0 0 24px", color: "#A89070", textAlign: "center" }}>
        Create or use your Replit account to get started.
      </p>
      <AuthButton label="Continue with Replit" />
    </div>
  );
}