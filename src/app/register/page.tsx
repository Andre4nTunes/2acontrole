"use client";

import { useActionState } from "react";
import { register } from "@/app/actions";

export default function RegisterPage() {
  const [state, formAction] = useActionState(register, null);

  return (
    <main className="soft-grid flex min-h-screen items-center justify-center px-4 py-6">
      <div className="w-full max-w-md">
        <section className="glass-card rounded-[36px] px-6 py-8 sm:px-8 sm:py-10">
          <div className="space-y-2 text-center">
            <h1 className="section-title text-3xl font-extrabold text-[var(--accent)]">
              2AControle
            </h1>
            <p className="text-sm text-[var(--muted)]">Crie sua conta</p>
          </div>

          {state?.error && (
            <div className="mt-4 rounded-2xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
              {state.error}
            </div>
          )}

          {state?.warning && (
            <div className="mt-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 px-4 py-3 text-sm text-yellow-400">
              {state.warning}
            </div>
          )}

          <form action={formAction} className="mt-8 space-y-4">
            <div>
              <label htmlFor="username" className="text-sm font-semibold text-[var(--foreground)]">
                Usuário
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-white/8 px-4 py-3 text-[var(--foreground)] placeholder-[var(--muted)] transition-colors focus:border-[var(--accent)] focus:bg-white/12"
                placeholder="Escolha um usuário"
              />
            </div>

            <div>
              <label htmlFor="email" className="text-sm font-semibold text-[var(--foreground)]">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-white/8 px-4 py-3 text-[var(--foreground)] placeholder-[var(--muted)] transition-colors focus:border-[var(--accent)] focus:bg-white/12"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="text-sm font-semibold text-[var(--foreground)]">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-white/8 px-4 py-3 text-[var(--foreground)] placeholder-[var(--muted)] transition-colors focus:border-[var(--accent)] focus:bg-white/12"
                placeholder="Sua senha"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-full bg-[var(--accent)] px-6 py-3 font-semibold text-black transition-transform hover:scale-105"
            >
              Criar Conta
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-[var(--muted)]">
              Já tem conta?{" "}
              <a
                href="/login"
                className="font-semibold text-[var(--accent)] underline transition-colors hover:text-[var(--foreground)]"
              >
                Faça login
              </a>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
