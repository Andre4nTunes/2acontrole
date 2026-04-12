import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import { UserHeader } from "@/components/user-header";

const montserrat = Montserrat({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Controle de Pagamentos",
  description: "Painel para acompanhar clientes, recebimentos e contas mensais.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <html
      lang="pt-BR"
      className={`${montserrat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
