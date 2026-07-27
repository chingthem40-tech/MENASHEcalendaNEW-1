import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Polygon, Polyline } from "react-native-svg";
import { useSignIn } from "@clerk/expo";
import { router } from "expo-router";

const GOLD = "#D4AF37";
const GOLD_BRIGHT = "#F5D982";
const DARK_INPUT = "#18181f";
const BORDER_DARK = "#2a2a36";

const { width: SW } = Dimensions.get("window");
const CARD_W = Math.min(SW - 32, 420);

function LogoBadge() {
  return (
    <View style={styles.logoBadge}>
      <Svg viewBox="0 0 80 80" width={44} height={44} fill="none">
        <Polygon
          points="40,6 58,38 22,38"
          stroke={GOLD}
          strokeWidth="2.8"
          strokeLinejoin="round"
          fill="rgba(212,175,55,0.07)"
        />
        <Polygon
          points="40,62 22,30 58,30"
          stroke={GOLD}
          strokeWidth="2.8"
          strokeLinejoin="round"
          fill="rgba(212,175,55,0.07)"
        />
        <Polyline
          points="14,74 14,30 40,56 66,30 66,74"
          stroke={GOLD}
          strokeWidth="4.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    </View>
  );
}

type Step = "email" | "reset";

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const { signIn, fetchStatus } = useSignIn();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSendCode() {
    if (!email.trim()) return;
    setErrorMsg("");
    setLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (signIn as any).create({
        strategy: "reset_password_email_code",
        identifier: email.trim(),
      });
      setStep("reset");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Could not send reset code";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleReset() {
    if (!code.trim() || !newPassword.trim()) return;
    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords do not match");
      return;
    }
    setErrorMsg("");
    setLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (signIn as any).attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: code.trim(),
        password: newPassword,
      });
      if (result.status === "complete") {
        router.replace("/sign-in");
      } else {
        setErrorMsg("Reset incomplete. Please try again.");
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Reset failed";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={["#080810", "#0d0d18"]}
        style={StyleSheet.absoluteFill}
      />
      {/* Subtle gold glow */}
      <View style={styles.centerGlow} pointerEvents="none" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "android" ? 24 : 0}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            {/* Header */}
            <LinearGradient
              colors={["#0d0d18", "#111120"]}
              style={styles.cardHeader}
            >
              <LinearGradient
                colors={["transparent", GOLD, "#FFE878", GOLD, "transparent"]}
                locations={[0, 0.25, 0.5, 0.75, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.topGoldBar}
              />
              <LogoBadge />
              <Text style={styles.brandName}>BNEI MENASHE</Text>
              <Text style={styles.brandSub}>SACRED CALENDAR</Text>
            </LinearGradient>

            <LinearGradient
              colors={["transparent", GOLD, "#FFE878", GOLD, "transparent"]}
              locations={[0, 0.2, 0.5, 0.8, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.goldSep}
            />

            {/* Form */}
            <LinearGradient
              colors={["#111118", "#0f0f16"]}
              style={styles.formBody}
            >
              {step === "email" ? (
                <>
                  <Text style={styles.title}>Reset Password</Text>
                  <Text style={styles.subtitle}>
                    Enter your email and we'll send you a reset code.
                  </Text>

                  <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email address"
                    placeholderTextColor="#4a4a5a"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    returnKeyType="go"
                    onSubmitEditing={handleSendCode}
                    selectionColor={GOLD}
                  />

                  {!!errorMsg && (
                    <Text style={styles.errorText}>{errorMsg}</Text>
                  )}

                  <TouchableOpacity
                    style={[
                      styles.btn,
                      (!email.trim() || loading) && styles.btnDisabled,
                    ]}
                    onPress={handleSendCode}
                    activeOpacity={0.82}
                    disabled={!email.trim() || loading}
                  >
                    <LinearGradient
                      colors={["#F0C840", "#C49A20"]}
                      style={styles.btnGradient}
                    >
                      {loading ? (
                        <ActivityIndicator color="#0a0800" />
                      ) : (
                        <Text style={styles.btnText}>Send Reset Code</Text>
                      )}
                    </LinearGradient>
                    <View style={styles.btnShadow} />
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.title}>Enter New Password</Text>
                  <Text style={styles.subtitle}>
                    Check your email for a 6-digit code, then choose a new password.
                  </Text>

                  <Text style={styles.fieldLabel}>RESET CODE</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="6-digit code from email"
                    placeholderTextColor="#4a4a5a"
                    value={code}
                    onChangeText={setCode}
                    keyboardType="numeric"
                    returnKeyType="next"
                    selectionColor={GOLD}
                  />

                  <Text style={styles.fieldLabel}>NEW PASSWORD</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Create new password"
                    placeholderTextColor="#4a4a5a"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                    returnKeyType="next"
                    selectionColor={GOLD}
                  />

                  <Text style={styles.fieldLabel}>CONFIRM PASSWORD</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm new password"
                    placeholderTextColor="#4a4a5a"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    returnKeyType="go"
                    onSubmitEditing={handleReset}
                    selectionColor={GOLD}
                  />

                  {!!errorMsg && (
                    <Text style={styles.errorText}>{errorMsg}</Text>
                  )}

                  <TouchableOpacity
                    style={[
                      styles.btn,
                      (!code.trim() || !newPassword.trim() || !confirmPassword.trim() || loading) &&
                        styles.btnDisabled,
                    ]}
                    onPress={handleReset}
                    activeOpacity={0.82}
                    disabled={!code.trim() || !newPassword.trim() || !confirmPassword.trim() || loading}
                  >
                    <LinearGradient
                      colors={["#F0C840", "#C49A20"]}
                      style={styles.btnGradient}
                    >
                      {loading ? (
                        <ActivityIndicator color="#0a0800" />
                      ) : (
                        <Text style={styles.btnText}>Reset Password</Text>
                      )}
                    </LinearGradient>
                    <View style={styles.btnShadow} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{ marginTop: 14, alignItems: "center" }}
                    onPress={() => {
                      setStep("email");
                      setCode("");
                      setNewPassword("");
                      setConfirmPassword("");
                      setErrorMsg("");
                    }}
                  >
                    <Text style={styles.backLink}>← Back to email</Text>
                  </TouchableOpacity>
                </>
              )}
            </LinearGradient>

            {/* Footer */}
            <TouchableOpacity
              style={styles.footer}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Text style={styles.footerText}>← Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#080810" },
  centerGlow: {
    position: "absolute",
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: "rgba(212,175,55,0.03)",
    top: "20%",
    left: "50%",
    transform: [{ translateX: -180 }, { translateY: -180 }],
  },
  scroll: {
    alignItems: "center",
    justifyContent: "center",
    flexGrow: 1,
    paddingHorizontal: 16,
  },
  card: {
    width: CARD_W,
    borderRadius: 20,
    overflow: "hidden",
    borderTopWidth: 1.5,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: "rgba(212,175,55,0.65)",
    borderLeftColor: "rgba(212,175,55,0.28)",
    borderRightColor: "rgba(212,175,55,0.18)",
    borderBottomColor: "rgba(212,175,55,0.12)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 24 },
        shadowOpacity: 0.9,
        shadowRadius: 48,
      },
      android: { elevation: 32 },
    }),
  },
  cardHeader: {
    paddingVertical: 28,
    alignItems: "center",
    gap: 10,
  },
  topGoldBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(8,8,14,0.97)",
    borderWidth: 2,
    borderColor: "rgba(212,175,55,0.75)",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.9,
        shadowRadius: 16,
      },
      android: { elevation: 12 },
    }),
  },
  brandName: {
    color: GOLD_BRIGHT,
    fontWeight: "800",
    fontSize: 18,
    letterSpacing: 3.5,
    textTransform: "uppercase",
  },
  brandSub: {
    color: "rgba(245,217,130,0.55)",
    fontSize: 9,
    letterSpacing: 5,
    textTransform: "uppercase",
    marginTop: -2,
  },
  goldSep: { height: 2 },
  formBody: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16 },
  title: {
    color: GOLD_BRIGHT,
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  subtitle: {
    color: "#706050",
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 24,
  },
  fieldLabel: {
    color: "#807060",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  input: {
    height: 48,
    backgroundColor: DARK_INPUT,
    borderWidth: 1,
    borderColor: BORDER_DARK,
    borderRadius: 10,
    paddingHorizontal: 14,
    color: "#F0EDE4",
    fontSize: 15,
    marginBottom: 16,
  },
  errorText: { color: "#ff6b6b", fontSize: 13, marginBottom: 12, lineHeight: 18 },
  btn: {
    borderRadius: 10,
    marginTop: 4,
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#7a5000",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.9,
        shadowRadius: 0,
      },
      android: { elevation: 4 },
    }),
  },
  btnDisabled: { opacity: 0.5 },
  btnGradient: {
    height: 50,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  btnShadow: {
    position: "absolute",
    bottom: -5,
    left: 4,
    right: 4,
    height: 8,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    backgroundColor: "rgba(100,65,5,0.88)",
    zIndex: -1,
  },
  btnText: { color: "#0a0800", fontWeight: "800", fontSize: 16, letterSpacing: 0.3 },
  backLink: { color: GOLD, fontSize: 13, fontWeight: "600" },
  footer: {
    backgroundColor: "#0e0e16",
    borderTopWidth: 1,
    borderTopColor: "#1e1e28",
    paddingVertical: 16,
    alignItems: "center",
  },
  footerText: { color: "#706050", fontSize: 13 },
});
