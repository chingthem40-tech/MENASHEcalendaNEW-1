import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Image,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Dimensions,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSignUp, useSSO, useAuth } from "@clerk/expo";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { router, Link } from "expo-router";

WebBrowser.maybeCompleteAuthSession();

// eslint-disable-next-line @typescript-eslint/no-var-requires
const PHOTO = require("@/assets/images/saipikhup-photo.jpg");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const LOGO = require("@/assets/images/logo-benei-menashe.png");

const GOLD = "#D4AF37";
const GOLD_BRIGHT = "#F5D982";
const DARK_INPUT = "#18181f";
const BORDER_DARK = "#2a2a36";

const { width: SW } = Dimensions.get("window");

function useWarmUpBrowser() {
  useEffect(() => {
    if (Platform.OS !== "android") return;
    void WebBrowser.warmUpAsync();
    return () => { void WebBrowser.coolDownAsync(); };
  }, []);
}

export default function SignUpScreen() {
  const insets = useSafeAreaInsets();
  const { isSignedIn } = useAuth();
  const { signUp, errors: signUpErrors, fetchStatus } = useSignUp();
  const { startSSOFlow } = useSSO();
  useWarmUpBrowser();
  const { width: winW } = useWindowDimensions();
  const isWideWeb = Platform.OS === "web" && winW >= 900;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (isSignedIn) router.replace("/(tabs)");
  }, [isSignedIn]);

  async function handleSignUp() {
    if (!email.trim() || !password.trim()) return;
    setErrorMsg("");
    setLoading(true);
    try {
      const { error } = await signUp.password({ emailAddress: email.trim(), password });
      if (error) {
        setErrorMsg(error.message ?? "Sign-up failed");
        return;
      }
      await signUp.verifications.sendEmailCode();
      setVerifying(true);
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : "Sign-up failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    if (!code.trim()) return;
    setErrorMsg("");
    setLoading(true);
    try {
      await signUp.verifications.verifyEmailCode({ code });
      if (signUp.status === "complete") {
        await signUp.finalize({
          navigate: ({ decorateUrl }) => {
            router.replace(decorateUrl("/") as "/(tabs)");
          },
        });
      }
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  const handleGoogle = useCallback(async () => {
    setErrorMsg("");
    setLoading(true);
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: "oauth_google",
        redirectUrl: AuthSession.makeRedirectUri(),
      });
      if (createdSessionId && setActive) {
        await setActive({
          session: createdSessionId,
          navigate: async ({ decorateUrl }) => {
            router.replace(decorateUrl("/") as "/(tabs)");
          },
        });
      }
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : "Google sign-up failed");
    } finally {
      setLoading(false);
    }
  }, [startSSOFlow]);

  const fieldError =
    signUpErrors?.fields?.emailAddress?.message ||
    signUpErrors?.fields?.password?.message ||
    signUpErrors?.fields?.code?.message ||
    errorMsg;

  if (verifying) {
    const verifyFields = (
      <>
        <Text style={styles.welcomeTitle}>Check your email</Text>
        <Text style={styles.welcomeSub}>We sent a verification code to {email}</Text>

        <Text style={styles.fieldLabel}>VERIFICATION CODE</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter 6-digit code"
          placeholderTextColor="#4a4a5a"
          value={code}
          onChangeText={setCode}
          keyboardType="numeric"
          returnKeyType="go"
          onSubmitEditing={handleVerify}
          selectionColor={GOLD}
        />

        {!!fieldError && <Text style={styles.errorText}>{fieldError}</Text>}

        <TouchableOpacity
          style={[styles.continueBtn, (loading || !code) && styles.continueBtnDisabled]}
          onPress={handleVerify}
          activeOpacity={0.82}
          disabled={loading || !code}
        >
          <LinearGradient colors={["#F0C840", "#C49A20"]} style={styles.continueBtnGradient}>
            {loading ? <ActivityIndicator color="#0a0800" /> : <Text style={styles.continueBtnText}>Verify Email</Text>}
          </LinearGradient>
          <View style={styles.continueBtnShadowBar} />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => signUp.verifications.sendEmailCode()} style={{ marginTop: 16, alignItems: "center" }}>
          <Text style={styles.footerLink}>Resend code</Text>
        </TouchableOpacity>
      </>
    );

    if (isWideWeb) {
      return (
        <View style={styles.webRoot}>
          <View style={styles.webBrandPanel}>
            <ImageBackground source={PHOTO} style={StyleSheet.absoluteFill} resizeMode="cover" />
            <LinearGradient
              colors={["rgba(3,3,8,0.30)", "rgba(3,3,8,0.55)", "rgba(3,3,8,0.92)"]}
              locations={[0, 0.55, 1]}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.webBrandContent}>
              <Image source={LOGO} style={styles.webBrandLogo} resizeMode="contain" />
              <Text style={styles.webBrandTitle}>Bnei Menashe Calendar</Text>
              <Text style={styles.webBrandTagline}>Serving the Bnei Menashe community worldwide</Text>
            </View>
          </View>
          <View style={styles.webFormPanel}>
            <ScrollView contentContainerStyle={styles.webFormScroll} keyboardShouldPersistTaps="handled">
              <View style={styles.webFormCard}>
                <LinearGradient colors={["#111118", "#0f0f16"]} style={[styles.webFormBody, { paddingTop: 32, paddingBottom: 24 }]}>
                  {verifyFields}
                </LinearGradient>
              </View>
            </ScrollView>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.root}>
        <ImageBackground source={PHOTO} style={StyleSheet.absoluteFill} resizeMode="cover" />
        <LinearGradient colors={["rgba(3,3,8,0.92)", "rgba(3,3,8,0.88)"]} style={StyleSheet.absoluteFill} />
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView
            contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.card}>
              <LinearGradient colors={["#111118", "#0f0f16"]} style={[styles.formBody, { paddingTop: 32, paddingBottom: 24 }]}>
                {verifyFields}
              </LinearGradient>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  const formFields = (
    <>
      <Text style={styles.welcomeTitle}>Create account</Text>
      <Text style={styles.welcomeSub}>Join the Bnei Menashe community</Text>

      <TouchableOpacity
        style={styles.googleBtn}
        onPress={handleGoogle}
        activeOpacity={0.85}
        disabled={loading}
      >
        <Text style={styles.googleG}>G</Text>
        <Text style={styles.googleText}>Continue with Google</Text>
      </TouchableOpacity>

      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>

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
        returnKeyType="next"
        selectionColor={GOLD}
      />

      <Text style={styles.fieldLabel}>PASSWORD</Text>
      <TextInput
        style={styles.input}
        placeholder="Create a password"
        placeholderTextColor="#4a4a5a"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        returnKeyType="go"
        onSubmitEditing={handleSignUp}
        selectionColor={GOLD}
      />

      {!!fieldError && <Text style={styles.errorText}>{fieldError}</Text>}

      <TouchableOpacity
        style={[styles.continueBtn, (loading || !email || !password) && styles.continueBtnDisabled]}
        onPress={handleSignUp}
        activeOpacity={0.82}
        disabled={loading || !email || !password}
      >
        <LinearGradient colors={["#F0C840", "#C49A20"]} style={styles.continueBtnGradient}>
          {loading ? <ActivityIndicator color="#0a0800" /> : <Text style={styles.continueBtnText}>Create Account</Text>}
        </LinearGradient>
        <View style={styles.continueBtnShadowBar} />
      </TouchableOpacity>

      <View nativeID="clerk-captcha" />
    </>
  );

  const footerRow = (
    <View style={styles.footer}>
      <Text style={styles.footerText}>Already have an account? </Text>
      <Link href="/sign-in" asChild>
        <TouchableOpacity>
          <Text style={styles.footerLink}>Sign in</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );

  if (isWideWeb) {
    return (
      <View style={styles.webRoot}>
        <View style={styles.webBrandPanel}>
          <ImageBackground source={PHOTO} style={StyleSheet.absoluteFill} resizeMode="cover" />
          <LinearGradient
            colors={["rgba(3,3,8,0.30)", "rgba(3,3,8,0.55)", "rgba(3,3,8,0.92)"]}
            locations={[0, 0.55, 1]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.webBrandContent}>
            <Image source={LOGO} style={styles.webBrandLogo} resizeMode="contain" />
            <Text style={styles.webBrandTitle}>Bnei Menashe Calendar</Text>
            <Text style={styles.webBrandTagline}>Serving the Bnei Menashe community worldwide</Text>
          </View>
        </View>

        <View style={styles.webFormPanel}>
          <ScrollView
            contentContainerStyle={styles.webFormScroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.webFormCard}>
              <LinearGradient colors={["#111118", "#0f0f16"]} style={styles.webFormBody}>
                {formFields}
              </LinearGradient>
              {footerRow}
            </View>
          </ScrollView>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ImageBackground source={PHOTO} style={StyleSheet.absoluteFill} resizeMode="cover" imageStyle={{ top: 0 }} />
      <LinearGradient colors={["rgba(3,3,8,0.90)", "rgba(3,3,8,0.84)"]} style={StyleSheet.absoluteFill} />
      <View style={styles.centerGlow} pointerEvents="none" />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <View style={styles.headerWrap}>
              <Image source={PHOTO} style={styles.headerPhoto} resizeMode="cover" />
              <LinearGradient
                colors={["rgba(0,0,0,0.80)", "rgba(0,0,0,0.08)", "rgba(0,0,0,0.08)", "rgba(0,0,0,0.88)"]}
                locations={[0, 0.38, 0.62, 1]}
                style={StyleSheet.absoluteFill}
              />
              <LinearGradient
                colors={["rgba(0,0,0,0.45)", "transparent", "rgba(0,0,0,0.45)"]}
                locations={[0, 0.5, 1]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              <LinearGradient
                colors={["transparent", GOLD, "#FFE878", GOLD, "transparent"]}
                locations={[0, 0.25, 0.5, 0.75, 1]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.topGoldBar}
              />
              <View style={styles.headerContent}>
                <Image source={LOGO} style={styles.logoImg} resizeMode="contain" />
              </View>
            </View>

            <LinearGradient
              colors={["transparent", GOLD, "#FFE878", GOLD, "transparent"]}
              locations={[0, 0.2, 0.5, 0.8, 1]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.goldSep}
            />

            <LinearGradient colors={["#111118", "#0f0f16"]} style={styles.formBody}>
              {formFields}
            </LinearGradient>

            {footerRow}
          </View>

          <Text style={styles.tagline}>Serving the Bnei Menashe community worldwide</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const CARD_W = Math.min(SW - 32, 420);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#030308" },
  webRoot: { flex: 1, flexDirection: "row", backgroundColor: "#030308", minHeight: "100%" },
  webBrandPanel: {
    flex: 1.1,
    minHeight: "100%",
    overflow: "hidden",
    position: "relative",
    borderRightWidth: 1,
    borderRightColor: "rgba(212,175,55,0.18)",
  },
  webBrandContent: {
    position: "absolute",
    left: 0, right: 0, bottom: 0,
    padding: 56,
    alignItems: "flex-start",
  },
  webBrandLogo: { width: 96, height: 96, marginBottom: 24 },
  webBrandTitle: { color: GOLD_BRIGHT, fontSize: 32, fontWeight: "800", letterSpacing: -0.5, marginBottom: 12 },
  webBrandTagline: { color: "rgba(240,237,228,0.75)", fontSize: 15, lineHeight: 22, maxWidth: 420 },
  webFormPanel: {
    flex: 1,
    minHeight: "100%",
    backgroundColor: "#0a0a10",
  },
  webFormScroll: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 48,
  },
  webFormCard: {
    width: "100%",
    maxWidth: 440,
  },
  webFormBody: {
    borderRadius: 16,
    padding: 32,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.18)",
  },
  centerGlow: {
    position: "absolute", width: 400, height: 400, borderRadius: 200,
    backgroundColor: "rgba(212,175,55,0.04)",
    top: "25%", left: "50%",
    transform: [{ translateX: -200 }, { translateY: -200 }],
  },
  scroll: { alignItems: "center", justifyContent: "center", flexGrow: 1, paddingHorizontal: 16 },
  card: {
    width: CARD_W, borderRadius: 20, overflow: "hidden",
    borderTopWidth: 1.5, borderLeftWidth: 1, borderRightWidth: 1, borderBottomWidth: 1,
    borderTopColor: "rgba(212,175,55,0.65)",
    borderLeftColor: "rgba(212,175,55,0.28)",
    borderRightColor: "rgba(212,175,55,0.18)",
    borderBottomColor: "rgba(212,175,55,0.12)",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 24 }, shadowOpacity: 0.9, shadowRadius: 48 },
      android: { elevation: 32 },
    }),
  },
  headerWrap: { height: 230, overflow: "hidden", backgroundColor: "#040404" },
  headerPhoto: { position: "absolute", width: "100%", height: 680, bottom: 0 },
  topGoldBar: { position: "absolute", top: 0, left: 0, right: 0, height: 3 },
  headerContent: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    alignItems: "center", justifyContent: "center",
  },
  logoImg: {
    width: 190, height: 190,
  },
  goldSep: { height: 2 },
  formBody: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 4 },
  welcomeTitle: { color: GOLD_BRIGHT, fontSize: 22, fontWeight: "800", letterSpacing: -0.4, marginBottom: 6 },
  welcomeSub: { color: "#706050", fontSize: 13, marginBottom: 24, lineHeight: 18 },
  googleBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    backgroundColor: "#ffffff", borderRadius: 10, height: 48, borderWidth: 1, borderColor: "#d8d8d8",
    marginBottom: 18,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.12, shadowRadius: 3 },
      android: { elevation: 2 },
    }),
  },
  googleG: { fontSize: 18, fontWeight: "700", color: "#4285F4", fontFamily: Platform.OS === "ios" ? "Georgia" : "serif" },
  googleText: { color: "#3c4043", fontWeight: "600", fontSize: 15 },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 18 },
  dividerLine: { flex: 1, height: 1, backgroundColor: BORDER_DARK },
  dividerText: { color: "#706050", fontSize: 12 },
  fieldLabel: { color: "#807060", fontSize: 11, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 },
  input: {
    height: 48, backgroundColor: DARK_INPUT, borderWidth: 1, borderColor: BORDER_DARK,
    borderRadius: 10, paddingHorizontal: 14, color: "#F0EDE4", fontSize: 15, marginBottom: 16,
  },
  errorText: { color: "#ff6b6b", fontSize: 13, marginBottom: 12, lineHeight: 18 },
  continueBtn: {
    borderRadius: 10, marginBottom: 8,
    ...Platform.select({
      ios: { shadowColor: "#7a5000", shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.9, shadowRadius: 0 },
      android: { elevation: 4 },
    }),
  },
  continueBtnDisabled: { opacity: 0.5 },
  continueBtnGradient: { height: 50, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  continueBtnShadowBar: {
    position: "absolute", bottom: -5, left: 4, right: 4, height: 8,
    borderBottomLeftRadius: 10, borderBottomRightRadius: 10,
    backgroundColor: "rgba(100,65,5,0.88)", zIndex: -1,
  },
  continueBtnText: { color: "#0a0800", fontWeight: "800", fontSize: 16, letterSpacing: 0.3 },
  footer: {
    flexDirection: "row", justifyContent: "center", alignItems: "center",
    backgroundColor: "#0e0e16", borderTopWidth: 1, borderTopColor: "#1e1e28",
    paddingVertical: 16, paddingHorizontal: 24,
  },
  footerText: { color: "#706050", fontSize: 13 },
  footerLink: { color: GOLD, fontSize: 13, fontWeight: "700" },
  tagline: { marginTop: 24, color: "rgba(212,175,55,0.30)", fontSize: 11, letterSpacing: 0.5, textAlign: "center" },
});
