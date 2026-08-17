import * as SecureStore from "expo-secure-store";

const accessTokenKey = "woertersee.access-token";

export function getAccessToken() {
  return SecureStore.getItemAsync(accessTokenKey);
}

export function saveAccessToken(accessToken: string) {
  return SecureStore.setItemAsync(accessTokenKey, accessToken, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export function clearAccessToken() {
  return SecureStore.deleteItemAsync(accessTokenKey);
}
