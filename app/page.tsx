"use client";

import { useState, useEffect } from "react";
import { TOOLS, ToolId } from "@/lib/tools";
import styles from "./page.module.css";

interface ValidationResult {
  traceId: string;
  idea: string;
  toolsSelected: ToolId[];
  toolResults: Record<string, string>;
  synthesis: {
    verdict: string;
    viability_score: number;
    opportunity_score: number;
    risk_score: number;
    one_liner: string;
  };
  totalLatencyMs: number;
}

const STATUS_STEPS = [
  "Selecting analysis lenses...",
  "Running market analysis...",
  "Analyzing competition...",
  "Assessing risks...",
  "Profiling target customers...",
  "Synthesizing results...",
];

function ScoreBar({ value, max = 10 }: { value: number; max?: number }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className={styles.scoreBarTrack}>
      <div className={styles.scoreBarFill} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function Home() {
  const [idea, setIdea] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [error, setError] = useState("");
  const [statusMsg, setStatusMsg] = useState("");

  // Cycle through status messages while loading
  useEffect(() => {
    if (!loading) { setStatusMsg(""); return; }
    let i = 0;
    setStatusMsg(STATUS_STEPS[0]);
    const timer = setInterval(() => {
      i = (i + 1) % STATUS_STEPS.length;
      setStatusMsg(STATUS_STEPS[i]);
    }, 3000);
    return () => clearInterval(timer);
  }, [loading]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!idea.trim() || idea.trim().length < 10) {
      setError("Please describe your idea in more detail.");
      return;
    }
    setError("");
    setResult(null);
    setLoading(true);

    try {
      const res = await fetch("/api/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  // Preserve tool order from the TOOLS constant
  const toolsInOrder = result
    ? TOOLS.filter((t) => result.toolsSelected.includes(t.id))
    : [];

  return (
    <main className={styles.main}>
      <div className={styles.container}>

        {/* Header */}
        <header className={styles.header}>
          <div className={styles.eyebrow}>AI-powered analysis</div>
          <h1 className={styles.title}>Business Idea Validator</h1>
          <p className={styles.subtitle}>
            Describe your idea. The agent selects the most relevant analysis lenses
            and generates a structured brief.
          </p>
        </header>

        {/* Input */}
        <form onSubmit={handleSubmit} className={styles.form}>
          <textarea
            className={styles.textarea}
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="e.g. A subscription app that helps remote teams track energy levels and automatically schedule deep work sessions based on each person's peak hours..."
            rows={5}
            disabled={loading}
            aria-label="Business idea"
          />
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? statusMsg : "Validate idea →"}
          </button>
        </form>

        {/* Loading skeleton */}
        {loading && (
          <div className={styles.skeletonArea}>
            <div className={styles.skeletonCard} />
            <div className={styles.skeletonCard} style={{ height: 120 }} />
            <div className={styles.skeletonCard} style={{ height: 100 }} />
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <div className={styles.results}>

            {/* One-liner */}
            <div className={styles.oneLiner}>
              &ldquo;{result.synthesis.one_liner}&rdquo;
            </div>

            {/* Scores */}
            <div className={styles.scoresGrid}>
              <div className={styles.scoreItem}>
                <div className={styles.scoreLabel}>Viability</div>
                <div className={styles.scoreNum}>{result.synthesis.viability_score}<span>/10</span></div>
                <ScoreBar value={result.synthesis.viability_score} />
              </div>
              <div className={styles.scoreItem}>
                <div className={styles.scoreLabel}>Opportunity</div>
                <div className={styles.scoreNum}>{result.synthesis.opportunity_score}<span>/10</span></div>
                <ScoreBar value={result.synthesis.opportunity_score} />
              </div>
              <div className={styles.scoreItem}>
                <div className={styles.scoreLabel}>Risk level</div>
                <div className={styles.scoreNum}>{result.synthesis.risk_score}<span>/10</span></div>
                <ScoreBar value={result.synthesis.risk_score} />
              </div>
            </div>

            {/* Verdict */}
            <div className={styles.verdictCard}>
              <div className={styles.sectionLabel}>Overall verdict</div>
              <p className={styles.verdictText}>{result.synthesis.verdict}</p>
            </div>

            {/* Tool results */}
            <div className={styles.sectionLabel} style={{ marginTop: "2rem" }}>
              Analysis — {toolsInOrder.length} lenses selected by agent
            </div>

            <div className={styles.toolsGrid}>
              {toolsInOrder.map((tool) => (
                <div key={tool.id} className={styles.toolCard}>
                  <div className={styles.toolHeader}>
                    <span className={`${styles.toolBadge} ${styles[`badge_${tool.color}`]}`}>
                      {tool.label}
                    </span>
                  </div>
                  <p className={styles.toolBody}>
                    {result.toolResults[tool.id] ?? "No result."}
                  </p>
                </div>
              ))}
            </div>

            {/* Metadata */}
            <div className={styles.meta}>
              <span>Trace ID: {result.traceId.slice(0, 8)}…</span>
              <span>Latency: {(result.totalLatencyMs / 1000).toFixed(1)}s</span>
              <a href="/metrics" className={styles.metaLink}>View metrics →</a>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
