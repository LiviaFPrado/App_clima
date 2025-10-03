// geocoding.ts
// Integra o endpoint de geocoding da Open-Meteo para obter lat/lon a partir do nome.  :contentReference[oaicite:10]{index=10}

export interface CityHit {
  id: number;            // id interno da API
  name: string;          // nome da cidade
  country: string;       // país
  latitude: number;
  longitude: number;
}

const GEO_BASE = "https://geocoding-api.open-meteo.com/v1/search";

export async function searchCityByName(q: string): Promise<CityHit[]> {
  // Monta URL com parâmetros seguros (encode)
  const url = new URL(GEO_BASE);
  url.searchParams.set("name", q);
  url.searchParams.set("count", "5");       // devolve até 5 sugestões
  url.searchParams.set("language", "pt");   // nomes em PT quando possível
  url.searchParams.set("format", "json");

  const res = await fetch(url.toString(), { method: "GET" });
  if (!res.ok) throw new Error(`Falha no geocoding: ${res.status}`);
  const data = await res.json();

  // Normaliza resposta em uma lista simples
  const results: CityHit[] = (data?.results ?? []).map((r: any) => ({
    id: r.id,
    name: r.name,
    country: r.country,
    latitude: r.latitude,
    longitude: r.longitude,
  }));

  return results;
}
