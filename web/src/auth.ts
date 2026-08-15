import NextAuth, { customFetch } from "next-auth";
import Keycloak from "next-auth/providers/keycloak";

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
    jwt({ token, account }) {
      if (account?.access_token) token.accessToken = account.access_token;
      return token;
    },
    session({ session, token }) {
      (session as typeof session & { accessToken?: string }).accessToken =
        token.accessToken as string | undefined;
      return session;
    },
  },
});
