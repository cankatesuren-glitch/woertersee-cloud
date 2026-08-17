import * as SecureStore from "expo-secure-store";

const sessionKey = "woertersee.session";

export type StoredSession = {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
};

export async function getSession(): Promise<StoredSession | null> {
  const value = await SecureStore.getItemAsync(sessionKey);
  if (!value) return null;

  try {
    return JSON.parse(value) as StoredSession;
  } catch {
    await clearSession();
    return null;
  }
}

export function saveSession(session: StoredSession) {
  return SecureStore.setItemAsync(sessionKey, JSON.stringify(session), {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export function clearSession() {
  return SecureStore.deleteItemAsync(sessionKey);
}
