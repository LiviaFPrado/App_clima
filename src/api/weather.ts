// weather.ts
// Integra a API de previsão da Open-Meteo. Sem API key.  :contentReference[oaicite:11]{index=11}

export interface WeatherNow {
  temperature: number;   // °C
  windspeed: number;     // km/h
  weathercode: number;   // código WMO p/ ícone
}

const WX_BASE = "https://api.open-meteo.com/v1/forecast";

// Converte número do weathercode em rótulo simples
export function codeToLabel(code: number): string {
  const map: Record<number, string> = {
    0: "Céu limpo",
    1: "Principalmente claro",
    2: "Parcialmente nublado",
    3: "Nublado",
    45: "Nevoeiro",
    48: "Nevoeiro depositante",
    51: "Garoa fraca",
    61: "Chuva fraca",
    71: "Neve fraca",
    80: "Pancadas fracas",
    95: "Trovoadas",
    // (adicione outros conforme necessário)
  };
  return map[code] ?? `Código ${code}`;
}

export async function getCurrentWeather(lat: number, lon: number): Promise<WeatherNow> {
  const url = new URL(WX_BASE);
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set("current_weather", "true"); // campo de tempo atual
  url.searchParams.set("timezone", "auto");        // ajusta ao fuso local

  const res = await fetch(url.toString(), { method: "GET" });
  if (!res.ok) throw new Error(`Falha na previsão: ${res.status}`);
  const data = await res.json();

  const cw = data?.current_weather;
  return {
    temperature: cw?.temperature,
    windspeed: cw?.windspeed,
    weathercode: cw?.weathercode,
  };
}
