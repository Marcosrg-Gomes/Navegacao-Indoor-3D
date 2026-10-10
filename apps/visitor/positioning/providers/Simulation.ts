export type SimulationTick = { type: "tick"; generation: number; elapsedMs: number; at: number };

export type SimulationScheduler = {
  now: () => number;
  wallTime: () => number;
  request: (callback: () => void) => number;
  cancel: (handle: number) => void;
};

const defaultScheduler: SimulationScheduler = {
  now: () => performance.now(),
  wallTime: () => Date.now(),
  request: (callback) => requestAnimationFrame(callback),
  cancel: (handle) => cancelAnimationFrame(handle),
};

/** Relógio sem posição própria: o redutor da sessão é o único consumidor dos ticks. */
export class SimulationClock {
  private handle: number | null = null;
  private epoch = 0;
  private running = false;
  private lastTime = 0;
  private observedAt = 0;
  private generation = 0;
  private minTickMs = 0;
  private listener: ((tick: SimulationTick) => void) | null = null;

  constructor(private scheduler: SimulationScheduler = defaultScheduler) {}

  /** Menos atualizações visuais quando o sistema solicita movimento reduzido. */
  setMinTickMs(value: number) {
    this.minTickMs = Math.max(0, value);
  }

  start(generation: number, listener: (tick: SimulationTick) => void) {
    this.stop();
    this.generation = generation;
    this.listener = listener;
    this.lastTime = this.scheduler.now();
    this.observedAt = Math.max(this.observedAt, this.scheduler.wallTime());
    this.running = true;
    const epoch = this.epoch;
    const frame = () => {
      if (!this.running || epoch !== this.epoch) return;
      this.handle = null;
      try { if (this.scheduler.now() - this.lastTime >= this.minTickMs) this.flush(); }
      catch (error) { this.stop(); throw error; }
      if (this.running && epoch === this.epoch) this.handle = this.scheduler.request(frame);
    };
    this.handle = this.scheduler.request(frame);
  }

  /** Chamar antes de pausa/velocidade para contabilizar a fração do último quadro. */
  flush() {
    if (!this.running || !this.listener) return;
    const now = this.scheduler.now();
    const elapsedMs = now - this.lastTime;
    if (!Number.isFinite(elapsedMs) || elapsedMs <= 0) return;
    this.lastTime = now;
    // Duração monotônica: uma correção do relógio civil não move o visitante para trás.
    this.observedAt = Math.max(this.observedAt + elapsedMs, this.scheduler.wallTime());
    this.listener({ type: "tick", generation: this.generation, elapsedMs, at: this.observedAt });
  }

  /** Pausa, perda de foco, encerramento e unmount cancelam também callbacks enfileirados. */
  stop() {
    this.running = false;
    this.epoch += 1;
    if (this.handle !== null) this.scheduler.cancel(this.handle);
    this.handle = null;
    this.listener = null;
  }
}
