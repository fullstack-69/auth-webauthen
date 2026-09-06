const { startRegistration, startAuthentication } = SimpleWebAuthnBrowser;

let optionsJSONReg; // Registration options from the server
let attResp; // Attestation response from the authenticator
let verificationJSON; // Verification response from the server
let optionsJSONAuth; // Authentication options from the server
let asseResp; // Assertion response from the authenticator

// --- REGISTRATION FLOW ---

// GET registration options from the endpoint generateRegistrationOptions()
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
    attResp = await startRegistration({ optionsJSON: optionsJSONReg });
    console.log({ attResp });
    alert(
      "Registration response received from authenticator. Check console for details.",
    );
  } catch (error) {
    console.error(error);
  }
}

// POST registration response to the endpoint that calls verifyRegistrationResponse()
async function sendAttestationResponse() {
  try {
    const verificationResp = await fetch("/api/register-verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(attResp),
    });
    verificationJSON = await verificationResp.json();
    console.log({ verificationJSON });
    if (verificationJSON.status === "ok") {
      alert(
        "Registration verification response received from server. Check console for details.",
      );
    } else {
      throw new Error("Registration verification failed");
    }
  } catch (error) {
    console.error(error);
  }
}

// --- AUTHENTICATION FLOW ---

// GET authentication options from the endpoint that calls
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

// Pass authentication options to the authenticator and wait for a assertion response
async function passAuthOptionToAuthenticator() {
  try {
    asseResp = await startAuthentication({ optionsJSON: optionsJSONAuth });
    console.log({ asseResp });
    alert(
      "Authentication response received from authenticator. Check console for details.",
    );
  } catch (error) {
    console.error(error);
  }
}

// POST the response to the endpoint that calls
async function sendAssertionResponse() {
  try {
    const verificationResp = await fetch("/api/auth-verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(asseResp),
    });

    // Wait for the results of verification
    const verificationJSON = await verificationResp.json();
    console.log({ verificationJSON });
    if (verificationJSON.status === "ok") {
      alert(
        "Authentication verification response received from server. Check console for details.",
      );
    } else {
      throw new Error("Authentication verification failed");
    }
  } catch (error) {
    console.error(error);
    alert("Authentication verification failed. Check console for details.");
  }
}
