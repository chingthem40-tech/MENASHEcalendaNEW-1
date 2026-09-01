import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useLanguage } from "./context/LanguageContext";

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
  status: AuthStatus;
  authError: "unavailable" | null;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

export type AuthStatus = "loading" | "signed-out" | "signed-in" | "unavailable";

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
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [authError, setAuthError] = useState<"unavailable" | null>(null);

  const refresh = useCallback(async () => {
    setStatus("loading");
    setAuthError(null);
    try {
      const response = await fetch("/api/auth/user", {
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (response.status === 401) {
        setUser(null);
        setStatus("signed-out");
        return;
      }
      if (!response.ok) throw new Error(`Auth check failed with ${response.status}`);
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
        setStatus("signed-out");
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
      setStatus("signed-in");
    } catch {
      setAuthError("unavailable");
      setStatus("unavailable");
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const signOut = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        headers: { Accept: "application/json" },
      });
    } finally {
      setUser(null);
      setStatus("signed-out");
      window.location.assign("/");
    }
  }, []);

  const value = useMemo(
    () => ({ user, isLoaded, status, authError, refresh, signOut }),
    [authError, isLoaded, refresh, signOut, status, user],
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

export function useAuthState(): {
  status: AuthStatus;
  authError: "unavailable" | null;
  retry: () => Promise<void>;
} {
  const { status, authError, refresh } = requireAuthContext();
  return { status, authError, retry: refresh };
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
  const { user, isLoaded, status } = requireAuthContext();
  if (!isLoaded) return null;
  if (when === "signed-in" && user) return <>{children}</>;
  if (when === "signed-out" && !user && status === "signed-out") {
    return <>{children}</>;
  }
  return null;
}

const authCopy = {
  en: {
    signInEyebrow: "PERSONAL CALENDAR · COMMUNITY",
    signInTitle: "Welcome back",
    signInBody: "Your calendar, learning, and community life in one place.",
    signInButton: "Sign in with Replit",
    signInBusy: "Opening secure sign-in…",
    signUpEyebrow: "BEGIN YOUR JOURNEY",
    signUpTitle: "Join Bnei Menashe",
    signUpBody: "Create your free account to save your calendar and take part in the community.",
    signUpButton: "Continue with Replit",
    signUpBusy: "Opening secure sign-up…",
    newMember: "New to Bnei Menashe?",
    existingMember: "Already have an account?",
    createAccount: "Create an account",
    signInLink: "Sign in",
    back: "Back to calendar",
    secure: "Secure authentication · We never store your Replit password",
    expired: "That sign-in link has expired. Start again.",
    invalid: "We couldn't verify that sign-in attempt. Please start again.",
    cancelled: "Sign-in was cancelled. You can try again whenever you're ready.",
    provider: "Replit sign-in is temporarily unavailable. Please try again.",
    unavailable: "We couldn't start sign-in right now. Please try again.",
  },
  tk: {
    signInEyebrow: "ŞAHSY SENENAMA · JEMGYÝET",
    signInTitle: "Hoş geldiňiz",
    signInBody: "Senenamaňyz, öwrenişiňiz we jemgyýet durmuşyňyz bir ýerde.",
    signInButton: "Replit bilen giriň",
    signInBusy: "Howpsuz giriş açylýar…",
    signUpEyebrow: "SYÝAHATYŇYZY BAŞLAŇ",
    signUpTitle: "Bnei Menashe-e goşulyň",
    signUpBody: "Senenamaňyzy ýatda saklamak we jemgyýete goşulmak üçin mugt hasap dörediň.",
    signUpButton: "Replit bilen dowam ediň",
    signUpBusy: "Howpsuz hasap açylýar…",
    newMember: "Bnei Menashe-de täzemi?",
    existingMember: "Hasabyňyz barmy?",
    createAccount: "Hasap dörediň",
    signInLink: "Giriň",
    back: "Senenama dolan",
    secure: "Howpsuz tassyklama · Replit parolyňyz bu ýerde saklanmaýar",
    expired: "Giriş baglanyşygyňyzyň möhleti gutardy. Täzeden başlaň.",
    invalid: "Giriş synanyşygyňyzy tassyklap bilmedik. Täzeden başlaň.",
    cancelled: "Giriş ýatyryldy. Taýýar bolanyňyzda täzeden synanyşyň.",
    provider: "Replit girişi wagtlaýyn elýeterli däl. Täzeden synanyşyň.",
    unavailable: "Häzir giriş başlap bilmedik. Täzeden synanyşyň.",
  },
} as const;

type AuthErrorCode = keyof Pick<
  typeof authCopy.en,
  "expired" | "invalid" | "cancelled" | "provider" | "unavailable"
>;

function useAuthPageContext() {
  const { lang } = useLanguage();
  const query = new URLSearchParams(window.location.search);
  const rawReturnTo = query.get("returnTo");
  const returnTo =
    rawReturnTo && rawReturnTo.startsWith("/") && !rawReturnTo.startsWith("//")
      ? rawReturnTo
      : "/app";
  const rawError = query.get("authError");
  const errorCode: AuthErrorCode | null =
    rawError === "expired" ||
    rawError === "invalid" ||
    rawError === "cancelled" ||
    rawError === "provider" ||
    rawError === "unavailable"
      ? rawError
      : null;
  return { copy: authCopy[lang], returnTo, errorCode };
}

function AuthButton({
  label,
  busyLabel,
  returnTo,
}: {
  label: string;
  busyLabel: string;
  returnTo: string;
}) {
  const [redirecting, setRedirecting] = useState(false);
  return (
    <a
      href={`/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`}
      onClick={(event) => {
        if (redirecting) {
          event.preventDefault();
          return;
        }
        setRedirecting(true);
      }}
      aria-busy={redirecting}
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
        transition: "transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease",
        opacity: redirecting ? 0.72 : 1,
      }}
    >
      <span style={{ marginRight: 9, fontSize: 17 }}>↗</span>
      {redirecting ? busyLabel : label}
    </a>
  );
}

export function SignIn(_props?: Record<string, unknown>) {
  const { copy, returnTo, errorCode } = useAuthPageContext();
  return (
    <div style={{ padding: "28px 28px 24px" }}>
      <div style={{ textAlign: "center", color: "#A89070", fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", marginBottom: 10 }}>
        {copy.signInEyebrow}
      </div>
      <h2 style={{ margin: "0 0 9px", color: "#D4AF37", textAlign: "center", fontSize: 26, letterSpacing: "-0.02em" }}>
        {copy.signInTitle}
      </h2>
      <p style={{ margin: "0 auto 22px", maxWidth: 290, color: "#A89070", textAlign: "center", lineHeight: 1.55, fontSize: 13 }}>
        {copy.signInBody}
      </p>
      {errorCode && (
        <div role="alert" style={{ marginBottom: 16, padding: "10px 12px", borderRadius: 10, color: "#f1c6bd", background: "rgba(164, 57, 45, 0.18)", border: "1px solid rgba(219, 104, 87, 0.35)", fontSize: 12, lineHeight: 1.45 }}>
          {copy[errorCode]}
        </div>
      )}
      <AuthButton label={copy.signInButton} busyLabel={copy.signInBusy} returnTo={returnTo} />
      <div style={{ marginTop: 14, color: "#7f755f", textAlign: "center", fontSize: 11 }}>{copy.secure}</div>
      <div style={{ marginTop: 23, paddingTop: 17, borderTop: "1px solid rgba(212,175,55,0.14)", color: "#A89070", textAlign: "center", fontSize: 12 }}>
        {copy.newMember}{" "}
        <a href={`/sign-up?returnTo=${encodeURIComponent(returnTo)}`} style={{ color: "#D4AF37", fontWeight: 700, textDecoration: "none" }}>{copy.createAccount}</a>
      </div>
      <a href="/" style={{ display: "block", marginTop: 17, color: "#7f755f", textAlign: "center", fontSize: 12, textDecoration: "none" }}>{copy.back}</a>
    </div>
  );
}

export function SignUp(_props?: Record<string, unknown>) {
  const { copy, returnTo, errorCode } = useAuthPageContext();
  return (
    <div style={{ padding: "28px 28px 24px" }}>
      <div style={{ textAlign: "center", color: "#A89070", fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", marginBottom: 10 }}>
        {copy.signUpEyebrow}
      </div>
      <h2 style={{ margin: "0 0 9px", color: "#D4AF37", textAlign: "center", fontSize: 26, letterSpacing: "-0.02em" }}>
        {copy.signUpTitle}
      </h2>
      <p style={{ margin: "0 auto 22px", maxWidth: 300, color: "#A89070", textAlign: "center", lineHeight: 1.55, fontSize: 13 }}>
        {copy.signUpBody}
      </p>
      {errorCode && (
        <div role="alert" style={{ marginBottom: 16, padding: "10px 12px", borderRadius: 10, color: "#f1c6bd", background: "rgba(164, 57, 45, 0.18)", border: "1px solid rgba(219, 104, 87, 0.35)", fontSize: 12, lineHeight: 1.45 }}>
          {copy[errorCode]}
        </div>
      )}
      <AuthButton label={copy.signUpButton} busyLabel={copy.signUpBusy} returnTo={returnTo} />
      <div style={{ marginTop: 14, color: "#7f755f", textAlign: "center", fontSize: 11 }}>{copy.secure}</div>
      <div style={{ marginTop: 23, paddingTop: 17, borderTop: "1px solid rgba(212,175,55,0.14)", color: "#A89070", textAlign: "center", fontSize: 12 }}>
        {copy.existingMember}{" "}
        <a href={`/sign-in?returnTo=${encodeURIComponent(returnTo)}`} style={{ color: "#D4AF37", fontWeight: 700, textDecoration: "none" }}>{copy.signInLink}</a>
      </div>
      <a href="/" style={{ display: "block", marginTop: 17, color: "#7f755f", textAlign: "center", fontSize: 12, textDecoration: "none" }}>{copy.back}</a>
    </div>
  );
}