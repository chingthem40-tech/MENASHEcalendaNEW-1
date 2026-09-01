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
    nextTitle: "What happens next",
    nextSteps: [
      "Continue to Replit’s secure sign-in",
      "Allow MENASHE to access your account",
      "Return here automatically",
    ],
    previewTitle: "Testing in Preview?",
    previewBody: "For the most reliable sign-in test, open the development URL in an incognito or private window.",
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
    nextTitle: "Indi näme bolar",
    nextSteps: [
      "Replit-iň howpsuz girişine geçiň",
      "MENASHE-e hasabyňyza girmäge rugsat beriň",
      "Bu ýere awtomatiki dolanarsyňyz",
    ],
    previewTitle: "Preview-de synaýarsyňyzmy?",
    previewBody: "Iň ygtybarly giriş synagy üçin development URL-ni gizlin ýa-da inkognito penjirede açyň.",
    expired: "Giriş baglanyşygyňyzyň möhleti gutardy. Täzeden başlaň.",
    invalid: "Giriş synanyşygyňyzy tassyklap bilmedik. Täzeden başlaň.",
    cancelled: "Giriş ýatyryldy. Taýýar bolanyňyzda täzeden synanyşyň.",
    provider: "Replit girişi wagtlaýyn elýeterli däl. Täzeden synanyşyň.",
    unavailable: "Häzir giriş başlap bilmedik. Täzeden synanyşyň.",
  },
} as const;

type AuthCopy = (typeof authCopy)["en"];

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
  const preview =
    import.meta.env.DEV &&
    (import.meta.env.VITE_DEV_PREVIEW === "true" ||
      query.get("preview") === "1");
  return { copy: authCopy[lang], returnTo, errorCode, preview };
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
      <svg
        aria-hidden="true"
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        style={{ marginRight: 9 }}
      >
        <path
          d="M4 12 12 4M6 4h6v6"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {redirecting ? busyLabel : label}
    </a>
  );
}

function AuthGuidance({
  copy,
  preview,
}: {
  copy: AuthCopy;
  preview: boolean;
}) {
  return (
    <div style={{ marginTop: 22, textAlign: "left" }}>
      <div
        style={{
          padding: "14px 15px 13px",
          borderRadius: 13,
          border: "1px solid rgba(212,175,55,0.16)",
          background: "rgba(255,255,255,0.025)",
        }}
      >
        <div
          style={{
            color: "#D4AF37",
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          {copy.nextTitle}
        </div>
        <ol
          style={{
            display: "grid",
            gap: 9,
            margin: "12px 0 0",
            padding: 0,
            listStyle: "none",
          }}
        >
          {copy.nextSteps.map((step, index) => (
            <li
              key={step}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                color: "#B8AA92",
                fontSize: 12,
                lineHeight: 1.35,
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  flex: "0 0 20px",
                  width: 20,
                  height: 20,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                  color: "#D4AF37",
                  background: "rgba(212,175,55,0.11)",
                  border: "1px solid rgba(212,175,55,0.28)",
                  fontSize: 10,
                  fontWeight: 800,
                }}
              >
                {index + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>
      {preview && (
        <div
          role="note"
          style={{
            marginTop: 10,
            padding: "11px 12px",
            borderRadius: 11,
            border: "1px solid rgba(92,156,218,0.32)",
            background: "rgba(54,111,173,0.13)",
            color: "#BBD5ED",
            fontSize: 11,
            lineHeight: 1.45,
          }}
        >
          <div style={{ marginBottom: 3, color: "#D4E7FA", fontWeight: 800 }}>
            {copy.previewTitle}
          </div>
          {copy.previewBody}
        </div>
      )}
    </div>
  );
}

export function SignIn(_props?: Record<string, unknown>) {
  const { copy, returnTo, errorCode, preview } = useAuthPageContext();
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
      <AuthGuidance copy={copy} preview={preview} />
      <div style={{ marginTop: 23, paddingTop: 17, borderTop: "1px solid rgba(212,175,55,0.14)", color: "#A89070", textAlign: "center", fontSize: 12 }}>
        {copy.newMember}{" "}
        <a href={`/sign-up?returnTo=${encodeURIComponent(returnTo)}`} style={{ color: "#D4AF37", fontWeight: 700, textDecoration: "none" }}>{copy.createAccount}</a>
      </div>
      <a href="/" style={{ display: "block", marginTop: 17, color: "#7f755f", textAlign: "center", fontSize: 12, textDecoration: "none" }}>{copy.back}</a>
    </div>
  );
}

export function SignUp(_props?: Record<string, unknown>) {
  const { copy, returnTo, errorCode, preview } = useAuthPageContext();
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
      <AuthGuidance copy={copy} preview={preview} />
      <div style={{ marginTop: 23, paddingTop: 17, borderTop: "1px solid rgba(212,175,55,0.14)", color: "#A89070", textAlign: "center", fontSize: 12 }}>
        {copy.existingMember}{" "}
        <a href={`/sign-in?returnTo=${encodeURIComponent(returnTo)}`} style={{ color: "#D4AF37", fontWeight: 700, textDecoration: "none" }}>{copy.signInLink}</a>
      </div>
      <a href="/" style={{ display: "block", marginTop: 17, color: "#7f755f", textAlign: "center", fontSize: 12, textDecoration: "none" }}>{copy.back}</a>
    </div>
  );
}