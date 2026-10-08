// Épica 17 (17.12) — lightweight in-process API metrics. A ring buffer of
// the most recent public API requests feeds /api/health with latency and
// error signals. Intentionally dependency-free; external observability
// (OTel/Sentry) remains a roadmap item (docs/ROADMAP.md).

interface ApiRequestSample {
  endpoint: string;
  durationMs: number;
  status: number;
  at: number;
}

const MAX_SAMPLES = 100;
const METRICS_KEY = "__admipyApiMetrics";

interface MetricsStore {
  samples: ApiRequestSample[];
  startedAt: number;
}

function store(): MetricsStore {
  const globalScope = globalThis as Record<string, unknown>;
  const existing = globalScope[METRICS_KEY] as MetricsStore | undefined;
  if (existing) return existing;

  const created: MetricsStore = { samples: [], startedAt: Date.now() };
  globalScope[METRICS_KEY] = created;
  return created;
}

export function recordApiRequest(endpoint: string, durationMs: number, status: number): void {
  const metrics = store();
  metrics.samples.push({ endpoint, durationMs, status, at: Date.now() });
  if (metrics.samples.length > MAX_SAMPLES) {
    metrics.samples.splice(0, metrics.samples.length - MAX_SAMPLES);
  }
}

export function getApiMetrics(): {
  totalSamples: number;
  errors: number;
  averageLatencyMs: number;
  maxLatencyMs: number;
  uptimeSeconds: number;
} {
  const metrics = store();
  const samples = metrics.samples;
  const recent = samples.slice(-50);

  return {
    totalSamples: samples.length,
    errors: recent.filter((sample) => sample.status >= 400).length,
    averageLatencyMs:
      recent.length > 0
        ? Math.round(recent.reduce((sum, sample) => sum + sample.durationMs, 0) / recent.length)
        : 0,
    maxLatencyMs: recent.length > 0 ? Math.max(...recent.map((sample) => sample.durationMs)) : 0,
    uptimeSeconds: Math.round((Date.now() - metrics.startedAt) / 1000),
  };
}
