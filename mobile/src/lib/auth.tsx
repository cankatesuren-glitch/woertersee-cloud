import {
  exchangeCodeAsync,
  makeRedirectUri,
  refreshAsync,
  ResponseType,
  useAuthRequest,
  useAutoDiscovery,
} from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { createContext, type PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";

import { clearSession, getSession, saveSession, type StoredSession } from "./session";

WebBrowser.maybeCompleteAuthSession();

const issuer = process.env.EXPO_PUBLIC_OIDC_ISSUER;
const clientId = process.env.EXPO_PUBLIC_OIDC_CLIENT_ID ?? "woertersee-mobile";
const redirectUri = makeRedirectUri({ scheme: "woertersee", path: "oauth/callback" });

type AuthContextValue = {
  loading: boolean;
  signedIn: boolean;
  error?: string;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const discovery = useAutoDiscovery(issuer ?? "");
  const [session, setSession] = useState<StoredSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId,
      redirectUri,
      responseType: ResponseType.Code,
      scopes: ["openid", "profile", "email", "offline_access"],
      usePKCE: true,
    },
    discovery,
  );

  useEffect(() => {
    getSession().then(setSession).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (response?.type !== "success" || !discovery || !request?.codeVerifier) return;

    setLoading(true);
    setError(undefined);
    exchangeCodeAsync(
      {
        clientId,
        code: response.params.code,
        redirectUri,
        extraParams: { code_verifier: request.codeVerifier },
      },
      discovery,
    )
      .then(async (tokens) => {
        const nextSession = toStoredSession(tokens);
        await saveSession(nextSession);
        setSession(nextSession);
      })
      .catch(() => setError("Sign-in could not be completed."))
      .finally(() => setLoading(false));
  }, [discovery, request?.codeVerifier, response]);

  const value = useMemo<AuthContextValue>(
    () => ({
      loading,
      signedIn: session !== null,
      error,
      async signIn() {
        setError(undefined);
        if (!issuer) {
          setError("EXPO_PUBLIC_OIDC_ISSUER is not configured.");
          return;
        }
        if (!request || !discovery) return;
        await promptAsync();
      },
      async signOut() {
        await clearSession();
        setSession(null);
      },
      async getAccessToken() {
        if (!session) return null;
        if (Date.now() < session.expiresAt - 30_000) return session.accessToken;
        if (!session.refreshToken || !discovery) {
          await clearSession();
          setSession(null);
          return null;
        }

        try {
          const tokens = await refreshAsync(
            { clientId, refreshToken: session.refreshToken },
            discovery,
          );
          const nextSession = toStoredSession(tokens, session.refreshToken);
          await saveSession(nextSession);
          setSession(nextSession);
          return nextSession.accessToken;
        } catch {
          await clearSession();
          setSession(null);
          return null;
        }
      },
    }),
    [discovery, error, loading, promptAsync, request, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}

function toStoredSession(
  tokens: { accessToken: string; refreshToken?: string; expiresIn?: number; issuedAt?: number },
  fallbackRefreshToken?: string,
): StoredSession {
  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken ?? fallbackRefreshToken,
    expiresAt: ((tokens.issuedAt ?? Math.floor(Date.now() / 1000)) + (tokens.expiresIn ?? 300)) * 1000,
  };
}
