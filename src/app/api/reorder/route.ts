import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

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

  if (payload.type === "client") {
    await prisma.$transaction(
      payload.ids.map((id, index) =>
        prisma.client.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );
  } else {
    await prisma.$transaction(
      payload.ids.map((id, index) =>
        prisma.expense.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );
  }

  return NextResponse.json({ ok: true });
}
