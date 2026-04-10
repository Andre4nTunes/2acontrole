import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

type Payload = {
  type?: "client" | "expense";
  ids?: number[];
};

export async function POST(request: Request) {
  const payload = (await request.json()) as Payload;

  if (!payload.type || !Array.isArray(payload.ids) || payload.ids.length === 0) {
    return NextResponse.json({ error: "Payload invalido." }, { status: 400 });
  }

  if (!payload.ids.every((id) => Number.isInteger(id))) {
    return NextResponse.json({ error: "Ids invalidos." }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    if (payload.type === "client") {
      for (let index = 0; index < payload.ids.length; index++) {
        const query = `UPDATE "Client" SET "sortOrder" = $1, "updatedAt" = NOW() WHERE id = $2`;
        await client.query(query, [index, payload.ids[index]]);
      }
    } else {
      for (let index = 0; index < payload.ids.length; index++) {
        const query = `UPDATE "Expense" SET "sortOrder" = $1, "updatedAt" = NOW() WHERE id = $2`;
        await client.query(query, [index, payload.ids[index]]);
      }
    }

    await client.query("COMMIT");
    return NextResponse.json({ ok: true });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
