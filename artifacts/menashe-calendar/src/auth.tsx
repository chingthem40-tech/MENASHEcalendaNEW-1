import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";

import { useLanguage } from "./context/LanguageContext";
import { supabase } from "./lib/supabase";

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

type AuthActionResult = {
  error: string | null;
  requiresConfirmation?: boolean;
};

type AuthContextValue = {
  user: AuthUser | null;
  isLoaded: boolean;
  status: AuthStatus;
  authError: "unavailable" | null;
  refresh: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<AuthActionResult>;
  signUp: (email: string, password: string) => Promise<AuthActionResult>;
  signOut: () => Promise<void>;
};

export type AuthStatus = "loading" | "signed-out" | "signed-in" | "unavailable";

const AuthContext = createContext<AuthContextValue | null>(null);

function requireAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("Auth hooks must be used inside SupabaseAuthProvider");
  }
  return context;
}

function mapUser(body: {
  id: string;
  subject: string;
  email: string | null;
  name: string;
  imageUrl: string | null;
  isAdmin: boolean;
  createdAt?: string;
}): AuthUser {
  const nameParts = body.name.trim().split(/\s+/);
  return {
    id: body.id,
    subject: body.subject,
    email: body.email,
    firstName: nameParts[0] || null,
    lastName: nameParts.slice(1).join(" ") || null,
    fullName: body.name,
    imageUrl: body.imageUrl ?? undefined,
    createdAt: body.createdAt ?? new Date().toISOString(),
    publicMetadata: { isAdmin: body.isAdmin },
    emailAddresses: body.email ? [{ emailAddress: body.email }] : [],
  };
}

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [authError, setAuthError] = useState<"unavailable" | null>(null);

  const syncSession = useCallback(async (
    session: Session | null,
  ): Promise<AuthStatus> => {
    if (!session) {
      setUser(null);
      setStatus("signed-out");
      setAuthError(null);
      setIsLoaded(true);
      return "signed-out";
    }

    setStatus("loading");
    setAuthError(null);
    try {
      const response = await fetch("/api/auth/user", {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      if (response.status === 401) {
        setUser(null);
        setStatus("signed-out");
        return "signed-out";
      }
      if (!response.ok) {
        throw new Error(`Auth check failed with ${response.status}`);
      }
      const body = (await response.json()) as {
        user?: Parameters<typeof mapUser>[0];
      };
      if (!body.user) {
        setUser(null);
        setStatus("signed-out");
        return "signed-out";
      }
      setUser(mapUser(body.user));
      setStatus("signed-in");
      return "signed-in";
    } catch {
      setUser(null);
      setAuthError("unavailable");
      setStatus("unavailable");
      return "unavailable";
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const refresh = useCallback(async () => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    if (error) {
      setUser(null);
      setAuthError("unavailable");
      setStatus("unavailable");
      setIsLoaded(true);
      return;
    }
    await syncSession(session);
  }, [syncSession]);

  useEffect(() => {
    void refresh();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void syncSession(session);
    });
    return () => subscription.unsubscribe();
  }, [refresh, syncSession]);

  const signIn = useCallback(
    async (email: string, password: string): Promise<AuthActionResult> => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error || !data.session) return { error: error?.message ?? null };
      const result = await syncSession(data.session);
      return {
        error:
          result === "unavailable" ? "migration_unavailable" : null,
      };
    },
    [syncSession],
  );

  const signUp = useCallback(
    async (email: string, password: string): Promise<AuthActionResult> => {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (!error && data.session) {
        const result = await syncSession(data.session);
        if (result === "unavailable") {
          return { error: "migration_unavailable" };
        }
      }
      return {
        error: error?.message ?? null,
        requiresConfirmation: !error && !data.session,
      };
    },
    [syncSession],
  );

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      setUser(null);
      setStatus("signed-out");
      window.location.assign("/");
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoaded,
      status,
      authError,
      refresh,
      signIn,
      signUp,
      signOut,
    }),
    [authError, isLoaded, refresh, signIn, signOut, signUp, status, user],
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

export function useAuthActions(): {
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
    signInButton: "Sign in",
    signInBusy: "Signing in…",
    signUpEyebrow: "BEGIN YOUR JOURNEY",
    signUpTitle: "Join Bnei Menashe",
    signUpBody:
      "Create your free account to save your calendar and take part in the community.",
    signUpButton: "Create account",
    signUpBusy: "Creating account…",
    emailLabel: "Email address",
    emailPlaceholder: "you@example.com",
    passwordLabel: "Password",
    confirmPasswordLabel: "Confirm password",
    newMember: "New to Bnei Menashe?",
    existingMember: "Already have an account?",
    createAccount: "Create an account",
    signInLink: "Sign in",
    back: "Back to calendar",
    secure: "Secure authentication · Your password is never visible to MENASHE",
    nextTitle: "What happens next",
    nextSteps: [
      "Enter your email and password",
      "Supabase verifies your account securely",
      "Continue to your MENASHE calendar",
    ],
    previewTitle: "Testing in Preview?",
    previewBody:
      "Use a private window if you need to test with a different Supabase account.",
    expired: "That sign-in session has expired. Please sign in again.",
    invalid: "We couldn't verify that sign-in attempt. Please try again.",
    cancelled: "Sign-in was cancelled. You can try again whenever you're ready.",
    provider: "Supabase authentication is temporarily unavailable. Please try again.",
    unavailable: "We couldn't start sign-in right now. Please try again.",
    required: "Enter your email address and password.",
    passwordMismatch: "The passwords do not match.",
    passwordTooShort: "Use at least 8 characters for your password.",
    invalidCredentials: "The email address or password is incorrect.",
    emailExists: "An account with this email address already exists.",
    genericError: "We couldn't complete that request. Please try again.",
    confirmationTitle: "Check your email",
    confirmationBody:
      "Supabase sent a confirmation link to your email address. Confirm it, then return here to sign in.",
  },
  tk: {
    signInEyebrow: "ŞAHSY SENENAMA · JEMGYÝET",
    signInTitle: "Hoş geldiňiz",
    signInBody: "Senenamaňyz, öwrenişiňiz we jemgyýet durmuşyňyz bir ýerde.",
    signInButton: "Giriň",
    signInBusy: "Giriş edilýär…",
    signUpEyebrow: "SYÝAHATYŇYZY BAŞLAŇ",
    signUpTitle: "Bnei Menashe-e goşulyň",
    signUpBody:
      "Senenamaňyzy ýatda saklamak we jemgyýete goşulmak üçin mugt hasap dörediň.",
    signUpButton: "Hasap dörediň",
    signUpBusy: "Hasap döredilýär…",
    emailLabel: "E-poçta salgysy",
    emailPlaceholder: "siz@example.com",
    passwordLabel: "Parol",
    confirmPasswordLabel: "Paroly tassyklaň",
    newMember: "Bnei Menashe-de täzemi?",
    existingMember: "Hasabyňyz barmy?",
    createAccount: "Hasap dörediň",
    signInLink: "Giriň",
    back: "Senenama dolan",
    secure: "Howpsuz giriş · Parolyňyz MENASHE-e görünmeýär",
    nextTitle: "Indi näme bolar",
    nextSteps: [
      "E-poçtaňyzy we parolyňyzy ýazyň",
      "Supabase hasabyňyzy howpsuz tassyklar",
      "MENASHE senenamaňyza geçiň",
    ],
    previewTitle: "Preview-de synaýarsyňyzmy?",
    previewBody:
      "Başga Supabase hasaby bilen synag üçin gizlin penjiräni ulanyň.",
    expired: "Giriş sessiýasynyň möhleti gutardy. Täzeden giriň.",
    invalid: "Giriş synanyşygyňyzy tassyklap bilmedik. Täzeden synanyşyň.",
    cancelled: "Giriş ýatyryldy. Taýýar bolanyňyzda täzeden synanyşyň.",
    provider: "Supabase girişi wagtlaýyn elýeterli däl. Täzeden synanyşyň.",
    unavailable: "Häzir giriş başlap bilmedik. Täzeden synanyşyň.",
    required: "E-poçta salgyňyzy we parolyňyzy ýazyň.",
    passwordMismatch: "Parollar gabat gelenok.",
    passwordTooShort: "Parolyňyz azyndan 8 belgiden ybarat bolsun.",
    invalidCredentials: "E-poçta salgysy ýa-da parol nädogry.",
    emailExists: "Bu e-poçta salgysy bilen hasap eýýäm bar.",
    genericError: "Talaby ýerine ýetirip bilmedik. Täzeden synanyşyň.",
    confirmationTitle: "E-poçtaňyzy barlaň",
    confirmationBody:
      "Supabase e-poçtaňyza tassyklama baglanyşygyny iberdi. Ony tassyklaň, soň giriş üçin bu ýere dolanyň.",
  },
} as const;

type AuthCopy = {
  [Key in keyof (typeof authCopy)["en"]]: (typeof authCopy)["en"][Key] extends
    readonly string[]
    ? readonly string[]
    : string;
};

type AuthErrorCode = keyof Pick<
  typeof authCopy.en,
  "expired" | "invalid" | "cancelled" | "provider" | "unavailable"
>;

function useAuthPageContext() {
  const { lang } = useLanguage();
  const query = new URLSearchParams(window.location.search);
  const rawReturnTo = query.get("returnTo");
  const returnTo = safeReturnTo(rawReturnTo, "/app");
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

function safeReturnTo(raw: string | null, fallback: string): string {
  if (!raw || !raw.startsWith("/") || raw.includes("\\")) return fallback;
  try {
    const parsed = new URL(raw, window.location.origin);
    if (parsed.origin !== window.location.origin) return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

function friendlyAuthError(message: string, copy: AuthCopy): string {
  const normalized = message.toLowerCase();
  if (normalized.includes("migration_unavailable")) return copy.provider;
  if (
    normalized.includes("invalid login credentials") ||
    normalized.includes("invalid credentials")
  ) {
    return copy.invalidCredentials;
  }
  if (
    normalized.includes("already registered") ||
    normalized.includes("already exists")
  ) {
    return copy.emailExists;
  }
  if (normalized.includes("password") && normalized.includes("characters")) {
    return copy.passwordTooShort;
  }
  return copy.genericError;
}

function AuthForm({
  mode,
  copy,
  returnTo,
}: {
  mode: "sign-in" | "sign-up";
  copy: AuthCopy;
  returnTo: string;
}) {
  const { signIn, signUp } = requireAuthContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    setError(null);

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      setError(copy.required);
      return;
    }
    if (mode === "sign-up" && password.length < 8) {
      setError(copy.passwordTooShort);
      return;
    }
    if (mode === "sign-up" && password !== confirmPassword) {
      setError(copy.passwordMismatch);
      return;
    }

    setBusy(true);
    try {
      const result =
        mode === "sign-in"
          ? await signIn(normalizedEmail, password)
          : await signUp(normalizedEmail, password);
      if (result.error) {
        setError(friendlyAuthError(result.error, copy));
        return;
      }
      if (result.requiresConfirmation) {
        setConfirmationSent(true);
        return;
      }
      window.location.assign(returnTo);
    } catch {
      setError(copy.genericError);
    } finally {
      setBusy(false);
    }
  };

  if (confirmationSent) {
    return (
      <div className="auth-confirmation" role="status" aria-live="polite">
        <div className="auth-confirmation-mark" aria-hidden="true">✓</div>
        <strong>{copy.confirmationTitle}</strong>
        <p>{copy.confirmationBody}</p>
      </div>
    );
  }

  return (
    <form className="auth-fields" onSubmit={submit} noValidate>
      <label className="auth-field">
        <span>{copy.emailLabel}</span>
        <input
          className="auth-input"
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          placeholder={copy.emailPlaceholder}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={busy}
          required
        />
      </label>
      <label className="auth-field">
        <span>{copy.passwordLabel}</span>
        <input
          className="auth-input"
          type="password"
          name="password"
          autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={busy}
          minLength={mode === "sign-up" ? 8 : undefined}
          required
        />
      </label>
      {mode === "sign-up" && (
        <label className="auth-field">
          <span>{copy.confirmPasswordLabel}</span>
          <input
            className="auth-input"
            type="password"
            name="confirmPassword"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            disabled={busy}
            minLength={8}
            required
          />
        </label>
      )}
      {error && (
        <div role="alert" className="auth-error">
          {error}
        </div>
      )}
      <button
        className="mds-btn-gold auth-cta"
        type="submit"
        disabled={busy}
        aria-busy={busy}
      >
        {busy
          ? mode === "sign-in"
            ? copy.signInBusy
            : copy.signUpBusy
          : mode === "sign-in"
            ? copy.signInButton
            : copy.signUpButton}
      </button>
    </form>
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
    <div className="auth-guidance-wrap">
      <div className="mds-card-secondary auth-guidance">
        <div className="auth-guidance-title">{copy.nextTitle}</div>
        <ol className="auth-guidance-list">
          {copy.nextSteps.map((step, index) => (
            <li key={step} className="auth-guidance-step">
              <span aria-hidden="true" className="auth-guidance-number">
                {index + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>
      {preview && (
        <div role="note" className="auth-preview-note">
          <strong>{copy.previewTitle}</strong>
          {copy.previewBody}
        </div>
      )}
    </div>
  );
}

export function SignIn(_props?: Record<string, unknown>) {
  const { copy, returnTo, errorCode, preview } = useAuthPageContext();
  return (
    <div className="auth-form-content">
      <div className="auth-eyebrow">{copy.signInEyebrow}</div>
      <h2 className="auth-title">{copy.signInTitle}</h2>
      <p className="auth-description">{copy.signInBody}</p>
      {errorCode && (
        <div role="alert" className="auth-error">
          {copy[errorCode]}
        </div>
      )}
      <AuthForm mode="sign-in" copy={copy} returnTo={returnTo} />
      <div className="auth-secure">{copy.secure}</div>
      <AuthGuidance copy={copy} preview={preview} />
      <div className="auth-switch">
        {copy.newMember}{" "}
        <a href={`/sign-up?returnTo=${encodeURIComponent(returnTo)}`}>
          {copy.createAccount}
        </a>
      </div>
      <a href="/" className="auth-back">{copy.back}</a>
    </div>
  );
}

export function SignUp(_props?: Record<string, unknown>) {
  const { copy, returnTo, errorCode, preview } = useAuthPageContext();
  return (
    <div className="auth-form-content">
      <div className="auth-eyebrow">{copy.signUpEyebrow}</div>
      <h2 className="auth-title">{copy.signUpTitle}</h2>
      <p className="auth-description">{copy.signUpBody}</p>
      {errorCode && (
        <div role="alert" className="auth-error">
          {copy[errorCode]}
        </div>
      )}
      <AuthForm mode="sign-up" copy={copy} returnTo={returnTo} />
      <div className="auth-secure">{copy.secure}</div>
      <AuthGuidance copy={copy} preview={preview} />
      <div className="auth-switch">
        {copy.existingMember}{" "}
        <a href={`/sign-in?returnTo=${encodeURIComponent(returnTo)}`}>
          {copy.signInLink}
        </a>
      </div>
      <a href="/" className="auth-back">{copy.back}</a>
    </div>
  );
}