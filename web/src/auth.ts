import NextAuth, { customFetch } from "next-auth";
import Keycloak from "next-auth/providers/keycloak";
import type { JWT } from "next-auth/jwt";

const keycloakIssuer = process.env.AUTH_KEYCLOAK_ISSUER!;
const keycloakInternalIssuer =
  process.env.AUTH_KEYCLOAK_INTERNAL_ISSUER ?? keycloakIssuer;

async function fetchKeycloak(input: RequestInfo | URL, init?: RequestInit) {
  const requestUrl = new URL(
    input instanceof Request ? input.url : input.toString(),
  );
  const publicIssuer = new URL(keycloakIssuer);

  if (requestUrl.origin === publicIssuer.origin) {
    const internalIssuer = new URL(keycloakInternalIssuer);
    requestUrl.protocol = internalIssuer.protocol;
    requestUrl.host = internalIssuer.host;
  }

  if (input instanceof Request) {
    return fetch(new Request(requestUrl, input), init);
  }

  return fetch(requestUrl, init);
}

type SessionToken = JWT & {
  accessToken?: string;
  accessTokenExpiresAt?: number;
  refreshToken?: string;
  error?: "RefreshAccessTokenError";
};

async function refreshAccessToken(token: SessionToken): Promise<SessionToken> {
  if (!token.refreshToken) {
    return { ...token, error: "RefreshAccessTokenError" };
  }

  const response = await fetchKeycloak(
    `${keycloakIssuer}/protocol/openid-connect/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.AUTH_KEYCLOAK_ID!,
        client_secret: process.env.AUTH_KEYCLOAK_SECRET!,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      }),
    },
  );

  if (!response.ok) {
    return { ...token, error: "RefreshAccessTokenError" };
  }

  const refreshed = (await response.json()) as {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
  };

  return {
    ...token,
    accessToken: refreshed.access_token,
    accessTokenExpiresAt: Date.now() + refreshed.expires_in * 1000,
    refreshToken: refreshed.refresh_token ?? token.refreshToken,
    error: undefined,
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  pages: { signIn: "/signin" },
  providers: [
    Keycloak({
      clientId: process.env.AUTH_KEYCLOAK_ID!,
      clientSecret: process.env.AUTH_KEYCLOAK_SECRET!,
      issuer: keycloakIssuer,
      [customFetch]: fetchKeycloak,
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      const sessionToken = token as SessionToken;

      if (account?.access_token) {
        sessionToken.accessToken = account.access_token;
        sessionToken.accessTokenExpiresAt = account.expires_at
          ? account.expires_at * 1000
          : Date.now();
        sessionToken.refreshToken = account.refresh_token;
        sessionToken.error = undefined;
        return sessionToken;
      }

      if (
        sessionToken.accessTokenExpiresAt &&
        Date.now() < sessionToken.accessTokenExpiresAt - 30_000
      ) {
        return sessionToken;
      }

      return refreshAccessToken(sessionToken);
    },
    session({ session, token }) {
      const sessionToken = token as SessionToken;
      const appSession = session as typeof session & {
        accessToken?: string;
        error?: "RefreshAccessTokenError";
      };
      appSession.accessToken = sessionToken.accessToken;
      appSession.error = sessionToken.error;
      return session;
    },
  },
});
