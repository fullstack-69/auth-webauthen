import { dbClient } from "@db/client.js";
import { credentialsTable, usersTable } from "@db/schema.js";
import { type WebAuthnCredential } from "@simplewebauthn/server";
import { eq, like } from "drizzle-orm";

export async function getUserByEmail(email: string) {
  // Simulate a database query to retrieve user by email
  const user = await dbClient.query.usersTable.findFirst({
    where: eq(usersTable.email, email),
    with: {
      credentials: true,
    },
  });
  return user;
}

export async function updateCurrentChallenge(
  userId: string,
  challenge: string,
) {
  await dbClient
    .update(usersTable)
    .set({ currentChallenge: challenge })
    .where(eq(usersTable.id, userId));
}

export async function saveCredential(
  userId: string,
  credential: WebAuthnCredential,
) {
  await dbClient.insert(credentialsTable).values({
    id: credential.id,
    publicKey: credential.publicKey,
    transports: credential.transports,
    counter: credential.counter,
    userId,
  });
}

export async function getCredentials(userId: string) {
  const res = dbClient
    .select()
    .from(credentialsTable)
    .where(eq(credentialsTable.userId, userId));

  return res || [];
}
