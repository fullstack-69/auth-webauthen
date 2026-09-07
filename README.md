# WebAuthn Passkey Test

This project is a full-stack WebAuthn passkey authentication demo. It uses an Express and TypeScript backend with Drizzle ORM and SQLite to store users and passkey credentials, while the browser client uses SimpleWebAuthn to register and authenticate users without passwords.

# Get started

- `pnpm i`
- `pnpm run db:reset`
- `pnpm run dev`

# Note

### Environment Variables

Create a `.env` file in the project root with the following values:

```env
CURRENT_USER_EMAIL=user@example.com
PORT=3000
RP_NAME=WebAuthn Passkey Demo
RP_ID=localhost
ORIGIN=http://localhost:3000
```

- `CURRENT_USER_EMAIL`: Email of the seeded user used by the demo.
- `PORT`: Local HTTP port for the Express server.
- `RP_NAME`: Human-readable relying-party name shown by the authenticator.
- `RP_ID`: WebAuthn relying-party ID, usually `localhost` during local development.
- `ORIGIN`: Full browser origin used when verifying WebAuthn responses.

### File Structure

```text
src/
	index.ts             Express server and WebAuthn API routes
	utils/env.ts         Required environment variable validation
db/
	client.ts            SQLite and Drizzle client
	repositories.ts      User and credential database operations
	schema.ts            Users and credentials table definitions
	seed.ts              Initial demo user data
	migration/           Drizzle migration files
views/                  Pug pages and reusable components
public/                 Browser JavaScript, CSS, icons, and static assets
drizzle.config.ts       Drizzle Kit configuration
nodemon.json            Development watcher configuration
```

### Generated Code and Database Files

- `pnpm run db:generate` reads `db/schema.ts` and generates SQL migrations in `db/migration/`.
- `pnpm run db:migrate` applies the migrations to `db.sqlite`.
- `pnpm run db:sync` generates migrations and applies them in one command.
- `pnpm run db:seed` inserts the demo user into the database.
- `pnpm run db:reset` removes the local database and migrations, regenerates them, migrates the database, and seeds the demo user.
- `pnpm run build` compiles TypeScript and writes the generated JavaScript to `dist/`.
- `db.sqlite` and `dist/` are generated locally and should not be edited as source files.

# Issues

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
