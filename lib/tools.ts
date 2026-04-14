export const TOOLS = [
  { id: "market",        name: "Market Size",          icon: "◎", color: "blue",  label: "Market Size" },
  { id: "competitor",    name: "Competitor Landscape",  icon: "◈", color: "green", label: "Competitors" },
  { id: "risks",         name: "Risk Assessment",       icon: "◬", color: "red",   label: "Risks" },
  { id: "customer",      name: "Target Customer",       icon: "◉", color: "amber", label: "Target Customer" },
  { id: "monetization",  name: "Monetization Strategy", icon: "◆", color: "green", label: "Monetization" },
] as const;

export type ToolId = "market" | "competitor" | "risks" | "customer" | "monetization";

export const ORCHESTRATOR_SYSTEM = `You are an orchestrator for a business idea validation system. Given a business idea, decide which of the following analysis tools are most relevant to run.

Return ONLY a valid JSON object with no markdown or extra text:
{"tools": ["tool_id", ...], "reason": "one sentence explanation"}

Available tools:
- market: market size & opportunity analysis
- competitor: existing competition analysis
- risks: key risks and challenges
- customer: target customer profile
- monetization: revenue models and pricing

Rules:
- Always include "risks"
- Select 3 to 5 tools total
- Select fewer for narrow/simple ideas, more for broad/complex ones
- Return only valid JSON`;

export const TOOL_SYSTEM = `You are a concise, direct business analyst. Give clear analysis with specific details. Do not use markdown headers or bullet symbols. Write in plain prose paragraphs. Keep responses under 150 words.`;

export const TOOL_PROMPTS: Record<ToolId, (idea: string) => string> = {
  market: (idea) =>
    `Analyze the market size and opportunity for this business idea: "${idea}"\n\nInclude: estimated TAM/SAM with numbers, growth trends, key market drivers, and a verdict on the opportunity. Be specific.`,
  competitor: (idea) =>
    `Analyze the competitor landscape for: "${idea}"\n\nName 3 to 4 real existing competitors or alternatives, describe their weaknesses, and explain the gap this idea could fill.`,
  risks: (idea) =>
    `Identify the top 3 to 4 risks for this business idea: "${idea}"\n\nFor each risk explain why it matters and one way to mitigate it.`,
  customer: (idea) =>
    `Define the ideal target customer for: "${idea}"\n\nDescribe their demographics, key pain points, where they spend time online, and what would make them pay for this solution.`,
  monetization: (idea) =>
    `Suggest monetization strategies for: "${idea}"\n\nPropose 2 to 3 revenue models with rough pricing, pros and cons of each, and which you would recommend starting with and why.`,
};

export const SYNTHESIZER_SYSTEM = `You are a senior business analyst writing a final verdict. Return ONLY a valid JSON object with no markdown or extra text.`;

export const SYNTHESIZER_PROMPT = (idea: string, results: Record<string, string>) =>
  `Business idea: "${idea}"

Analysis results:
${Object.entries(results)
  .map(([k, v]) => `${k.toUpperCase()}:\n${v}`)
  .join("\n\n")}

Return this JSON object:
{
  "verdict": "2-3 sentence overall verdict on viability",
  "viability_score": <integer 1-10>,
  "opportunity_score": <integer 1-10>,
  "risk_score": <integer 1-10, where 10 = very high risk>,
  "one_liner": "single sentence pitch for this idea"
}`;
