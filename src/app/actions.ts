"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { parseCurrencyInput } from "@/lib/money";
import { db } from "@/lib/db";

function getCompetenceAndRedirectPath(formData: FormData) {
  const competence = String(formData.get("competence") ?? "");
  const search = competence ? `/?month=${competence}` : "/";

  return {
    competence,
    redirectPath: search,
  };
}

function parseDay(value: FormDataEntryValue | null) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 31) {
    throw new Error("Informe um dia de vencimento entre 1 e 31.");
  }

  return parsed;
}

export async function createClient(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const contact = String(formData.get("contact") ?? "").trim();
  const monthlyFee = parseCurrencyInput(formData.get("monthlyFee"));
  const dueDay = parseDay(formData.get("dueDay"));

  if (!name) {
    throw new Error("Informe o nome do cliente.");
  }

  const lastClient = await db.client.findFirst({
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  await db.client.create({
    name,
    contact: contact || null,
    monthlyFee,
    dueDay,
    sortOrder: (lastClient?.sortOrder ?? -1) + 1,
  });

  revalidatePath("/");
}

export async function createExpense(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const amount = parseCurrencyInput(formData.get("amount"));
  const dueDay = parseDay(formData.get("dueDay"));

  if (!name) {
    throw new Error("Informe a descricao da conta.");
  }

  const lastExpense = await db.expense.findFirst({
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  await db.expense.create({
    name,
    category: category || null,
    amount,
    dueDay,
    sortOrder: (lastExpense?.sortOrder ?? -1) + 1,
  });

  revalidatePath("/");
}

export async function toggleClientPayment(formData: FormData) {
  const clientId = Number(formData.get("clientId"));
  const { competence, redirectPath } = getCompetenceAndRedirectPath(formData);

  const existing = await db.clientPayment.findUnique({
    where: {
      clientId_competence: {
        clientId,
        competence,
      },
    },
  });

  if (existing) {
    await db.clientPayment.delete({
      where: { id: existing.id },
    });
  } else {
    const client = await db.client.findUniqueOrThrow({
      where: { id: clientId },
    });

    await db.clientPayment.create({
      clientId,
      competence,
      amount: client.monthlyFee,
    });
  }

  revalidatePath("/");
  redirect(redirectPath);
}

export async function toggleExpenseSettlement(formData: FormData) {
  const expenseId = Number(formData.get("expenseId"));
  const { competence, redirectPath } = getCompetenceAndRedirectPath(formData);

  const existing = await db.expenseSettlement.findUnique({
    where: {
      expenseId_competence: {
        expenseId,
        competence,
      },
    },
  });

  if (existing) {
    await db.expenseSettlement.delete({
      where: { id: existing.id },
    });
  } else {
    await db.expenseSettlement.create({
      expenseId,
      competence,
    });
  }

  revalidatePath("/");
  redirect(redirectPath);
}

export async function toggleClientActive(formData: FormData) {
  const clientId = Number(formData.get("clientId"));

  const client = await db.client.findUniqueOrThrow({
    where: { id: clientId },
  });

  await db.client.update({
    where: { id: clientId },
    data: { active: !client.active },
  });

  revalidatePath("/");
}

export async function toggleExpenseActive(formData: FormData) {
  const expenseId = Number(formData.get("expenseId"));

  const expense = await db.expense.findUniqueOrThrow({
    where: { id: expenseId },
  });

  await db.expense.update({
    where: { id: expenseId },
    data: { active: !expense.active },
  });

  revalidatePath("/");
}

export async function deleteClient(formData: FormData) {
  const clientId = Number(formData.get("clientId"));
  const competence = String(formData.get("competence") ?? "");

  await db.client.update({
    where: { id: clientId },
    data: {
      archivedFromCompetence: competence,
      active: false,
    },
  });

  revalidatePath("/");
}

export async function deleteExpense(formData: FormData) {
  const expenseId = Number(formData.get("expenseId"));
  const competence = String(formData.get("competence") ?? "");

  await db.expense.update({
    where: { id: expenseId },
    data: {
      archivedFromCompetence: competence,
      active: false,
    },
  });

  revalidatePath("/");
}
