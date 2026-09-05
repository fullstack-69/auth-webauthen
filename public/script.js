const { startRegistration } = SimpleWebAuthnBrowser;

let optionsJSONReg;
let attResp;
let verificationJSON;
let optionsJSONAuth;

// GET registration options from the endpoint generateRegistrationOptions()
async function getRegisterOptions() {
  try {
    const resp = await fetch("/api/register-options");
    optionsJSONReg = await resp.json();
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
  } catch (error) {
    console.error(error);
  }
}

// GET authentication options from the endpoint that calls
async function getAuthOptions() {
  try {
    const resp = await fetch("/generate-authentication-options");
    optionsJSONAuth = await resp.json();
    console.log({ optionsJSON: optionsJSONAuth });
  } catch (error) {
    console.error(error);
  }
}

// Pass authentication options to the authenticator and wait for a response
async function passAuthOptionToAuthenticator() {
  try {
    asseResp = await startAuthentication({ optionsJSON: optionsJSONAuth });
  } catch (error) {
    console.error(error);
  }
}

// POST the response to the endpoint that calls
async function sendAssertionResponse() {
  try {
    const verificationResp = await fetch("/verify-authentication", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(asseResp),
    });

    // Wait for the results of verification
    const verificationJSON = await verificationResp.json();
    console.log({ verificationJSON });
  } catch (error) {
    console.error(error);
  }
}
