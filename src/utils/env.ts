import "dotenv/config";

const CURRENT_USER_EMAIL = process.env.CURRENT_USER_EMAIL || "";
if (!CURRENT_USER_EMAIL) {
  throw new Error("Missing CURRENT_USER_EMAIL");
}

const PORT = process.env.PORT || "";
if (!PORT) {
  throw new Error("Missing PORT");
}

const RP_NAME = process.env.RP_NAME || "";
if (!RP_NAME) {
  throw new Error("Missing RP_NAME");
}

const RP_ID = process.env.RP_ID || "";
if (!RP_ID) {
  throw new Error("Missing RP_ID");
}

const ORIGIN = process.env.ORIGIN || "";
if (!ORIGIN) {
  throw new Error("Missing ORIGIN");
}

export { CURRENT_USER_EMAIL, PORT, RP_NAME, RP_ID, ORIGIN };
