// WeatherCard.ts
// Card simples para exibir dados atuais de uma cidade (stateless).
import { type WeatherNow, codeToLabel } from "../api/weather";

interface Props {
  cityLabel: string;           // "São Paulo, Brasil"
  data: WeatherNow | null;     // null enquanto carrega
  error?: string;
  onRemove?: () => void;
}

export function WeatherCard({ cityLabel, data, error, onRemove }: Props): HTMLElement {
  // Cria elemento raiz
  const el = document.createElement("div");
  el.className = "card";

  // Header com botão remover
  const header = document.createElement("div");
  header.className = "card-header";
  header.innerHTML = `<strong>${cityLabel}</strong>`;
  if (onRemove) {
    const btn = document.createElement("button");
    btn.className = "remove";
    btn.textContent = "Remover";
    btn.onclick = onRemove;
    header.appendChild(btn);
  }
  el.appendChild(header);

  // Corpo (estado: erro, loading, dados)
  const body = document.createElement("div");
  body.className = "card-body";

  if (error) {
    body.textContent = error;
  } else if (!data) {
    body.textContent = "Carregando...";
  } else {
    body.innerHTML = `
      <div class="metric"><span>Temperatura:</span> <strong>${Math.round(data.temperature)}°C</strong></div>
      <div class="metric"><span>Vento:</span> <strong>${Math.round(data.windspeed)} km/h</strong></div>
      <div class="metric"><span>Condição:</span> <strong>${codeToLabel(data.weathercode)}</strong></div>
    `;
  }

  el.appendChild(body);
  return el;
}
