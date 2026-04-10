const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatCurrency(valueInCents: number) {
  return currencyFormatter.format(valueInCents / 100);
}

export function parseCurrencyInput(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "")
    .trim()
    .replace(/\./g, "")
    .replace(",", ".");

  const parsed = Number(normalized);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("Informe um valor valido maior que zero.");
  }

  return Math.round(parsed * 100);
}
