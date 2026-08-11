# WebAuthn Passkey Demo

- This is a simple demo of WebAuthn passkey registration and login using Node.js, Express, and TypeScript. It demonstrates how to register a passkey (public key credential) and authenticate using it.

### Registering a passkey

- Registering a passkey and logging in with it involves using the WebAuthn API in the browser. Below are the client-side JavaScript functions for registering and logging in with a passkey.

```js
async function registerPasskey() {
  // Base64URL encoding helper
  const bufferToBase64URL = (buffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary)
      .replace(/\+/g, "-")
      .replace(/\//g, "\_")
      .replace(/=/g, "");
  };

  // Base64URL to ArrayBuffer helper (for challenge)
  const base64URLToBuffer = (base64url) => {
    const padding = "=".repeat((4 - (base64url.length % 4)) % 4);
    const base64 = (base64url + padding).replace(/-/g, "+").replace(/\_/g, "/");
    const rawData = atob(base64);
    return Uint8Array.from(rawData, (c) => c.charCodeAt(0));
  };

  // A. Fetch options
  const optsRes = await fetch("/api/register-options");
  const options = await optsRes.json();
  console.log("1. Server Options Received:", options);

  // B. Convert binary fields
  options.challenge = base64URLToBuffer(options.challenge);
  options.user.id = new TextEncoder().encode(options.user.id);

  // C. Invoke browser API
  console.log("2. Triggering native navigator.credentials.create()...");
  const credential = await navigator.credentials.create({ publicKey: options });
  console.log("3. Raw Credential Object:", credential);

  // D. Format payload using Base64URL (Fixes the error)
  const payload = {
    id: credential.id, // credential.id is already base64url encoded by the browser
    rawId: bufferToBase64URL(credential.rawId),
    type: credential.type,
    response: {
      attestationObject: bufferToBase64URL(
        credential.response.attestationObject,
      ),
      clientDataJSON: bufferToBase64URL(credential.response.clientDataJSON),
    },
  };

  // E. Send to backend
  const verifyRes = await fetch("/api/register-verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  console.log("4. Server Verification:", await verifyRes.json());
}

// Run it!
registerPasskey();
```

### Logging in with a passkey

- Logging in with a passkey involves fetching the login options from the server, invoking the WebAuthn API to get an assertion, and then sending that assertion back to the server for verification.

```js
async function loginWithPasskey() {
  // Base64URL encoding helper
  const bufferToBase64URL = (buffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
  };

  // Base64URL to ArrayBuffer helper
  const base64URLToBuffer = (base64url) => {
    const padding = "=".repeat((4 - (base64url.length % 4)) % 4);
    const base64 = (base64url + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = atob(base64);
    return Uint8Array.from(rawData, (c) => c.charCodeAt(0));
  };

  // A. Fetch options from server
  const optsRes = await fetch("/api/login-options");
  const options = await optsRes.json();
  console.log("1. Server Challenge Received:", options);

  // B. Convert binary fields
  options.challenge = base64URLToBuffer(options.challenge);
  options.allowCredentials = options.allowCredentials.map((c) => ({
    ...c,
    id: base64URLToBuffer(c.id),
  }));

  // C. Invoke browser API
  console.log("2. Triggering native navigator.credentials.get()...");
  const assertion = await navigator.credentials.get({ publicKey: options });
  console.log("3. Signed Assertion Result:", assertion);

  // D. Format assertion payload using Base64URL
  const payload = {
    id: assertion.id, // credential.id is already base64url encoded by the browser
    rawId: bufferToBase64URL(assertion.rawId),
    type: assertion.type,
    response: {
      authenticatorData: bufferToBase64URL(
        assertion.response.authenticatorData,
      ),
      clientDataJSON: bufferToBase64URL(assertion.response.clientDataJSON),
      signature: bufferToBase64URL(assertion.response.signature),
      userHandle: assertion.response.userHandle
        ? bufferToBase64URL(assertion.response.userHandle)
        : null,
    },
  };

  // E. Verify on backend
  const verifyRes = await fetch("/api/login-verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  console.log("4. Login Verification Result:", await verifyRes.json());
}

// Run it!
loginWithPasskey();
```
