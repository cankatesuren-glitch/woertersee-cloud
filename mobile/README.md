# WörterSee iOS

The native client is built with Expo and React Native. This first milestone adds
the Today screen, API boundary and encrypted session storage. Keycloak sign-in
and the native practice flow follow in separate pull requests.

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

The API and identity provider must also listen on the LAN and allow the mobile
redirect URI before sign-in can be enabled. Production builds will use HTTPS
endpoints and an EAS development build rather than local HTTP.
