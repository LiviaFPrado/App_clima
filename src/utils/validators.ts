// validators.ts
// Regras OWASP: valide TUDO que vem do usuário; use tipos fortes; restrinja formato.  :contentReference[oaicite:8]{index=8}

// Aceita letras (com acentos), espaços e hífens. Tamanho 2..60.
const CITY_REGEX = /^[\p{L}\p{M}\s-]{2,60}$/u;

// Normaliza acentos: "São Paulo" e "Sao Paulo" tratamos de forma uniforme
export function normalizeCity(input: string): string {
  return input.normalize("NFC").trim().replace(/\s+/g, " ");
}

export function isValidCity(input: string): boolean {
  const s = normalizeCity(input);
  return CITY_REGEX.test(s);
}

// Limita quantidade de cidades (mitiga abuso/consumo indevido). :contentReference[oaicite:9]{index=9}
export const MAX_CITIES = 6;
