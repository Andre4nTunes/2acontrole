import { cookies } from "next/headers";
import { db } from "@/lib/db";

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session")?.value;

    if (!sessionToken) {
      return null;
    }

    const session = await db.session.findByToken(sessionToken);

    if (!session) {
      return null;
    }

    const user = await db.user.findByIdOrThrow(session.userId);
    return user;
  } catch (error) {
    return null;
  }
}
