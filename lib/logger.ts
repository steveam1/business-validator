import { Langfuse } from "langfuse";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

// ── Langfuse client ────────────────────────────────────────────────────────────

let langfuse: Langfuse | null = null;

function isPlaceholder(value: string | undefined) {
  return !value || value.startsWith("your_");
}

function getLangfuseClient() {
  if (
    !langfuse &&
    !isPlaceholder(process.env.LANGFUSE_SECRET_KEY) &&
    !isPlaceholder(process.env.LANGFUSE_PUBLIC_KEY)
  ) {
    langfuse = new Langfuse({
      secretKey: process.env.LANGFUSE_SECRET_KEY!,
      publicKey: process.env.LANGFUSE_PUBLIC_KEY!,
      baseUrl: process.env.LANGFUSE_HOST ?? "https://cloud.langfuse.com",
    });
  }
  return langfuse;
}

// ── Types ──────────────────────────────────────────────────────────────────────

export interface TraceEvent {
  traceId: string;
  idea: string;
  toolsSelected: string[];
  toolResults: Record<string, string>;
  synthesis: Record<string, unknown>;
  totalLatencyMs: number;
  toolLatencies: Record<string, number>;
  success: boolean;
  error?: string;
}

// ── Langfuse trace logging ─────────────────────────────────────────────────────

export async function logTrace(event: TraceEvent) {
  const client = getLangfuseClient();
  if (!client) {
    console.log("[TRACE]", JSON.stringify(event, null, 2));
    return;
  }

  const trace = client.trace({
    id: event.traceId,
    name: "business-idea-validation",
    input: { idea: event.idea },
    output: event.synthesis,
    metadata: {
      toolsSelected: event.toolsSelected,
      totalLatencyMs: event.totalLatencyMs,
      success: event.success,
      error: event.error,
    },
  });

  trace.span({
    name: "orchestrator",
    input: { idea: event.idea },
    output: { toolsSelected: event.toolsSelected },
  });

  for (const [toolId, result] of Object.entries(event.toolResults)) {
    trace.span({
      name: `tool:${toolId}`,
      input: { idea: event.idea, tool: toolId },
      output: { result },
      metadata: { latencyMs: event.toolLatencies[toolId] },
    });
  }

  trace.span({
    name: "synthesizer",
    input: { toolResults: event.toolResults },
    output: event.synthesis,
  });

  await client.flushAsync();
}

// ── Metrics (file-backed, persists across restarts) ────────────────────────────

const METRICS_FILE = join(process.cwd(), "metrics.json");
const MAX_STORED = 100;

function loadMetrics(): TraceEvent[] {
  try {
    return JSON.parse(readFileSync(METRICS_FILE, "utf-8"));
  } catch {
    return [];
  }
}

function saveMetrics(events: TraceEvent[]) {
  try {
    writeFileSync(METRICS_FILE, JSON.stringify(events));
  } catch {
    // Best-effort — silently fail if the file can't be written
  }
}

const metricsStore: TraceEvent[] = loadMetrics();

export function recordMetrics(event: TraceEvent) {
  metricsStore.push(event);
  // Keep only the most recent entries to prevent unbounded growth
  if (metricsStore.length > MAX_STORED) metricsStore.splice(0, metricsStore.length - MAX_STORED);
  saveMetrics(metricsStore);
}

export function getMetrics() {
  if (metricsStore.length === 0) return null;

  const successes = metricsStore.filter((e) => e.success);
  const avgLatency =
    metricsStore.reduce((sum, e) => sum + e.totalLatencyMs, 0) / metricsStore.length;
  const avgToolsSelected =
    metricsStore.reduce((sum, e) => sum + e.toolsSelected.length, 0) / metricsStore.length;
  const successRate = successes.length / metricsStore.length;

  return {
    totalRuns: metricsStore.length,
    successRate: Math.round(successRate * 100),
    avgLatencyMs: Math.round(avgLatency),
    avgToolsSelected: Math.round(avgToolsSelected * 10) / 10,
    recentRuns: metricsStore.slice(-10).reverse(),
  };
}
