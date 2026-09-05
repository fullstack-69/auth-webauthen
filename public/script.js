const { startRegistration } = SimpleWebAuthnBrowser;

let optionsJSONReg;
let attResp;
let verificationJSON;
let optionsJSONAuth;

async function getRegisterOptions() {
  try {
    // Fetch the registration options from the server
    const resp = await fetch("/api/register-options");
    optionsJSONReg = await resp.json();
    console.log({ optionsJSON: optionsJSONReg });
  } catch (error) {
    console.error(error);
  }
}

async function passOption() {
  try {
    // Pass the options to the authenticator and get the attestation response
    attResp = await startRegistration({ optionsJSON: optionsJSONReg });
    console.log({ attResp });
  } catch (error) {
    console.error(error);
  }
}

async function sendAttestationResponse() {
  try {
    // POST the response to the endpoint that calls
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

async function getAuthOptions() {
  try {
    // GET authentication options from the endpoint that calls
    const resp = await fetch("/generate-authentication-options");
    optionsJSONAuth = await resp.json();
    console.log({ optionsJSON: optionsJSONAuth });
  } catch (error) {
    console.error(error);
  }
}

const btnRegGet = document.getElementById("reg-get");
btnRegGet.addEventListener("click", getRegisterOptions);

const btnRegPass = document.getElementById("reg-pass");
btnRegPass.addEventListener("click", passOption);

const btnRegSend = document.getElementById("reg-send");
btnRegSend.addEventListener("click", sendAttestationResponse);

const btnAuthGet = document.getElementById("auth-get");
btnAuthGet.addEventListener("click", getAuthOptions);
