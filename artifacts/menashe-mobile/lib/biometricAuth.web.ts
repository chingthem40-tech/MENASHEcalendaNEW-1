export interface SavedCredentials {
  email: string;
  password: string;
}

export type BiometricType = "face" | "fingerprint" | "none";

export async function getBiometricType(): Promise<BiometricType> {
  return "none";
}

export async function hasSavedCredentials(): Promise<boolean> {
  return false;
}

export async function saveCredentials(_email: string, _password: string): Promise<void> {}

export async function loadCredentialsWithBiometric(): Promise<SavedCredentials | null> {
  return null;
}

export async function clearSavedCredentials(): Promise<void> {}
