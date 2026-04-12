"use client";

import { useEffect, useState } from "react";

import { formatCurrency } from "@/lib/money";

type ClientItem = {
  id: number;
  name: string;
  contact: string | null;
  monthlyFee: number;
  dueDay: number;
  active: boolean;
  received: boolean;
};

type ExpenseItem = {
  id: number;
  name: string;
  category: string | null;
  amount: number;
  dueDay: number;
  active: boolean;
  paid: boolean;
};

type ServerAction = (formData: FormData) => void | Promise<void>;

type FinanceBoardProps = {
  clients: ClientItem[];
  expenses: ExpenseItem[];
  competence: string;
  createClientAction: ServerAction;
  createExpenseAction: ServerAction;
  deleteClientAction: ServerAction;
  deleteExpenseAction: ServerAction;
  updateClientAction: ServerAction;
  updateExpenseAction: ServerAction;
  toggleClientPaymentAction: ServerAction;
  toggleExpenseSettlementAction: ServerAction;
  toggleClientActiveAction: ServerAction;
  toggleExpenseActiveAction: ServerAction;
};

function SectionShell({
  title,
  subtitle,
  collapsed,
  onToggle,
  children,
  fixedHeight = false,
  hideToggle = false,
  equalHeight = false,
}: {
  title: string;
  subtitle: string;
  collapsed: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  fixedHeight?: boolean;
  hideToggle?: boolean;
  equalHeight?: boolean;
}) {
  return (
    <section
      className={`glass-card rounded-[32px] p-6 ${
        fixedHeight ? "flex h-[42rem] flex-col" : ""
      } ${equalHeight ? "min-h-[7rem]" : ""}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-[var(--muted)]">{subtitle}</p>
          <h2 className="section-title mt-2 text-3xl">{title}</h2>
        </div>
        {!hideToggle ? (
          <button
            className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-bold text-black"
            onClick={(event) => {
              event.preventDefault();
              onToggle();
            }}
            type="button"
          >
            {collapsed ? "Expandir" : "Colapsar"}
          </button>
        ) : null}
      </div>
      {!collapsed ? (
        <div className={fixedHeight ? "mt-5 flex-1 overflow-hidden" : "mt-5"}>{children}</div>
      ) : null}
    </section>
  );
}

function CollapsedActionButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className="w-full rounded-[28px] bg-[var(--accent)] px-6 py-5 text-left text-lg font-bold uppercase tracking-[0.18em] text-black"
      onClick={(event) => {
        event.preventDefault();
        onClick();
      }}
      type="button"
    >
      {label}
    </button>
  );
}

function moveItem<T extends { id: number }>(items: T[], draggedId: number, targetId: number) {
  if (draggedId === targetId) {
    return items;
  }

  const nextItems = [...items];
  const draggedIndex = nextItems.findIndex((item) => item.id === draggedId);
  const targetIndex = nextItems.findIndex((item) => item.id === targetId);

  if (draggedIndex < 0 || targetIndex < 0) {
    return items;
  }

  const [draggedItem] = nextItems.splice(draggedIndex, 1);
  nextItems.splice(targetIndex, 0, draggedItem);

  return nextItems;
}

async function persistOrder(type: "client" | "expense", ids: number[]) {
  const response = await fetch("/api/reorder", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ type, ids }),
  });

  if (!response.ok) {
    throw new Error("Nao foi possivel salvar a nova ordem.");
  }
}

export function FinanceBoard({
  clients,
  expenses,
  competence,
  createClientAction,
  createExpenseAction,
  deleteClientAction,
  deleteExpenseAction,
  updateClientAction,
  updateExpenseAction,
  toggleClientPaymentAction,
  toggleExpenseSettlementAction,
  toggleClientActiveAction,
  toggleExpenseActiveAction,
}: FinanceBoardProps) {
  const [clientItems, setClientItems] = useState(clients);
  const [expenseItems, setExpenseItems] = useState(expenses);
  const [draggedClientId, setDraggedClientId] = useState<number | null>(null);
  const [draggedExpenseId, setDraggedExpenseId] = useState<number | null>(null);
  const [clientFormCollapsed, setClientFormCollapsed] = useState(true);
  const [expenseFormCollapsed, setExpenseFormCollapsed] = useState(true);
  const [editingClientId, setEditingClientId] = useState<number | null>(null);
  const [editingExpenseId, setEditingExpenseId] = useState<number | null>(null);

  useEffect(() => {
    setClientItems(clients);
  }, [clients]);

  useEffect(() => {
    setExpenseItems(expenses);
  }, [expenses]);

  return (
    <section className="grid gap-6 xl:grid-cols-2">
      <div className="space-y-6">
        {clientFormCollapsed ? (
          <div className="min-h-[7rem]">
            <CollapsedActionButton
              label="Novo cliente"
              onClick={() => setClientFormCollapsed(false)}
            />
          </div>
        ) : (
          <SectionShell
            title="Cadastrar recebimento recorrente"
            subtitle="Novo cliente"
            collapsed={false}
            equalHeight
            onToggle={() => setClientFormCollapsed(true)}
          >
            <form action={createClientAction} className="grid gap-3">
              <input
                className="rounded-2xl border border-[var(--border)] bg-white/8 px-4 py-3"
                name="name"
                placeholder="Nome do cliente"
                required
              />
              <input
                className="rounded-2xl border border-[var(--border)] bg-white/8 px-4 py-3"
                name="contact"
                placeholder="Contato ou observacao"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  className="rounded-2xl border border-[var(--border)] bg-white/8 px-4 py-3"
                  name="monthlyFee"
                  placeholder="Valor mensal ex: 250,00"
                  required
                />
                <input
                  className="rounded-2xl border border-[var(--border)] bg-white/8 px-4 py-3"
                  min="1"
                  max="31"
                  name="dueDay"
                  placeholder="Dia do vencimento"
                  required
                  type="number"
                />
              </div>
              <button className="mt-2 rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-black">
                Salvar cliente
              </button>
            </form>
          </SectionShell>
        )}

        <SectionShell
          title="Checklist de recebimentos"
          subtitle="Clientes"
          collapsed={false}
          onToggle={() => {}}
          hideToggle
        >
          <div className="grid gap-4">
              {clientItems.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-[var(--border)] bg-white/6 p-6 text-sm text-[var(--muted)]">
                  Nenhum cliente cadastrado ainda.
                </div>
              ) : (
                clientItems.map((client) => (
                  <article
                    key={client.id}
                    className={`cursor-move rounded-[24px] border p-4 sm:p-5 ${
                      client.received
                        ? "border-[#294436] bg-[#102117]"
                        : "border-[var(--border)] bg-white/5"
                    } ${!client.active ? "opacity-55" : ""}`}
                    draggable
                    onDragOver={(event) => event.preventDefault()}
                    onDragStart={() => setDraggedClientId(client.id)}
                    onDrop={async () => {
                      if (draggedClientId === null) {
                        return;
                      }

                      const nextItems = moveItem(clientItems, draggedClientId, client.id);
                      setClientItems(nextItems);
                      setDraggedClientId(null);
                      await persistOrder(
                        "client",
                        nextItems.map((item) => item.id),
                      );
                    }}
                    onDragEnd={() => setDraggedClientId(null)}
                  >
                    <div className="mb-4 flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                      <span className="rounded-full bg-white/8 px-3 py-1 font-semibold">Arraste</span>
                      <span>para reorganizar</span>
                    </div>
                    <div className="flex min-h-[5rem] flex-col gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-xl font-semibold">{client.name}</h3>
                          <span className="rounded-full bg-white/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                            vence dia {client.dueDay}
                          </span>
                          {!client.active ? (
                            <span className="rounded-full bg-white/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                              inativo
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-2 text-sm text-[var(--muted)]">
                          {client.contact || "Sem contato informado"} - mensalidade {formatCurrency(client.monthlyFee)}
                        </p>
                      </div>
                      <div className="mt-auto flex flex-wrap items-end gap-2 border-t border-white/8 pt-4">
                        <form action={toggleClientPaymentAction}>
                          <input type="hidden" name="clientId" value={client.id} />
                          <input type="hidden" name="competence" value={competence} />
                          <button
                            className={`rounded-full px-4 py-2 text-sm font-semibold ${
                              client.received
                                ? "bg-[var(--success)] text-black"
                                : "bg-[var(--foreground)] text-black"
                            }`}
                          >
                            {client.received ? "Desmarcar" : "Marcar pago"}
                          </button>
                        </form>
                        <form action={toggleClientActiveAction}>
                          <input type="hidden" name="clientId" value={client.id} />
                          <button className="rounded-full border border-[var(--border)] bg-white/8 px-4 py-2 text-sm font-semibold">
                            {client.active ? "Desativar" : "Reativar"}
                          </button>
                        </form>
                        <form action={deleteClientAction}>
                          <input type="hidden" name="clientId" value={client.id} />
                          <input type="hidden" name="competence" value={competence} />
                          <button className="rounded-full border border-[#5f2a2a] bg-[#2a1111] px-4 py-2 text-sm font-semibold text-[#f5b5b5]">
                            X
                          </button>
                        </form>
                        <button
                          className="rounded-full border border-[var(--border)] bg-white/8 px-4 py-2 text-sm font-semibold"
                          onClick={() => setEditingClientId(client.id)}
                          type="button"
                        >
                          Editar
                        </button>
                      </div>
                      {editingClientId === client.id && (
                        <form action={updateClientAction} className="space-y-3 border-t border-white/8 pt-4">
                          <input type="hidden" name="clientId" value={client.id} />
                          <input
                            className="w-full rounded-2xl border border-[var(--border)] bg-white/8 px-4 py-2 text-sm"
                            name="name"
                            placeholder="Nome"
                            defaultValue={client.name}
                            required
                          />
                          <input
                            className="w-full rounded-2xl border border-[var(--border)] bg-white/8 px-4 py-2 text-sm"
                            name="contact"
                            placeholder="Contato ex: (11) 99999-9999"
                            defaultValue={client.contact || ""}
                          />
                          <input
                            className="w-full rounded-2xl border border-[var(--border)] bg-white/8 px-4 py-2 text-sm"
                            name="monthlyFee"
                            placeholder="Mensalidade ex: 2.000,00"
                            defaultValue={(client.monthlyFee / 100).toFixed(2).replace('.', ',')}
                            required
                          />
                          <input
                            className="w-full rounded-2xl border border-[var(--border)] bg-white/8 px-4 py-2 text-sm"
                            name="dueDay"
                            type="number"
                            min="1"
                            max="31"
                            placeholder="Dia do vencimento"
                            defaultValue={client.dueDay}
                            required
                          />
                          <div className="flex gap-2">
                            <button className="flex-1 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-black">
                              Salvar
                            </button>
                            <button
                              type="button"
                              className="flex-1 rounded-full border border-[var(--border)] bg-white/8 px-4 py-2 text-sm font-semibold"
                              onClick={() => setEditingClientId(null)}
                            >
                              Cancelar
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  </article>
                ))
              )}
            </div>
        </SectionShell>
      </div>

      <div className="space-y-6">
        {expenseFormCollapsed ? (
          <div className="min-h-[7rem]">
            <CollapsedActionButton
              label="Nova conta"
              onClick={() => setExpenseFormCollapsed(false)}
            />
          </div>
        ) : (
          <SectionShell
            title="Cadastrar despesa recorrente"
            subtitle="Nova conta"
            collapsed={false}
            equalHeight
            onToggle={() => setExpenseFormCollapsed(true)}
          >
            <form action={createExpenseAction} className="grid gap-3">
              <input
                className="rounded-2xl border border-[var(--border)] bg-white/8 px-4 py-3"
                name="name"
                placeholder="Descricao da conta"
                required
              />
              <input
                className="rounded-2xl border border-[var(--border)] bg-white/8 px-4 py-3"
                name="category"
                placeholder="Categoria ex: aluguel, internet"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  className="rounded-2xl border border-[var(--border)] bg-white/8 px-4 py-3"
                  name="amount"
                  placeholder="Valor mensal ex: 120,00"
                  required
                />
                <input
                  className="rounded-2xl border border-[var(--border)] bg-white/8 px-4 py-3"
                  min="1"
                  max="31"
                  name="dueDay"
                  placeholder="Dia do vencimento"
                  required
                  type="number"
                />
              </div>
              <button className="mt-2 rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-black">
                Salvar conta
              </button>
            </form>
          </SectionShell>
        )}

        <SectionShell
          title="Checklist de despesas"
          subtitle="Contas mensais"
          collapsed={false}
          onToggle={() => {}}
          hideToggle
        >
          <div className="grid gap-4">
              {expenseItems.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-[var(--border)] bg-white/6 p-5 text-sm text-[var(--muted)]">
                  Nenhuma conta cadastrada.
                </div>
              ) : (
                expenseItems.map((expense) => (
                  <article
                    key={expense.id}
                    className={`cursor-move rounded-[24px] border p-4 ${
                      expense.paid
                        ? "border-[#294436] bg-[#102117]"
                        : "border-[var(--border)] bg-white/5"
                    } ${!expense.active ? "opacity-55" : ""}`}
                    draggable
                    onDragOver={(event) => event.preventDefault()}
                    onDragStart={() => setDraggedExpenseId(expense.id)}
                    onDrop={async () => {
                      if (draggedExpenseId === null) {
                        return;
                      }

                      const nextItems = moveItem(expenseItems, draggedExpenseId, expense.id);
                      setExpenseItems(nextItems);
                      setDraggedExpenseId(null);
                      await persistOrder(
                        "expense",
                        nextItems.map((item) => item.id),
                      );
                    }}
                    onDragEnd={() => setDraggedExpenseId(null)}
                  >
                    <div className="mb-4 flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                      <span className="rounded-full bg-white/8 px-3 py-1 font-semibold">Arraste</span>
                      <span>para reorganizar</span>
                    </div>
                    <div className="flex min-h-[5rem] flex-col gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold">{expense.name}</h3>
                          <span className="rounded-full bg-white/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                            dia {expense.dueDay}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-[var(--muted)]">
                          {(expense.category || "Sem categoria")} - {formatCurrency(expense.amount)}
                        </p>
                      </div>
                      <div className="mt-auto flex flex-wrap items-end gap-2 border-t border-white/8 pt-4">
                        <form action={toggleExpenseSettlementAction}>
                          <input type="hidden" name="expenseId" value={expense.id} />
                          <input type="hidden" name="competence" value={competence} />
                          <button
                            className={`rounded-full px-4 py-2 text-sm font-semibold ${
                              expense.paid
                                ? "bg-[var(--success)] text-black"
                                : "bg-[var(--foreground)] text-black"
                            }`}
                          >
                            {expense.paid ? "Desmarcar" : "Marcar pago"}
                          </button>
                        </form>
                        <form action={toggleExpenseActiveAction}>
                          <input type="hidden" name="expenseId" value={expense.id} />
                          <button className="rounded-full border border-[var(--border)] bg-white/8 px-4 py-2 text-sm font-semibold">
                            {expense.active ? "Desativar" : "Reativar"}
                          </button>
                        </form>
                        <form action={deleteExpenseAction}>
                          <input type="hidden" name="expenseId" value={expense.id} />
                          <input type="hidden" name="competence" value={competence} />
                          <button className="rounded-full border border-[#5f2a2a] bg-[#2a1111] px-4 py-2 text-sm font-semibold text-[#f5b5b5]">
                            X
                          </button>
                        </form>
                        <button
                          className="rounded-full border border-[var(--border)] bg-white/8 px-4 py-2 text-sm font-semibold"
                          onClick={() => setEditingExpenseId(expense.id)}
                          type="button"
                        >
                          Editar
                        </button>
                      </div>
                      {editingExpenseId === expense.id && (
                        <form action={updateExpenseAction} className="space-y-3 border-t border-white/8 pt-4">
                          <input type="hidden" name="expenseId" value={expense.id} />
                          <input
                            className="w-full rounded-2xl border border-[var(--border)] bg-white/8 px-4 py-2 text-sm"
                            name="name"
                            placeholder="Nome da conta"
                            defaultValue={expense.name}
                            required
                          />
                          <input
                            className="w-full rounded-2xl border border-[var(--border)] bg-white/8 px-4 py-2 text-sm"
                            name="category"
                            placeholder="Categoria ex: aluguel, internet"
                            defaultValue={expense.category || ""}
                          />
                          <input
                            className="w-full rounded-2xl border border-[var(--border)] bg-white/8 px-4 py-2 text-sm"
                            name="amount"
                            placeholder="Valor mensal ex: 120,00"
                            defaultValue={(expense.amount / 100).toFixed(2).replace('.', ',')}
                            required
                          />
                          <input
                            className="w-full rounded-2xl border border-[var(--border)] bg-white/8 px-4 py-2 text-sm"
                            name="dueDay"
                            type="number"
                            min="1"
                            max="31"
                            placeholder="Dia do vencimento"
                            defaultValue={expense.dueDay}
                            required
                          />
                          <div className="flex gap-2">
                            <button className="flex-1 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-black">
                              Salvar
                            </button>
                            <button
                              type="button"
                              className="flex-1 rounded-full border border-[var(--border)] bg-white/8 px-4 py-2 text-sm font-semibold"
                              onClick={() => setEditingExpenseId(null)}
                            >
                              Cancelar
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  </article>
                ))
              )}
            </div>
        </SectionShell>
      </div>
    </section>
  );
}
