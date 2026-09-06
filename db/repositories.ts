import { dbClient } from "@db/client.js";
import { credentialsTable, usersTable } from "@db/schema.js";
import { type WebAuthnCredential } from "@simplewebauthn/server";
import { eq, like } from "drizzle-orm";

export async function getUserByEmail(email: string) {
  // Relational `with` query would json_array() the blob "public_key" column,
  // which SQLite rejects ("JSON cannot hold BLOB values"), so fetch separately.
  const user = await dbClient.query.usersTable.findFirst({
    where: eq(usersTable.email, email),
  });
  if (!user) return user;

  const credentials = await dbClient
    .select()
    .from(credentialsTable)
    .where(eq(credentialsTable.userId, user.id));

  return { ...user, credentials };
}

export async function updateCurrentChallenge(
  userId: string,
  challenge: string,
) {
  const res = await dbClient
    .update(usersTable)
    .set({ currentChallenge: challenge })
    .where(eq(usersTable.id, userId));
  return res;
}

export async function deleteCurrentChallenge(userId: string) {
  const res = await dbClient
    .update(usersTable)
    .set({ currentChallenge: null })
    .where(eq(usersTable.id, userId));
  return res;
}

export async function saveCredential(
  userId: string,
  credential: WebAuthnCredential,
) {
  const res = await dbClient.insert(credentialsTable).values({
    id: credential.id,
    publicKey: credential.publicKey,
    transports: credential.transports,
    counter: credential.counter,
    userId,
  });
  return res;
}

export async function updateCounter(id: string, newCounter: number) {
  const res = await dbClient
    .update(credentialsTable)
    .set({ counter: newCounter })
    .where(eq(credentialsTable.id, id));

  return res;
}
