# WebAuthn Passkey Demo

- This is a simple demo of WebAuthn passkey registration and login using Node.js, Express, and TypeScript. It demonstrates how to register a passkey (public key credential) and authenticate using it.

### Registering a passkey

- Registering a passkey and logging in with it involves using the WebAuthn API in the browser. Below are the client-side JavaScript functions for registering and logging in with a passkey.

```js
const { startRegistration } = SimpleWebAuthnBrowser;

let optionsJSONReg; // Registration options from the server

// GET registration options from the endpoint
async function getRegisterOptions() {
  try {
    const resp = await fetch("/api/register-options");
    optionsJSONReg = await resp.json();
    alert(
      "Registration options received from server. Check console for details.",
    );
    console.log({ optionsJSON: optionsJSONReg });
  } catch (error) {
    console.error(error);
  }
}

// Pass registration options to the authenticator and wait for a response
async function passRegOptionToAuthenticator() {
  try {
    const attResp = await startRegistration({ optionsJSON: optionsJSONReg });
    console.log({ attResp });
    alert(
      "Registration response received from authenticator. Check console for details.",
    );

    // POST registration response to verify
    const verifyRes = await fetch("/api/register-verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(attResp),
    });
    const verification = await verifyRes.json();
    console.log("Server Verification:", verification);
  } catch (error) {
    console.error(error);
  }
}
```

### Logging in with a passkey

- Logging in with a passkey involves fetching the login options from the server, invoking the WebAuthn API to get an assertion, and then sending that assertion back to the server for verification.

```js
const { startAuthentication } = SimpleWebAuthnBrowser;

let optionsJSONAuth; // Authentication options from the server

// GET authentication options from the server
async function getAuthOptions() {
  try {
    const resp = await fetch("/api/auth-options");
    optionsJSONAuth = await resp.json();
    console.log({ optionsJSON: optionsJSONAuth });
    alert(
      "Authentication options received from server. Check console for details.",
    );
  } catch (error) {
    console.error(error);
  }
}

// Pass authentication options to the authenticator and wait for an assertion response
async function passAuthOptionToAuthenticator() {
  try {
    const asseResp = await startAuthentication({
      optionsJSON: optionsJSONAuth,
    });
    console.log({ asseResp });
    alert(
      "Authentication response received from authenticator. Check console for details.",
    );

    // POST the response to the backend for verification
    const verifyRes = await fetch("/api/auth-verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(asseResp),
    });

    // Wait for the results of verification
    const verification = await verifyRes.json();
    console.log("Login Verification Result:", verification);
  } catch (error) {
    console.error(error);
  }
}
```

#

# WebAuthn Implementation Pitfalls & Classroom Summary

## 1. Encoding Mismatch (`Base64` vs `Base64URL`)

- **Error:** `Error: Credential ID was not base64url-encoded`
- **Root Cause:** Standard browser JS `btoa()` produces standard Base64 (`+`, `/`, `=`), but the WebAuthn spec strictly requires **Base64URL** (`-`, `_`, no `=` padding).
- **Fix Location:** Frontend JavaScript buffer conversion helper.
- **Teaching Point:** WebAuthn binary parameters are designed to pass safely inside URLs, headers, and query parameters without URL-encoding Escapes, making **Base64URL** mandatory across the entire stack.

---

## 2. User Verification vs. User Presence Failure

- **Error:** `Error: User verification was required, but user could not be verified`
- **Root Cause:** SimpleWebAuthn enforces **User Verification (`uv`)** by default (requiring biometrics or PIN). If the student's hardware or browser setup only performed **User Presence (`up`)** (a simple key touch or click without PIN/biometrics), verification fails.
- **Fix Location:** Backend `server.js` options configuration.
- _Production Fix:_ Set `userVerification: 'required'` in registration options to force the device to prompt for biometrics/PIN.
- _Development Fix:_ Set `requireUserVerification: false` in backend verification functions.

- **Teaching Point:** Highlights the distinction between proving a human is physically at the device (**User Presence**) vs. verifying the actual authorized owner via biometrics or PIN (**User Verification**).

---

## 3. Unmapped Credential Schema & Missing Sign Counter

- **Error:** `TypeError: Cannot read properties of undefined (reading 'counter')`
- **Root Cause:** Passing raw database objects directly into `verifyAuthenticationResponse` without mapping property names to match SimpleWebAuthn's expected `AuthenticatorDevice` interface (`credentialID`, `credentialPublicKey`, `counter`).
- **Fix Location:** Backend `server.js` `/api/login-verify` endpoint.
- Explicitly map stored credentials to the expected object shape.
- Update `savedCredential.counter` with `newCounter` after verification succeeds.

- **Teaching Point:** Demonstrates **Replay Attack Protection**. Every WebAuthn authenticator maintains an incrementing signature counter. If the server receives a counter value less than or equal to the stored value, it detects a cloned key or intercept-and-replay attempt.
