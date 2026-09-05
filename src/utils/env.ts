import "dotenv/config";

const CURRENT_USER_EMAIL = process.env.CURRENT_USER_EMAIL || "";
if (!CURRENT_USER_EMAIL) {
  throw new Error("Missing CURRENT_USER_EMAIL");
}
export { CURRENT_USER_EMAIL };
