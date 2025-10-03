import "./styles.css";
import { debounce } from "./utils/debounce";
import { isValidCity, normalizeCity, MAX_CITIES } from "./utils/validators";
import { searchCityByName } from "./api/geocoding";
import { getCurrentWeather, WeatherNow } from "./api/weather";
import { WeatherCard } from "./components/WeatherCard";
import type { City } from "./types";

// Estado simples do app
const state = {
  // cidades selecionadas (map por chave única)
  cities: new Map<string, City>(),
  // cache de clima (evita refetchs desnecessários)
  cache: new Map<string, WeatherNow>(),
};

// Limita concorrência de chamadas em lote (mitiga consumo).  :contentReference[oaicite:12]{index=12}
const CONCURRENCY = 3;

// Monta UI básica
const app = document.getElementById("app")!;
app.innerHTML = `
  <h1>Clima Seguro</h1>
  <p>Digite o nome da cidade e pressione Enter (ou selecione da lista).</p>
  <div class="search">
    <input id="city-input" placeholder="Ex.: Itatiba, São Paulo" autocomplete="off" />
    <ul id="suggestions"></ul>
  </div>
  <div class="chips" id="chips"></div>
  <div class="grid" id="grid"></div>
  <small class="hint">Máximo de ${MAX_CITIES} cidades selecionadas.</small>
`;

const cityInput = document.getElementById("city-input") as HTMLInputElement;
const suggestions = document.getElementById("suggestions") as HTMLUListElement;
const chips = document.getElementById("chips") as HTMLDivElement;
const grid = document.getElementById("grid") as HTMLDivElement;

// Renderiza cards de clima
function renderGrid() {
  grid.innerHTML = "";
  // Para cada cidade, cria um card e faz fetch (com cache)
  const tasks: Array<() => Promise<void>> = [];

  for (const [, city] of state.cities) {
    const key = city.key;
    // cria contêiner para este card
    const container = document.createElement("div");
    container.className = "grid-item";
    grid.appendChild(container);

    // estado inicial: carregando
    let card = WeatherCard({ cityLabel: `${city.name}, ${city.country}`, data: null });
    container.appendChild(card);

    // tarefa de busca com cache
    tasks.push(async () => {
      try {
        const cached = state.cache.get(key);
        const data = cached ?? await getCurrentWeather(city.lat, city.lon);
        state.cache.set(key, data);
        const fresh = WeatherCard({ cityLabel: `${city.name}, ${city.country}`, data });
        container.replaceChildren(fresh);
      } catch (e: any) {
        const error = WeatherCard({ cityLabel: `${city.name}, ${city.country}`, data: null, error: "Não foi possível obter o clima agora :(" });
        container.replaceChildren(error);
      }
    });
  }

  // executa as tasks com limite de concorrência
  runWithConcurrency(tasks, CONCURRENCY);
}

// Executor com concorrência limitada
async function runWithConcurrency(tasks: Array<() => Promise<void>>, limit: number) {
  let i = 0;
  const workers = new Array(Math.min(limit, tasks.length)).fill(0).map(async () => {
    while (i < tasks.length) {
      const current = i++;
      await tasks[current]();
    }
  });
  await Promise.all(workers);
}

// Render chips (cidades selecionadas)
function renderChips() {
  chips.innerHTML = "";
  for (const [, c] of state.cities) {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = `${c.name} (${c.country})`;
    const x = document.createElement("button");
    x.className = "x";
    x.textContent = "×";
    x.onclick = () => {
      state.cities.delete(c.key);
      renderChips();
      renderGrid();
    };
    chip.appendChild(x);
    chips.appendChild(chip);
  }
}

// Adiciona cidade ao estado (com limites)
function addCity(c: City) {
  if (state.cities.size >= MAX_CITIES) {
    alert(`Limite de ${MAX_CITIES} cidades atingido.`);
    return;
  }
  if (!state.cities.has(c.key)) {
    state.cities.set(c.key, c);
    renderChips();
    renderGrid();
  }
}

// Mostra sugestões (autocomplete simples)
function showSuggestions(list: City[]) {
  suggestions.innerHTML = "";
  for (const c of list) {
    const li = document.createElement("li");
    li.textContent = `${c.name} — ${c.country}`;
    li.onclick = () => {
      addCity(c);
      cityInput.value = "";
      suggestions.innerHTML = "";
    };
    suggestions.appendChild(li);
  }
}

// Busca geocoding com debounce
const debouncedSearch = debounce(async () => {
  const raw = cityInput.value;
  if (!raw) {
    suggestions.innerHTML = "";
    return;
  }
  if (!isValidCity(raw)) {
    suggestions.innerHTML = `<li class="warning">Use apenas letras, espaços e hífens (2–60 caracteres).</li>`;
    return;
  }
  const q = normalizeCity(raw);
  try {
    const hits = await searchCityByName(q);
    // Mapeia para nossos tipos
    const cities: City[] = hits.map(h => ({
      key: `${h.name}, ${h.country}`.toLowerCase(),
      name: h.name,
      country: h.country,
      lat: h.latitude,
      lon: h.longitude,
    }));
    showSuggestions(cities);
  } catch {
    suggestions.innerHTML = `<li class="warning">Erro ao buscar cidades.</li>`;
  }
}, 450);

// Eventos do input
cityInput.addEventListener("input", () => debouncedSearch());

cityInput.addEventListener("keydown", async (e) => {
  if (e.key === "Enter") {
    const raw = cityInput.value;
    if (!isValidCity(raw)) return;
    const q = normalizeCity(raw);
    try {
      const hits = await searchCityByName(q);
      if (hits[0]) {
        const h = hits[0];
        addCity({
          key: `${h.name}, ${h.country}`.toLowerCase(),
          name: h.name,
          country: h.country,
          lat: h.latitude,
          lon: h.longitude,
        });
        cityInput.value = "";
        suggestions.innerHTML = "";
      }
    } catch {
      // mensagem simples, sem vazar detalhes internos
      alert("Não foi possível adicionar a cidade agora.");
    }
  }
});
