# WebAuthn Passkey Test

- This is a simple demo of WebAuthn passkey registration and login using Node.js, Express, and TypeScript. It demonstrates how to register a passkey (public key credential) and authenticate using it.

# Note

## User Verification vs. User Presence Failure

- **Error:** `Error: User verification was required, but user could not be verified`
- **Root Cause:** SimpleWebAuthn enforces **User Verification (`uv`)** by default (requiring biometrics or PIN). If the student's hardware or browser setup only performed **User Presence (`up`)** (a simple key touch or click without PIN/biometrics), verification fails.
- **Fix Location:** Backend `server.js` options configuration.
- _Production Fix:_ Set `userVerification: 'required'` in registration options to force the device to prompt for biometrics/PIN.
- _Development Fix:_ Set `requireUserVerification: false` in backend verification functions.

- **Teaching Point:** Highlights the distinction between proving a human is physically at the device (**User Presence**) vs. verifying the actual authorized owner via biometrics or PIN (**User Verification**).

## Unmapped Credential Schema & Missing Sign Counter

- **Error:** `TypeError: Cannot read properties of undefined (reading 'counter')`
- **Root Cause:** Passing raw database objects directly into `verifyAuthenticationResponse` without mapping property names to match SimpleWebAuthn's expected `AuthenticatorDevice` interface (`credentialID`, `credentialPublicKey`, `counter`).
- **Fix Location:** Backend `server.js` `/api/login-verify` endpoint.
- Explicitly map stored credentials to the expected object shape.
- Update `savedCredential.counter` with `newCounter` after verification succeeds.

- **Teaching Point:** Demonstrates **Replay Attack Protection**. Every WebAuthn authenticator maintains an incrementing signature counter. If the server receives a counter value less than or equal to the stored value, it detects a cloned key or intercept-and-replay attempt.
