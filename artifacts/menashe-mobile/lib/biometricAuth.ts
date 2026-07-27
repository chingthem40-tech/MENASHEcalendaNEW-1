import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const CREDS_KEY = "menashe_biometric_credentials";

export interface SavedCredentials {
  email: string;
  password: string;
}

export type BiometricType = "face" | "fingerprint" | "none";

export async function getBiometricType(): Promise<BiometricType> {
  if (Platform.OS === "web") return "none";
  try {
    const supported = await LocalAuthentication.hasHardwareAsync();
    if (!supported) return "none";
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!enrolled) return "none";
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) return "face";
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) return "fingerprint";
    return "none";
  } catch {
    return "none";
  }
}

export async function hasSavedCredentials(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  try {
    const raw = await SecureStore.getItemAsync(CREDS_KEY);
    return raw !== null;
  } catch {
    return false;
  }
}

export async function saveCredentials(email: string, password: string): Promise<void> {
  if (Platform.OS === "web") return;
  await SecureStore.setItemAsync(
    CREDS_KEY,
    JSON.stringify({ email, password }),
    { requireAuthentication: false }
  );
}

export async function loadCredentialsWithBiometric(): Promise<SavedCredentials | null> {
  if (Platform.OS === "web") return null;
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Sign in to Bnei Menashe Calendar",
      cancelLabel: "Use Password",
      disableDeviceFallback: false,
    });
    if (!result.success) return null;
    const raw = await SecureStore.getItemAsync(CREDS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedCredentials;
  } catch {
    return null;
  }
}

export async function clearSavedCredentials(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    await SecureStore.deleteItemAsync(CREDS_KEY);
  } catch {}
}
