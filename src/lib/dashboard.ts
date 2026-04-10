import { prisma } from "@/lib/prisma";

type ClientRecord = {
  id: number;
  name: string;
  contact: string | null;
  monthlyFee: number;
  dueDay: number;
  sortOrder: number;
  active: boolean;
  archivedFromCompetence: string | null;
};

type ClientPaymentRecord = {
  id: number;
  clientId: number;
  competence: string;
  amount: number;
  note: string | null;
  paidAt: Date;
};

type ExpenseRecord = {
  id: number;
  name: string;
  category: string | null;
  amount: number;
  dueDay: number;
  sortOrder: number;
  active: boolean;
  archivedFromCompetence: string | null;
};

type ExpenseSettlementRecord = {
  id: number;
  expenseId: number;
  competence: string;
  note: string | null;
  paidAt: Date;
};

type ClientWithPayment = ClientRecord & {
  payment: ClientPaymentRecord | undefined;
  received: boolean;
};

type ExpenseWithSettlement = ExpenseRecord & {
  settlement: ExpenseSettlementRecord | undefined;
  paid: boolean;
};

export type DashboardData = {
  clients: ClientWithPayment[];
  expenses: ExpenseWithSettlement[];
  summary: {
    totalToReceive: number;
    totalReceived: number;
    totalPendingReceive: number;
    totalToPay: number;
    totalPaid: number;
    totalPendingPay: number;
    projectedBalance: number;
    currentBalance: number;
  };
};

export async function getDashboardData(competence: string): Promise<DashboardData> {
  const [clients, expenses, clientPayments, expenseSettlements] = (await Promise.all([
    prisma.client.findMany({
      where: {
        OR: [
          { archivedFromCompetence: null },
          { archivedFromCompetence: { gt: competence } },
        ],
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.expense.findMany({
      where: {
        OR: [
          { archivedFromCompetence: null },
          { archivedFromCompetence: { gt: competence } },
        ],
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.clientPayment.findMany({
      where: { competence },
    }),
    prisma.expenseSettlement.findMany({
      where: { competence },
    }),
  ])) as [
    ClientRecord[],
    ExpenseRecord[],
    ClientPaymentRecord[],
    ExpenseSettlementRecord[],
  ];

  const clientPaymentById = new Map(clientPayments.map((payment) => [payment.clientId, payment]));
  const expenseSettlementById = new Map(
    expenseSettlements.map((settlement) => [settlement.expenseId, settlement]),
  );

  const clientChecklist = clients.map((client) => {
    const payment = clientPaymentById.get(client.id);
    return {
      ...client,
      payment,
      received: Boolean(payment),
    };
  });

  const expenseChecklist = expenses.map((expense) => {
    const settlement = expenseSettlementById.get(expense.id);
    return {
      ...expense,
      settlement,
      paid: Boolean(settlement),
    };
  });

  const totalToReceive = clientChecklist
    .filter((client) => client.active)
    .reduce((sum, client) => sum + client.monthlyFee, 0);
  const totalReceived = clientChecklist
    .filter((client) => client.received)
    .reduce((sum, client) => sum + client.monthlyFee, 0);
  const totalToPay = expenseChecklist
    .filter((expense) => expense.active)
    .reduce((sum, expense) => sum + expense.amount, 0);
  const totalPaid = expenseChecklist
    .filter((expense) => expense.paid)
    .reduce((sum, expense) => sum + expense.amount, 0);

  return {
    clients: clientChecklist,
    expenses: expenseChecklist,
    summary: {
      totalToReceive,
      totalReceived,
      totalPendingReceive: totalToReceive - totalReceived,
      totalToPay,
      totalPaid,
      totalPendingPay: totalToPay - totalPaid,
      projectedBalance: totalToReceive - totalToPay,
      currentBalance: totalReceived - totalPaid,
    },
  };
}
