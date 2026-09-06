import "dotenv/config";

import {
  deleteCurrentChallenge,
  getUserByEmail,
  saveCredential,
  updateCounter,
  updateCurrentChallenge,
} from "@db/repositories.js";
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import { isoUint8Array } from "@simplewebauthn/server/helpers";
import Debug from "debug";
import type { ErrorRequestHandler } from "express";
import express from "express";

import {
  CURRENT_USER_EMAIL,
  ORIGIN,
  PORT,
  RP_ID,
  RP_NAME,
} from "./utils/env.js";

const debug = Debug("fs-auth:index");
const app = express();
app.set("view engine", "pug");
app.use(express.json());
app.use(express.static("public"));

app.get("/", async (req, res) => {
  const user = await getUserByEmail(CURRENT_USER_EMAIL);
  res.render("pages/index", {
    title: "Home",
    user: user || null,
  });
});

// REGISTRATION ENDPOINTS ---
app.get("/api/register-options", async (req, res) => {
  const user = await getUserByEmail(CURRENT_USER_EMAIL);
  if (!user) {
    return res.status(404).json({ status: "error", message: "User not found" });
  }
  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: RP_ID,
    userID: isoUint8Array.fromUTF8String(user.id),
    userName: user.email,
    attestationType: "none",
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
    },
    excludeCredentials: user.credentials.map((c) => ({
      id: c.id,
      type: "public-key",
    })),
  });
  await updateCurrentChallenge(user.id, options.challenge);
  res.json(options);
});

app.post("/api/register-verify", async (req, res) => {
  const user = await getUserByEmail(CURRENT_USER_EMAIL);
  if (!user) {
    return res.status(404).json({ status: "error", message: "User not found" });
  }
  if (!user.currentChallenge) {
    return res
      .status(400)
      .json({ status: "error", message: "No challenge found for user" });
  }
  const verification = await verifyRegistrationResponse({
    response: req.body,
    expectedChallenge: user.currentChallenge,
    expectedOrigin: ORIGIN,
    expectedRPID: RP_ID,
  });

  // Destroy the challenge so it cannot be used again
  await deleteCurrentChallenge(user.id);

  if (verification.verified) {
    const { credential } = verification.registrationInfo;

    // Save explicit AuthenticatorDevice object
    await saveCredential(user.id, credential);

    return res.json({ status: "ok", message: "Passkey registered!" });
  }
  res.status(400).json({ status: "error" });
});

//  AUTHENTICATION ENDPOINTS ---
app.get("/api/auth-options", async (req, res) => {
  const user = await getUserByEmail(CURRENT_USER_EMAIL);
  if (!user) {
    return res.status(404).json({ status: "error", message: "User not found" });
  }
  if (user.credentials.length == 0) {
    return res
      .status(404)
      .json({ status: "error", message: "No credential found" });
  }
  const options = await generateAuthenticationOptions({
    rpID: RP_ID,
    allowCredentials: user.credentials.map((c) => ({
      id: c.id,
      type: "public-key",
    })),
  });

  await updateCurrentChallenge(user.id, options.challenge);
  res.json(options);
});

app.post("/api/auth-verify", async (req, res) => {
  const user = await getUserByEmail(CURRENT_USER_EMAIL);
  if (!user) {
    return res.status(404).json({ status: "error", message: "User not found" });
  }
  if (user.credentials.length == 0) {
    return res
      .status(404)
      .json({ status: "error", message: "No credential found" });
  }
  if (!user.currentChallenge) {
    return res
      .status(404)
      .json({ status: "error", message: "No challenge found" });
  }

  // Find matching credential by ID from request body
  const savedCredential = user.credentials.find((c) => c.id === req.body.id);
  if (!savedCredential) {
    return res
      .status(400)
      .json({ status: "error", message: "Credential not found" });
  }
  const verification = await verifyAuthenticationResponse({
    response: req.body,
    expectedChallenge: user.currentChallenge,
    expectedOrigin: ORIGIN,
    expectedRPID: RP_ID,
    credential: {
      id: savedCredential.id,
      // NOTE: This give TypeScript error due to mismatched types (Uint8Array vs Uint8ArrayLike).
      // publicKey: savedCredential.publicKey,
      publicKey: new Uint8Array(savedCredential.publicKey),
      counter: savedCredential.counter,
      transports: savedCredential.transports,
    },
    requireUserVerification: false,
  });

  // Destroy the challenge so it cannot be used again
  await deleteCurrentChallenge(user.id);

  if (!verification.verified) res.status(400).json({ status: "error" });

  // Update the stored counter to prevent replay attacks
  const result = await updateCounter(
    savedCredential.id,
    verification.authenticationInfo.newCounter,
  );
  if (result.rowsAffected === 0) {
    return res
      .status(404)
      .json({ status: "error", message: "Counter update failed." });
  }
  return res.json({ status: "ok", message: "Authentication successful!" });
});

// JSON Error Middleware
const jsonErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
  debug(err.message);
  const errorResponse = {
    message: err.message || "Internal Server Error",
    type: err.name || "Error",
    stack: err.stack,
  };
  res.status(500).send(errorResponse);
};
app.use(jsonErrorHandler);

app.listen(PORT, () => {
  debug(`Listening on port ${PORT}: http://localhost:${PORT}`);
});
