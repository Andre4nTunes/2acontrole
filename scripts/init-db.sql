CREATE TABLE IF NOT EXISTS "Client" (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  contact TEXT,
  "monthlyFee" NUMERIC(12,2) NOT NULL,
  "dueDay" INTEGER NOT NULL,
  "sortOrder" INTEGER NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  "deletedAt" TIMESTAMPTZ,
  "archivedFromCompetence" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "ClientPayment" (
  id SERIAL PRIMARY KEY,
  "clientId" INTEGER NOT NULL REFERENCES "Client"(id) ON DELETE CASCADE,
  competence TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  note TEXT,
  "paidAt" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Expense" (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  amount NUMERIC(12,2) NOT NULL,
  "dueDay" INTEGER NOT NULL,
  "sortOrder" INTEGER NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  "deletedAt" TIMESTAMPTZ,
  "archivedFromCompetence" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "ExpenseSettlement" (
  id SERIAL PRIMARY KEY,
  "expenseId" INTEGER NOT NULL REFERENCES "Expense"(id) ON DELETE CASCADE,
  competence TEXT NOT NULL,
  note TEXT,
  "paidAt" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clientpayment_competence ON "ClientPayment"(competence);
CREATE INDEX IF NOT EXISTS idx_expensesettlement_competence ON "ExpenseSettlement"(competence);
