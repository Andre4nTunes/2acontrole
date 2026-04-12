"use client";

import { logout } from "@/app/actions";

interface UserHeaderProps {
  username: string;
}

export function UserHeader({ username }: UserHeaderProps) {
  return (
    <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-900/50 to-transparent border-b border-yellow-500/20 glass-hard">
      <h1 className="text-2xl font-bold text-yellow-500">Controle Financeiro</h1>
      <div className="flex items-center gap-4">
        <span className="text-slate-300">Bem-vindo, <strong>{username}</strong></span>
        <form action={logout}>
          <button
            type="submit"
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Sair
          </button>
        </form>
      </div>
    </div>
  );
}
