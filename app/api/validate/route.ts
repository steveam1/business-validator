import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import {
  ORCHESTRATOR_SYSTEM,
  TOOL_SYSTEM,
  TOOL_PROMPTS,
  SYNTHESIZER_SYSTEM,
  SYNTHESIZER_PROMPT,
  ToolId,
} from "@/lib/tools";
import { logTrace, recordMetrics } from "@/lib/logger";

// Lazy singleton — created once on first request so process.env is fully loaded
let _anthropic: Anthropic | null = null;
function getAnthropicClient() {
  if (!_anthropic) _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _anthropic;
}

async function callClaude(system: string, userMessage: string): Promise<string> {
  const response = await getAnthropicClient().messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1000,
    system,
    messages: [{ role: "user", content: userMessage }],
  });
  return (response.content[0] as { text: string }).text;
}

function parseJSON<T>(raw: string): T {
  const cleaned = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned) as T;
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const traceId = randomUUID();

  let idea = "";
  try {
    const body = await req.json();
    idea = body.idea?.trim();
    if (!idea || idea.length < 10) {
      return NextResponse.json({ error: "Please provide a more detailed idea." }, { status: 400 });
    }

    // Step 1: Orchestrator decides which tools to run
    const orchRaw = await callClaude(ORCHESTRATOR_SYSTEM, `Business idea: ${idea}`);
    let selectedToolIds: ToolId[] = ["market", "competitor", "risks", "customer", "monetization"];
    try {
      const orchResult = parseJSON<{ tools: ToolId[]; reason: string }>(orchRaw);
      if (Array.isArray(orchResult.tools) && orchResult.tools.length > 0) {
        selectedToolIds = orchResult.tools;
      }
    } catch {
      console.warn("Orchestrator response could not be parsed — falling back to all tools");
    }

    // Step 2: Run selected tools in parallel
    const toolLatencies: Record<string, number> = {};
    const toolResults: Record<string, string> = {};

    await Promise.all(
      selectedToolIds.map(async (toolId) => {
        const toolStart = Date.now();
        try {
          const prompt = TOOL_PROMPTS[toolId];
          if (!prompt) return;
          toolResults[toolId] = await callClaude(TOOL_SYSTEM, prompt(idea));
        } catch (e) {
          console.error(`Tool "${toolId}" failed:`, e);
          toolResults[toolId] = "Analysis unavailable.";
        } finally {
          toolLatencies[toolId] = Date.now() - toolStart;
        }
      })
    );

    // Step 3: Synthesize results
    const synthRaw = await callClaude(SYNTHESIZER_SYSTEM, SYNTHESIZER_PROMPT(idea, toolResults));
    let synthesis: Record<string, unknown> = {
      verdict: "Analysis complete.",
      viability_score: 6,
      opportunity_score: 6,
      risk_score: 5,
      one_liner: idea,
    };
    try {
      synthesis = parseJSON(synthRaw);
    } catch {
      console.warn("Synthesizer response could not be parsed — using defaults");
    }

    const totalLatencyMs = Date.now() - startTime;

    const traceEvent = {
      traceId,
      idea,
      toolsSelected: selectedToolIds,
      toolResults,
      synthesis,
      totalLatencyMs,
      toolLatencies,
      success: true,
    };
    recordMetrics(traceEvent);
    await logTrace(traceEvent).catch(console.error);

    return NextResponse.json({ traceId, idea, toolsSelected: selectedToolIds, toolResults, synthesis, totalLatencyMs });
  } catch (error) {
    console.error("Validation error:", error);
    const traceEvent = {
      traceId,
      idea,
      toolsSelected: [],
      toolResults: {},
      synthesis: {},
      totalLatencyMs: Date.now() - startTime,
      toolLatencies: {},
      success: false,
      error: String(error),
    };
    recordMetrics(traceEvent);
    await logTrace(traceEvent).catch(console.error);

    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
