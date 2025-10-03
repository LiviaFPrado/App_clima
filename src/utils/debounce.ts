// debounce.ts
// Debounce padrão: atrasa a execução até "silenciar" por X ms (reduz chamadas à API).
// Referência conceitual MDN.  :contentReference[oaicite:7]{index=7}
export function debounce<T extends (...args: any[]) => void>(fn: T, delay = 400) {
  // 'timer' guarda o agendamento da chamada
  let timer: number | undefined;

  // Retornamos uma função que o input vai usar
  return (...args: Parameters<T>) => {
    // Cancela agendamento anterior, se existir
    if (timer) window.clearTimeout(timer);
    // Agenda nova execução
    timer = window.setTimeout(() => fn(...args), delay);
  };
}
