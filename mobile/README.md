# WörterSee iOS

The native client is built with Expo and React Native. It includes the Today
screen, API boundary and Keycloak Authorization Code + PKCE sign-in. Tokens are
stored in the platform's encrypted credential storage.

## Run on an iPhone

Requirements: Node.js 20.19 or newer, the Expo Go app, and an iPhone on the same
Wi-Fi network as the development Mac.

```bash
cd mobile
cp .env.example .env.local
npm install
npm start
```

Open Expo Go on the iPhone and scan the QR code. Set `EXPO_PUBLIC_API_URL` and
`EXPO_PUBLIC_OIDC_ISSUER` to the Mac's LAN address, not `localhost`: on a physical
phone, `localhost` means the phone itself.

Start the local stack with the same public identity URL so the token issuer is
consistent across Keycloak, the API and the mobile client:

```bash
KEYCLOAK_PUBLIC_URL=http://192.168.1.10:8081 docker compose up -d --force-recreate keycloak api web
```

Replace the sample address everywhere with the Mac's current LAN address.

The API and identity provider must also listen on the LAN and allow the mobile
redirect URI before sign-in can be enabled. Production builds will use HTTPS
endpoints and an EAS development build rather than local HTTP.
