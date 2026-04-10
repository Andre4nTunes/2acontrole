export function getCurrentCompetence() {
  return formatCompetence(new Date());
}

export function formatCompetence(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${date.getFullYear()}-${month}`;
}

export function getCompetenceLabel(competence: string) {
  const [year, month] = competence.split("-").map(Number);
  const date = new Date(year, month - 1, 1);

  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(date);
}

export function shiftCompetence(competence: string, offset: number) {
  const [year, month] = competence.split("-").map(Number);
  const date = new Date(year, month - 1 + offset, 1);
  return formatCompetence(date);
}

export function parseCompetence(input: string | string[] | undefined) {
  const value = Array.isArray(input) ? input[0] : input;

  if (value && /^\d{4}-\d{2}$/.test(value)) {
    return value;
  }

  return getCurrentCompetence();
}
