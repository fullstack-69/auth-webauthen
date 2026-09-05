import "dotenv/config";

import { getUserByEmail } from "@db/repositories.js";
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type WebAuthnCredential,
} from "@simplewebauthn/server";
import { isoUint8Array } from "@simplewebauthn/server/helpers";
import Debug from "debug";
import express from "express";

import { CURRENT_USER_EMAIL } from "./utils/env.js";

const debug = Debug("fs-auth:index");
const app = express();
app.set("view engine", "pug");
app.use(express.json());
app.use(express.static("public"));

const RP_NAME = "WebAuthn Teaching Demo";
const RP_ID = "localhost";
const ORIGIN = "http://localhost:3000";

// In-memory "Database"
const db = {
  user: { id: "user_123", username: "student@example.com" },
  credentials: [] as WebAuthnCredential[], // Stores public keys
  currentChallenge: "",
};

app.get("/", async (req, res) => {
  const user = await getUserByEmail(CURRENT_USER_EMAIL);
  res.render("pages/index", {
    title: "Home",
    user: user || null,
  });
});

// --- 1. REGISTRATION ENDPOINTS ---
app.get("/api/register-options", async (req, res) => {
  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: RP_ID,
    userID: isoUint8Array.fromUTF8String(db.user.id),
    userName: db.user.username,
    attestationType: "none",
    authenticatorSelection: {
      userVerification: "required",
      residentKey: "required",
    },
  });

  db.currentChallenge = options.challenge;
  res.json(options);
});

app.post("/api/register-verify", async (req, res) => {
  const verification = await verifyRegistrationResponse({
    response: req.body,
    expectedChallenge: db.currentChallenge,
    expectedOrigin: ORIGIN,
    expectedRPID: RP_ID,
    requireUserVerification: false,
  });

  if (verification.verified) {
    const { credential } = verification.registrationInfo;

    // Save explicit AuthenticatorDevice object
    db.credentials.push({
      id: credential.id,
      publicKey: credential.publicKey,
      counter: credential.counter,
      transports: credential.transports,
    });

    return res.json({ status: "ok", message: "Passkey registered!" });
  }
  res.status(400).json({ status: "error" });
});

// --- 2. LOGIN ENDPOINTS ---
app.get("/api/login-options", async (req, res) => {
  const options = await generateAuthenticationOptions({
    rpID: RP_ID,
    allowCredentials: db.credentials.map((c) => ({
      id: c.id,
      type: "public-key",
    })),
  });

  db.currentChallenge = options.challenge;
  res.json(options);
});

app.post("/api/login-verify", async (req, res) => {
  // Find matching credential by ID from request body
  const savedCredential = db.credentials.find((c) => c.id === req.body.id);

  if (!savedCredential) {
    return res
      .status(400)
      .json({ status: "error", message: "Credential not found" });
  }

  const verification = await verifyAuthenticationResponse({
    response: req.body,
    expectedChallenge: db.currentChallenge,
    expectedOrigin: ORIGIN,
    expectedRPID: RP_ID,
    credential: {
      id: savedCredential.id,
      publicKey: savedCredential.publicKey,
      counter: savedCredential.counter,
      transports: savedCredential.transports,
    },
    requireUserVerification: false,
  });

  if (verification.verified) {
    // Update the stored counter to prevent replay attacks
    savedCredential.counter = verification.authenticationInfo.newCounter;
    return res.json({ status: "ok", message: "Authentication successful!" });
  }

  res.status(400).json({ status: "error" });
});

const PORT = 5001;
app.listen(PORT, () => {
  debug(`Listening on port ${PORT}: http://localhost:${PORT}`);
});
