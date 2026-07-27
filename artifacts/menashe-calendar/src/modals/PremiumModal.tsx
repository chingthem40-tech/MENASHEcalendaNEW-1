import { useState, useRef } from "react";
import { createRazorpayOrder, verifyRazorpayPayment } from "../lib/userApi";
import { GOLD_GRAD as GOLD } from "../lib/theme";
import { useLanguage } from "../context/LanguageContext";

interface Props { onClose: () => void; onActivated?: () => void; }

type Step = "plans" | "payment" | "upi" | "card" | "processing" | "success" | "failed";
type Plan = "monthly" | "annual";
type PayMethod = "upi" | "card";

const FEATURES = [
  { emoji: "⏰", title: "Full Zmanim", desc: "All 15+ daily prayer times for any location" },
  { emoji: "📖", title: "Torah Library", desc: "Complete Daf Yomi, Mishna Yomit & Halacha Yomit" },
  { emoji: "🗓", title: "Multi-year Calendar", desc: "Plan events years ahead with all holidays" },
  { emoji: "💧", title: "Tahara Tools", desc: "Advanced mikveh & purity calculator" },
  { emoji: "🕯", title: "Shabbat Alerts", desc: "Candle lighting reminders every Friday" },
  { emoji: "📊", title: "Community Census", desc: "Full Bnei Menashe community data & insights" },
];

const UPI_APPS = [
  { name: "GPay", color: "#4285F4", icon: "G" },
  { name: "PhonePe", color: "#5f259f", icon: "P" },
  { name: "Paytm", color: "#002970", icon: "₹" },
  { name: "BHIM", color: "#00539C", icon: "B" },
];

const UPI_ID = "8414981218@idfcfirst";

declare global {
  interface Window {
    Razorpay: any;
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function detectCardType(num: string): { type: string; color: string; logo: string } {
  const n = num.replace(/\s/g, "");
  if (/^4/.test(n)) return { type: "VISA", color: "#1a1f71", logo: "VISA" };
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return { type: "MASTERCARD", color: "#eb001b", logo: "MC" };
  if (/^6[0-9]/.test(n)) return { type: "RUPAY", color: "#0a6e3b", logo: "RuPay" };
  if (/^3[47]/.test(n)) return { type: "AMEX", color: "#007bc1", logo: "AMEX" };
  return { type: "", color: "#334155", logo: "" };
}

function formatCardNumber(val: string) {
  const digits = val.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(val: string) {
  const digits = val.replace(/\D/g, "").slice(0, 4);
  if (digits.length >= 3) return digits.slice(0, 2) + "/" + digits.slice(2);
  return digits;
}

function maskCardNumber(num: string) {
  const raw = num.replace(/\s/g, "");
  if (raw.length <= 4) return num || "•••• •••• •••• ••••";
  const masked = raw.slice(0, -4).replace(/\d/g, "•") + raw.slice(-4);
  return masked.replace(/(.{4})/g, "$1 ").trim();
}

function QRCode() {
  return (
    <img
      src="/upi-qr.jpeg"
      alt="UPI QR Code"
      style={{ width: 180, height: 180, objectFit: "contain", display: "block", borderRadius: 8 }}
    />
  );
}

function CardPreview({ number, name, expiry, cvv, showCvv }: {
  number: string; name: string; expiry: string; cvv: string; showCvv: boolean;
}) {
  const card = detectCardType(number);
  const bg = number.replace(/\s/g, "").length > 0 ? card.color : "#1e293b";

  return (
    <div style={{
      width: "100%", height: 180,
      borderRadius: 18,
      background: `linear-gradient(135deg, ${bg}ee, ${bg}99)`,
      border: "1px solid rgba(255,255,255,0.12)",
      boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      padding: "20px 22px",
      position: "relative",
      overflow: "hidden",
      transition: "background 0.4s",
      marginBottom: 20,
    }}>
      <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
      <div style={{ position: "absolute", bottom: -60, left: -20, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
        <div style={{ width: 38, height: 28, borderRadius: 5, background: "linear-gradient(135deg, #d4a843, #f0c96a)", opacity: 0.9 }} />
        {card.logo && (
          <div style={{ fontSize: card.type === "VISA" ? 18 : 14, fontWeight: 900, color: "white", letterSpacing: card.type === "VISA" ? "0.1em" : "0", fontStyle: card.type === "VISA" ? "italic" : "normal", textShadow: "0 1px 3px rgba(0,0,0,0.4)" }}>{card.logo}</div>
        )}
      </div>
      {showCvv ? (
        <div style={{ textAlign: "center", marginTop: 10 }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginBottom: 6 }}>CVV</div>
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "0.4em", color: "white", fontFamily: "monospace" }}>{cvv || "•••"}</div>
        </div>
      ) : (
        <>
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "0.18em", color: "white", fontFamily: "monospace", marginBottom: 16, textShadow: "0 1px 3px rgba(0,0,0,0.3)" }}>
            {maskCardNumber(number)}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", marginBottom: 2 }}>Card Holder</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "white", textTransform: "uppercase", letterSpacing: "0.06em" }}>{name || "YOUR NAME"}</div>
            </div>
            <div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", marginBottom: 2 }}>Expires</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "white", fontFamily: "monospace" }}>{expiry || "MM/YY"}</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, maxLength, inputMode, suffix, error, onFocus, onBlur }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; maxLength?: number;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  suffix?: React.ReactNode; error?: string;
  onFocus?: () => void; onBlur?: () => void;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </div>
      <div style={{ position: "relative" }}>
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          inputMode={inputMode}
          onFocus={() => { setFocused(true); onFocus?.(); }}
          onBlur={() => { setFocused(false); onBlur?.(); }}
          style={{
            width: "100%", padding: suffix ? "13px 44px 13px 14px" : "13px 14px",
            borderRadius: 10, border: `1.5px solid ${error ? "#ef4444" : focused ? "#d4a843" : "var(--border)"}`,
            background: focused ? "rgba(212,168,67,0.04)" : "var(--card)",
            color: "var(--foreground)", fontSize: 15, fontFamily: "monospace",
            outline: "none", transition: "border-color 0.15s, background 0.15s",
            letterSpacing: "0.05em",
          }}
        />
        {suffix && <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)" }}>{suffix}</div>}
      </div>
      {error && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 4 }}>{error}</div>}
    </div>
  );
}

function Spinner() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" style={{ animation: "spin 0.8s linear infinite" }}>
      <circle cx="11" cy="11" r="9" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" fill="none" />
      <path d="M11 2 A9 9 0 0 1 20 11" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export default function PremiumModal({ onClose, onActivated }: Props) {
  const { t } = useLanguage();
  const [step, setStep] = useState<Step>("plans");
  const [plan, setPlan] = useState<Plan>("annual");
  const [payMethod, setPayMethod] = useState<PayMethod>("upi");
  const [copied, setCopied] = useState(false);
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [showCvv, setShowCvv] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveCard, setSaveCard] = useState(false);

  const monthlyPrice = "₹199";
  const annualPrice = "₹999";
  const annualPerMonth = "₹83";
  const price = plan === "annual" ? annualPrice : monthlyPrice;

  function copyUPI() {
    navigator.clipboard.writeText(UPI_ID).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function openRazorpayCheckout(prefill?: { method?: string }) {
    setStep("processing");
    setErrorMsg("");

    const loaded = await loadRazorpayScript();
    if (!loaded) {
      setErrorMsg("Failed to load payment SDK. Please check your internet connection.");
      setStep("failed");
      return;
    }

    let orderData: { orderId: string; amount: number; currency: string; keyId: string };
    try {
      orderData = await createRazorpayOrder(plan);
    } catch (err: any) {
      setErrorMsg(err?.message ?? "Could not create payment order. Please try again.");
      setStep("failed");
      return;
    }

    const options: any = {
      key: orderData.keyId,
      amount: orderData.amount,
      currency: orderData.currency,
      name: "Bnei Menashe Calendar",
      description: `Premium ${plan === "annual" ? "Annual" : "Monthly"} Plan`,
      image: `${window.location.origin}/logo.png`,
      order_id: orderData.orderId,
      theme: { color: "#d4a843" },
      handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
        setStep("processing");
        try {
          const result = await verifyRazorpayPayment({
            orderId: response.razorpay_order_id,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
            plan,
          });
          if (result.verified && result.isPremium) {
            setStep("success");
            onActivated?.();
          } else {
            setErrorMsg("Payment could not be verified. Contact support with your payment ID.");
            setStep("failed");
          }
        } catch (err: any) {
          setErrorMsg(err?.message ?? "Verification failed. Contact support.");
          setStep("failed");
        }
      },
      modal: {
        ondismiss: () => {
          if (step === "processing") {
            setStep("payment");
          }
        },
      },
    };

    if (prefill) options.prefill = prefill;

    const rzp = new window.Razorpay(options);
    rzp.on("payment.failed", (response: any) => {
      setErrorMsg(response?.error?.description ?? "Payment failed. Please try again.");
      setStep("failed");
    });
    rzp.open();
  }

  function handleAppPay(appName: string) {
    setSelectedApp(appName);
    openRazorpayCheckout({ method: "upi" });
  }

  function handleCardNumberChange(val: string) {
    setCardNumber(formatCardNumber(val));
    if (errors.cardNumber) setErrors(e => ({ ...e, cardNumber: "" }));
  }

  function handleExpiryChange(val: string) {
    setExpiry(formatExpiry(val));
    if (errors.expiry) setErrors(e => ({ ...e, expiry: "" }));
  }

  function handleCvvChange(val: string) {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    setCvv(digits);
    if (errors.cvv) setErrors(e => ({ ...e, cvv: "" }));
  }

  function handleNameChange(val: string) {
    const letters = val.replace(/[^a-zA-Z\s]/g, "").slice(0, 26);
    setCardName(letters);
    if (errors.cardName) setErrors(e => ({ ...e, cardName: "" }));
  }

  function validateCard() {
    const newErrors: Record<string, string> = {};
    const rawNum = cardNumber.replace(/\s/g, "");
    if (rawNum.length < 16) newErrors.cardNumber = "Enter a valid 16-digit card number";
    if (!cardName.trim() || cardName.trim().split(" ").length < 2)
      newErrors.cardName = "Enter full name as on card";
    const [mm, yy] = expiry.split("/");
    const nowYear = new Date().getFullYear() % 100;
    const nowMonth = new Date().getMonth() + 1;
    if (!mm || !yy || Number(mm) < 1 || Number(mm) > 12)
      newErrors.expiry = "Enter a valid expiry (MM/YY)";
    else if (Number(yy) < nowYear || (Number(yy) === nowYear && Number(mm) < nowMonth))
      newErrors.expiry = "This card has expired";
    if (cvv.length < 3) newErrors.cvv = "Enter a valid CVV";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleCardPay() {
    if (!validateCard()) return;
    openRazorpayCheckout({ method: "card" });
  }

  const BackBtn = ({ to }: { to: Step }) => (
    <button
      onClick={() => setStep(to)}
      style={{ background: "none", border: "none", color: "var(--muted-foreground)", cursor: "pointer", fontSize: 13, marginBottom: 14, padding: 0, display: "flex", alignItems: "center", gap: 4 }}
    >
      ← Back
    </button>
  );

  const AmountBadge = () => (
    <div style={{ textAlign: "center", marginBottom: 16, padding: "10px", borderRadius: 12, background: "rgba(212,168,67,0.1)", border: "1px solid rgba(212,168,67,0.3)" }}>
      <span style={{ fontSize: 13, color: "var(--muted-foreground)" }}>Amount: </span>
      <span style={{ fontSize: 18, fontWeight: 800, color: "#d4a843" }}>{price}</span>
      <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>{plan === "annual" ? " / year" : " / month"}</span>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes checkPop { 0% { transform: scale(0.4); opacity: 0; } 70% { transform: scale(1.15); } 100% { transform: scale(1); opacity: 1; } }
        @keyframes progressBar { from { width: 0%; } to { width: 100%; } }
      `}</style>

      <div className="modal-overlay" onClick={step === "success" ? onClose : undefined}>
        <div className="modal-sheet" onClick={e => e.stopPropagation()} style={{ maxHeight: "92vh", overflowY: "auto", padding: 0 }}>

          {/* Gradient header */}
          <div style={{ background: "linear-gradient(180deg, rgba(212,168,67,0.16) 0%, transparent 100%)", padding: "20px 20px 0", borderRadius: "20px 20px 0 0" }}>
            <div className="modal-handle" />
            {step !== "processing" && (
              <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.08)", border: "none", color: "var(--muted-foreground)", width: 30, height: 30, borderRadius: "50%", cursor: "pointer", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            )}

            {/* Progress dots */}
            <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 16 }}>
              {(["plans", "payment", "card", "success"] as const).map(s => {
                const active = s === step || (step === "upi" && s === "card") || (step === "processing" && s === "card") || (step === "failed" && s === "card");
                const done =
                  (s === "plans" && ["payment","upi","card","processing","success","failed"].includes(step)) ||
                  (s === "payment" && ["upi","card","processing","success","failed"].includes(step)) ||
                  (s === "card" && ["processing","success"].includes(step));
                return (
                  <div key={s} style={{
                    height: 3, width: active ? 24 : done ? 14 : 8,
                    borderRadius: 99,
                    background: done ? "rgba(74,222,128,0.7)" : active ? "#d4a843" : "rgba(212,168,67,0.2)",
                    transition: "all 0.3s",
                  }} />
                );
              })}
            </div>
          </div>

          <div style={{ padding: "0 20px 24px", animation: "fadeUp 0.25s ease-out" }}>

            {/* ════ STEP: PLANS ════ */}
            {step === "plans" && (
              <>
                <div style={{ textAlign: "center", marginBottom: 20 }}>
                  <div style={{ width: 58, height: 58, borderRadius: 18, background: GOLD, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, margin: "0 auto 10px", boxShadow: "0 4px 20px rgba(212,168,67,0.45)" }}>⭐</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "var(--foreground)" }}>{t.premiumTitle}</div>
                  <div style={{ fontSize: 13, color: "var(--muted-foreground)", marginTop: 4 }}>{t.premiumSubtitle}</div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                  {FEATURES.map((f, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", background: "var(--card)", borderRadius: 12, border: "1px solid var(--border)" }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(212,168,67,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{f.emoji}</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)" }}>{f.title}</div>
                        <div style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 1 }}>{f.desc}</div>
                      </div>
                      <div style={{ marginLeft: "auto", color: "#4ade80", fontSize: 16 }}>✓</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                  <button onClick={() => setPlan("monthly")} style={{ padding: "16px 12px", borderRadius: 14, cursor: "pointer", textAlign: "center", border: plan === "monthly" ? "2px solid #d4a843" : "2px solid var(--border)", background: plan === "monthly" ? "rgba(212,168,67,0.08)" : "var(--card)", transition: "all 0.2s" }}>
                    <div style={{ fontSize: 11, color: "var(--muted-foreground)", marginBottom: 4 }}>MONTHLY</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: plan === "monthly" ? "#d4a843" : "var(--foreground)" }}>{monthlyPrice}</div>
                    <div style={{ fontSize: 11, color: "var(--muted-foreground)" }}>per month</div>
                  </button>
                  <button onClick={() => setPlan("annual")} style={{ padding: "16px 12px", borderRadius: 14, cursor: "pointer", textAlign: "center", border: plan === "annual" ? "2px solid #d4a843" : "2px solid var(--border)", background: plan === "annual" ? "rgba(212,168,67,0.1)" : "var(--card)", transition: "all 0.2s", position: "relative" }}>
                    <div style={{ position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)", background: GOLD, color: "#0a0f1e", fontSize: 9, fontWeight: 800, padding: "3px 10px", borderRadius: 99, whiteSpace: "nowrap", letterSpacing: "0.06em" }}>SAVE 58%</div>
                    <div style={{ fontSize: 11, color: "var(--muted-foreground)", marginBottom: 4 }}>ANNUAL</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: plan === "annual" ? "#d4a843" : "var(--foreground)" }}>{annualPrice}</div>
                    <div style={{ fontSize: 11, color: "var(--muted-foreground)" }}>{annualPerMonth}/month</div>
                  </button>
                </div>

                <div style={{ textAlign: "center", fontSize: 12, color: "var(--muted-foreground)", marginBottom: 14, padding: "8px 0", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
                  🔒 Secure payment · Powered by Razorpay
                </div>

                <button className="btn-gold" onClick={() => setStep("payment")} style={{ width: "100%", padding: "15px", fontSize: 15, fontWeight: 800, borderRadius: 14 }}>
                  Continue to Payment →
                </button>
                <button onClick={onClose} className="btn-close-full" style={{ marginTop: 10 }}>
                  Maybe Later
                </button>
              </>
            )}

            {/* ════ STEP: PAYMENT METHOD ════ */}
            {step === "payment" && (
              <>
                <BackBtn to="plans" />
                <div style={{ textAlign: "center", marginBottom: 20 }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "var(--foreground)" }}>Choose Payment</div>
                  <div style={{ fontSize: 13, color: "var(--muted-foreground)", marginTop: 4 }}>{price}{plan === "annual" ? "/year" : "/month"}</div>
                </div>

                {/* UPI */}
                <button onClick={() => setStep("upi")} style={{ width: "100%", padding: "18px 16px", borderRadius: 14, cursor: "pointer", border: "2px solid #d4a843", background: "rgba(212,168,67,0.08)", display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: GOLD, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>₹</div>
                  <div style={{ textAlign: "left", flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#d4a843" }}>UPI Payment</div>
                    <div style={{ fontSize: 12, color: "var(--muted-foreground)" }}>GPay · PhonePe · Paytm · BHIM · any UPI</div>
                  </div>
                  <div style={{ background: GOLD, color: "#0a0f1e", fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 99, letterSpacing: "0.05em" }}>INDIA</div>
                  <span style={{ color: "#d4a843", fontSize: 18 }}>›</span>
                </button>

                <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "4px 0 10px" }}>
                  <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                  <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>or</span>
                  <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                </div>

                {/* Card */}
                <button onClick={() => setStep("card")} style={{ width: "100%", padding: "16px", borderRadius: 14, cursor: "pointer", border: "1px solid var(--border)", background: "var(--card)", display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(99,102,241,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>💳</div>
                  <div style={{ textAlign: "left", flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "var(--foreground)" }}>Credit / Debit Card</div>
                    <div style={{ fontSize: 12, color: "var(--muted-foreground)" }}>Visa · Mastercard · RuPay · Amex</div>
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    {[{ bg: "#1a1f71", label: "V" }, { bg: "#eb001b", label: "M" }, { bg: "#0a6e3b", label: "R" }].map(c => (
                      <div key={c.label} style={{ width: 22, height: 14, borderRadius: 3, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 900, color: "white" }}>{c.label}</div>
                    ))}
                  </div>
                  <span style={{ color: "var(--muted-foreground)", fontSize: 18 }}>›</span>
                </button>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 14, fontSize: 11, color: "var(--muted-foreground)" }}>
                  <span>🔒</span>
                  <span>Payments secured by Razorpay · PCI DSS compliant</span>
                </div>
              </>
            )}

            {/* ════ STEP: UPI ════ */}
            {step === "upi" && (
              <>
                <BackBtn to="payment" />
                <div style={{ textAlign: "center", marginBottom: 18 }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "var(--foreground)" }}>Pay via UPI</div>
                  <div style={{ fontSize: 13, color: "var(--muted-foreground)", marginTop: 4 }}>Tap your UPI app to open Razorpay checkout</div>
                </div>

                <AmountBadge />

                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginBottom: 18 }}>
                  <div style={{ padding: 12, borderRadius: 16, background: "white", boxShadow: "0 4px 24px rgba(0,0,0,0.5)" }}>
                    <QRCode />
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted-foreground)" }}>Scan QR — or tap an app below to pay via Razorpay</div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                  {UPI_APPS.map(app => (
                    <button key={app.name} onClick={() => handleAppPay(app.name)} style={{ padding: "14px 12px", borderRadius: 12, cursor: "pointer", border: selectedApp === app.name ? `2px solid ${app.color}` : "1px solid var(--border)", background: selectedApp === app.name ? `${app.color}22` : "var(--card)", display: "flex", alignItems: "center", gap: 10, transition: "all 0.2s" }}>
                      <div style={{ width: 34, height: 34, borderRadius: 10, background: app.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, color: "white", flexShrink: 0 }}>{app.icon}</div>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)" }}>{app.name}</span>
                    </button>
                  ))}
                </div>

                <div style={{ padding: "12px 14px", borderRadius: 12, background: "var(--card)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 10, color: "var(--muted-foreground)", marginBottom: 2 }}>UPI ID (manual)</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)", fontFamily: "monospace" }}>{UPI_ID}</div>
                  </div>
                  <button onClick={copyUPI} style={{ padding: "6px 12px", borderRadius: 8, cursor: "pointer", border: "none", background: copied ? "rgba(74,222,128,0.2)" : "rgba(212,168,67,0.15)", color: copied ? "#4ade80" : "#d4a843", fontSize: 12, fontWeight: 700 }}>
                    {copied ? "✓ Copied!" : "Copy"}
                  </button>
                </div>

                <div style={{ fontSize: 11, color: "var(--muted-foreground)", textAlign: "center", marginTop: 6 }}>
                  Tapping an app above opens Razorpay's secure checkout
                </div>
              </>
            )}

            {/* ════ STEP: CARD ════ */}
            {step === "card" && (
              <>
                <BackBtn to="payment" />
                <div style={{ textAlign: "center", marginBottom: 16 }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "var(--foreground)" }}>Card Details</div>
                  <div style={{ fontSize: 13, color: "var(--muted-foreground)", marginTop: 4 }}>{price}{plan === "annual" ? "/year" : "/month"}</div>
                </div>

                <CardPreview number={cardNumber} name={cardName} expiry={expiry} cvv={cvv} showCvv={showCvv} />

                <Field label="Card Number" value={cardNumber} onChange={handleCardNumberChange} placeholder="1234 5678 9012 3456" maxLength={19} inputMode="numeric" error={errors.cardNumber}
                  suffix={cardNumber.replace(/\s/g,"").length > 0 ? <div style={{ width: 28, height: 18, borderRadius: 3, background: detectCardType(cardNumber).color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 900, color: "white" }}>{detectCardType(cardNumber).logo}</div> : null}
                />
                <Field label="Cardholder Name" value={cardName} onChange={handleNameChange} placeholder="Name as on card" maxLength={26} error={errors.cardName} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Field label="Expiry" value={expiry} onChange={handleExpiryChange} placeholder="MM/YY" maxLength={5} inputMode="numeric" error={errors.expiry} />
                  <Field label="CVV" value={cvv} onChange={handleCvvChange} placeholder="•••" maxLength={4} inputMode="numeric" error={errors.cvv}
                    onFocus={() => setShowCvv(true)} onBlur={() => setShowCvv(false)}
                    suffix={<button type="button" onClick={() => setShowCvv(v => !v)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, padding: 0, color: "var(--muted-foreground)" }}>{showCvv ? "👁" : "🔒"}</button>}
                  />
                </div>

                <button onClick={() => setSaveCard(v => !v)} style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer", padding: "4px 0", marginBottom: 16 }}>
                  <div style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${saveCard ? "#d4a843" : "var(--border)"}`, background: saveCard ? "rgba(212,168,67,0.2)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s", flexShrink: 0 }}>
                    {saveCard && <span style={{ fontSize: 12, color: "#d4a843" }}>✓</span>}
                  </div>
                  <span style={{ fontSize: 13, color: "var(--muted-foreground)" }}>Save card for faster payments</span>
                </button>

                <button onClick={handleCardPay} style={{ width: "100%", padding: "15px", borderRadius: 14, border: "none", cursor: "pointer", fontSize: 15, fontWeight: 800, background: GOLD, color: "#0a0f1e", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  🔒 Pay {price} via Razorpay
                </button>

                <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 14, flexWrap: "wrap" }}>
                  {["🔒 SSL Secure", "✓ PCI DSS", "🛡 Razorpay Protected"].map(b => (
                    <span key={b} style={{ fontSize: 11, color: "var(--muted-foreground)" }}>{b}</span>
                  ))}
                </div>
              </>
            )}

            {/* ════ STEP: PROCESSING ════ */}
            {step === "processing" && (
              <div style={{ textAlign: "center", padding: "30px 0 20px" }}>
                <div style={{ width: 70, height: 70, borderRadius: "50%", background: "rgba(212,168,67,0.12)", border: "2px solid rgba(212,168,67,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                  <Spinner />
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "var(--foreground)", marginBottom: 8 }}>Processing Payment…</div>
                <div style={{ fontSize: 13, color: "var(--muted-foreground)", marginBottom: 28 }}>Please do not close this window</div>
                <div style={{ height: 4, borderRadius: 99, background: "var(--border)", overflow: "hidden", marginBottom: 24 }}>
                  <div style={{ height: "100%", borderRadius: 99, background: GOLD, animation: "progressBar 2.6s ease-in-out forwards" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    { label: "Connecting to Razorpay", done: true },
                    { label: "Verifying payment", done: true },
                    { label: "Activating your subscription", done: false },
                  ].map((item, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", borderRadius: 10, background: "var(--card)" }}>
                      <div style={{ width: 20, height: 20, borderRadius: "50%", background: item.done ? "rgba(74,222,128,0.2)" : "rgba(212,168,67,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, flexShrink: 0 }}>
                        {item.done ? "✓" : <Spinner />}
                      </div>
                      <span style={{ fontSize: 13, color: item.done ? "var(--foreground)" : "var(--muted-foreground)" }}>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ════ STEP: FAILED ════ */}
            {step === "failed" && (
              <div style={{ textAlign: "center", padding: "30px 0 10px" }}>
                <div style={{ width: 70, height: 70, borderRadius: "50%", background: "rgba(239,68,68,0.12)", border: "2px solid rgba(239,68,68,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 32 }}>✕</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "var(--foreground)", marginBottom: 8 }}>Payment Failed</div>
                {errorMsg && (
                  <div style={{ fontSize: 13, color: "#ef4444", marginBottom: 20, padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                    {errorMsg}
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <button onClick={() => { setStep("payment"); setErrorMsg(""); setSelectedApp(null); }} style={{ padding: "14px", borderRadius: 13, border: "none", cursor: "pointer", background: GOLD, color: "#0a0f1e", fontSize: 15, fontWeight: 800 }}>
                    Try Again
                  </button>
                  <button onClick={onClose} style={{ padding: "11px", borderRadius: 13, border: "1px solid rgba(212,168,67,0.25)", background: "transparent", color: "rgba(255,255,255,0.5)", fontSize: 13, cursor: "pointer" }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* ════ STEP: SUCCESS ════ */}
            {step === "success" && (
              <div style={{ textAlign: "center", padding: "20px 0 10px" }}>
                <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(74,222,128,0.15)", border: "2px solid rgba(74,222,128,0.4)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 36, animation: "checkPop 0.5s cubic-bezier(0.175,0.885,0.32,1.275) forwards" }}>
                  ✓
                </div>
                <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 8, background: GOLD, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  Premium Activated!
                </div>
                <div style={{ fontSize: 14, color: "var(--muted-foreground)", lineHeight: 1.6, marginBottom: 24 }}>
                  Your payment was verified and Premium is now active. Enjoy full access to all features.
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <button onClick={onClose} style={{ padding: "14px", borderRadius: 13, border: "none", cursor: "pointer", background: GOLD, color: "#0a0f1e", fontSize: 15, fontWeight: 800, boxShadow: "0 4px 20px rgba(212,168,67,0.4)" }}>
                    ✦ Explore Premium Features
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
