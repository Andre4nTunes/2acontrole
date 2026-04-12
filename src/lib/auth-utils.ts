/**
 * Authentication utilities using Web Crypto API
 * Compatible with both Node.js and Edge Runtime
 */

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function isPasswordBreached(password: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-1", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    const prefix = hashHex.slice(0, 5).toUpperCase();
    const suffix = hashHex.slice(5).toUpperCase();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos timeout

    try {
      const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) return false;
      const text = await response.text();
      const lines = text.split('\n');
      for (const line of lines) {
        const [hashSuffix, count] = line.split(':');
        if (hashSuffix === suffix) {
          return parseInt(count) > 0;
        }
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      // Se a API falhar, deixar o usuário continuar (não bloquear por conta externa)
      return false;
    }
  } catch (error) {
    // Se tudo falhar, assumir que não está vazada
    return false;
  }
  return false;
}

export function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
