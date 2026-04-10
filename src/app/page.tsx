import {
  createClient,
  createExpense,
  deleteClient,
  deleteExpense,
  toggleClientActive,
  toggleClientPayment,
  toggleExpenseActive,
  toggleExpenseSettlement,
} from "@/app/actions";
import {
  getCompetenceLabel,
  parseCompetence,
  shiftCompetence,
} from "@/lib/competence";
import { FinanceBoard } from "@/components/finance-board";
import { getDashboardData } from "@/lib/dashboard";
import { formatCurrency } from "@/lib/money";

type HomeProps = {
  searchParams?: Promise<{
    month?: string | string[];
  }>;
};

type LoadDashboardResult =
  | {
      ok: true;
      data: Awaited<ReturnType<typeof getDashboardData>>;
    }
  | {
      ok: false;
      message: string;
    };

function StatCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <article className="glass-card rounded-[28px] p-5">
      <p className="text-sm uppercase tracking-[0.24em] text-[var(--muted)]">{title}</p>
      <strong className="section-title mt-4 block text-3xl sm:text-4xl">{value}</strong>
      <p className="mt-3 text-sm text-[var(--muted)]">{description}</p>
    </article>
  );
}

async function loadDashboardData(competence: string): Promise<LoadDashboardResult> {
  try {
    const data = await getDashboardData(competence);
    return { ok: true, data };
  } catch (error) {
    console.error("Failed to load dashboard data", error);

    return {
      ok: false,
      message:
        "Nao foi possivel carregar os dados do painel. Verifique a variavel DATABASE_URL no deploy e a conectividade com o banco PostgreSQL do Supabase.",
    };
  }
}

export default async function Home({ searchParams }: HomeProps) {
  const params = (await searchParams) ?? {};
  const competence = parseCompetence(params.month);
  const previousCompetence = shiftCompetence(competence, -1);
  const nextCompetence = shiftCompetence(competence, 1);
  const dashboardResult = await loadDashboardData(competence);

  if (!dashboardResult.ok) {
    return (
      <main className="soft-grid min-h-screen px-4 py-6 sm:px-6 lg:px-10">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
          <section className="glass-card rounded-[36px] px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
            <div className="inline-flex rounded-full border border-[var(--border)] bg-white/8 px-4 py-2 text-xs font-medium uppercase tracking-[0.28em] text-[var(--muted)]">
              Falha na conexao com o banco
            </div>
            <h1 className="section-title mt-5 text-4xl font-extrabold leading-none text-[var(--accent)] sm:text-5xl">
              2AControle
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--muted)] sm:text-lg">
              {dashboardResult.message}
            </p>
            <div className="mt-6 rounded-[28px] border border-[var(--border)] bg-[var(--card-strong)] p-6">
              <p className="text-sm uppercase tracking-[0.24em] text-[var(--muted)]">
                Competencia solicitada
              </p>
              <strong className="section-title mt-3 block text-3xl capitalize">
                {getCompetenceLabel(competence)}
              </strong>
              <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
                Configure no ambiente de producao a string de conexao do Supabase em
                {" "}
                <code>DATABASE_URL</code>
                {" "}
                e refaca o deploy.
              </p>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const { data } = dashboardResult;

  return (
    <main className="soft-grid min-h-screen px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="glass-card overflow-hidden rounded-[36px]">
          <div className="grid gap-10 px-6 py-8 sm:px-8 lg:grid-cols-[1.5fr_0.8fr] lg:px-10 lg:py-10">
            <div className="space-y-5">
              <div className="inline-flex rounded-full border border-[var(--border)] bg-white/8 px-4 py-2 text-xs font-medium uppercase tracking-[0.28em] text-[var(--muted)]">
                Operacao mensal
              </div>
              <div className="space-y-4">
                <h1 className="section-title max-w-3xl text-4xl font-extrabold leading-none text-[var(--accent)] sm:text-5xl lg:text-6xl">
                  2AControle
                </h1>
                <p className="max-w-2xl text-base leading-7 text-[var(--muted)] sm:text-lg">
                  Cadastre clientes, marque recebimentos do mes, acompanhe contas fixas e veja o saldo esperado sem depender de planilha.
                </p>
              </div>
            </div>
            <div className="rounded-[28px] border border-[var(--border)] bg-[var(--card-strong)] p-6">
              <p className="text-sm uppercase tracking-[0.24em] text-[var(--muted)]">
                Competencia selecionada
              </p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <a
                  className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold"
                  href={`/?month=${previousCompetence}`}
                >
                  Mes anterior
                </a>
                <div className="text-center">
                  <strong className="section-title block text-3xl capitalize">
                    {getCompetenceLabel(competence)}
                  </strong>
                  <span className="mt-1 block text-sm text-[var(--muted)]">
                    Visao consolidada do periodo
                  </span>
                </div>
                <a
                  className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold"
                  href={`/?month=${nextCompetence}`}
                >
                  Proximo mes
                </a>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3 text-sm text-[var(--muted)]">
                <div className="rounded-2xl bg-white/6 p-4">
                  <span className="block">Clientes ativos</span>
                  <strong className="mt-2 block text-2xl text-[var(--foreground)]">
                    {data.clients.filter((client) => client.active).length}
                  </strong>
                </div>
                <div className="rounded-2xl bg-white/6 p-4">
                  <span className="block">Contas ativas</span>
                  <strong className="mt-2 block text-2xl text-[var(--foreground)]">
                    {data.expenses.filter((expense) => expense.active).length}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Recebido"
            value={formatCurrency(data.summary.totalReceived)}
            description={`${data.clients.filter((client) => client.received).length} clientes marcados como pagos`}
          />
          <StatCard
            title="A receber"
            value={formatCurrency(data.summary.totalPendingReceive)}
            description={`Meta mensal de ${formatCurrency(data.summary.totalToReceive)}`}
          />
          <StatCard
            title="Pago"
            value={formatCurrency(data.summary.totalPaid)}
            description={`${data.expenses.filter((expense) => expense.paid).length} contas quitadas`}
          />
          <StatCard
            title="Saldo"
            value={formatCurrency(data.summary.currentBalance)}
            description={`Saldo projetado: ${formatCurrency(data.summary.projectedBalance)}`}
          />
        </section>

        <FinanceBoard
          clients={data.clients}
          competence={competence}
          createClientAction={createClient}
          createExpenseAction={createExpense}
          deleteClientAction={deleteClient}
          deleteExpenseAction={deleteExpense}
          expenses={data.expenses}
          toggleClientActiveAction={toggleClientActive}
          toggleClientPaymentAction={toggleClientPayment}
          toggleExpenseActiveAction={toggleExpenseActive}
          toggleExpenseSettlementAction={toggleExpenseSettlement}
        />
      </div>
    </main>
  );
}
