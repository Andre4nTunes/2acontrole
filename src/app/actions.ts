"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { parseCurrencyInput } from "@/lib/money";
import { db } from "@/lib/db";
import { hashPassword, generateSessionToken, isPasswordBreached } from "@/lib/auth-utils";

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

export async function updateClient(formData: FormData) {
  const clientId = Number(formData.get("clientId"));
  const name = String(formData.get("name") ?? "").trim();
  const contact = String(formData.get("contact") ?? "").trim();
  const monthlyFee = parseCurrencyInput(formData.get("monthlyFee"));
  const dueDay = parseDay(formData.get("dueDay"));

  if (!name) {
    throw new Error("Informe o nome do cliente.");
  }

  await db.client.update({
    where: { id: clientId },
    data: {
      name,
      contact: contact || null,
      monthlyFee,
      dueDay,
    },
  });

  revalidatePath("/");
}

export async function updateExpense(formData: FormData) {
  const expenseId = Number(formData.get("expenseId"));
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const amount = parseCurrencyInput(formData.get("amount"));
  const dueDay = parseDay(formData.get("dueDay"));

  if (!name) {
    throw new Error("Informe a descricao da conta.");
  }

  await db.expense.update({
    where: { id: expenseId },
    data: {
      name,
      category: category || null,
      amount,
      dueDay,
    },
  });

  revalidatePath("/");
}

export async function register(prevState: any, formData: FormData) {
  const username = String(formData.get("username") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();

  if (!username) {
    return { error: "Informe o usuário." };
  }

  if (!email) {
    return { error: "Informe o email." };
  }

  if (!password || password.length < 6) {
    return { error: "A senha deve ter pelo menos 6 caracteres." };
  }

  // Check if password is breached
  const breached = await isPasswordBreached(password);
  if (breached) {
    return { warning: "Esta senha foi encontrada em vazamentos de dados. Recomendamos escolher uma senha mais segura." };
  }

  // Check if user already exists
  const existingUser = await db.user.findFirst({
    where: {
      username,
    },
  });

  if (existingUser) {
    return { error: "Este usuário já existe." };
  }

  const existingEmail = await db.user.findFirst({
    where: {
      email,
    },
  });

  if (existingEmail) {
    return { error: "Este email já foi registrado." };
  }

  const passwordHash = await hashPassword(password);

  await db.user.create({
    username,
    email,
    passwordHash,
  });

  redirect("/login");
}

export async function login(prevState: any, formData: FormData) {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();

  if (!username) {
    return { error: "Informe o usuário." };
  }

  if (!password) {
    return { error: "Informe a senha." };
  }

  const user = await db.user.findFirst({
    where: {
      username,
    },
  });

  if (!user) {
    return { error: "Usuário ou senha inválidos." };
  }

  const passwordHash = await hashPassword(password);

  if (user.passwordHash !== passwordHash) {
    return { error: "Usuário ou senha inválidos." };
  }

  // Create session
  const sessionToken = generateSessionToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  await db.session.create({
    token: sessionToken,
    userId: user.id,
    expiresAt,
  });

  // Set session cookie
  const cookieStore = await cookies();
  cookieStore.set("session", sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: "/",
  });

  redirect("/");
}

export async function logout() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session")?.value;

  if (sessionToken) {
    await db.session.deleteMany({
      where: { token: sessionToken },
    });
  }

  cookieStore.delete("session");
  redirect("/login");
}
