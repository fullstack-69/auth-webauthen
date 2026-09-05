import { eq, like } from "drizzle-orm";
import { dbClient } from "@db/client.js";
import { usersTable, sessionsTable } from "@db/schema.js";

export async function getUserByEmail(email: string) {
  // Simulate a database query to retrieve user by email
  const user = await dbClient.query.usersTable.findFirst({
    where: eq(usersTable.email, email),
  });
  return user;
}
