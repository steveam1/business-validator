"use client";

import { useEffect, useState } from "react";
import styles from "./metrics.module.css";

interface Metrics {
  totalRuns: number;
  successRate: number;
  avgLatencyMs: number;
  avgToolsSelected: number;
  recentRuns: Array<{
    traceId: string;
    idea: string;
    toolsSelected: string[];
    totalLatencyMs: number;
    success: boolean;
  }>;
}

export default function MetricsPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/metrics")
      .then((r) => r.json())
      .then((d) => { setMetrics(d.totalRuns ? d : null); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <a href="/" className={styles.back}>← Back</a>
        <h1 className={styles.title}>Metrics</h1>
        <p className={styles.subtitle}>Live operational metrics for this session.</p>

        {loading && <p className={styles.empty}>Loading…</p>}

        {!loading && !metrics && (
          <p className={styles.empty}>No runs yet. <a href="/">Validate an idea first →</a></p>
        )}

        {metrics && (
          <>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Total runs</div>
                <div className={styles.statValue}>{metrics.totalRuns}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Success rate</div>
                <div className={styles.statValue}>{metrics.successRate}%</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Avg latency</div>
                <div className={styles.statValue}>{(metrics.avgLatencyMs / 1000).toFixed(1)}s</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Avg tools selected</div>
                <div className={styles.statValue}>{metrics.avgToolsSelected}</div>
              </div>
            </div>

            <h2 className={styles.sectionTitle}>Recent runs</h2>
            <div className={styles.runsList}>
              {metrics.recentRuns.map((run) => (
                <div key={run.traceId} className={styles.runRow}>
                  <div className={styles.runIdea}>{run.idea.slice(0, 80)}{run.idea.length > 80 ? "…" : ""}</div>
                  <div className={styles.runMeta}>
                    <span className={run.success ? styles.success : styles.fail}>
                      {run.success ? "success" : "failed"}
                    </span>
                    <span>{run.toolsSelected.length} tools</span>
                    <span>{(run.totalLatencyMs / 1000).toFixed(1)}s</span>
                    <span className={styles.traceId}>{run.traceId.slice(0, 8)}…</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
