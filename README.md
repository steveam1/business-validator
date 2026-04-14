# Business Idea Validator

An agentic AI web application that validates business ideas across multiple dimensions. The LLM orchestrator dynamically selects which analysis tools to run based on the idea, making it a genuinely agentic system.

## Live Demo
> Add your Vercel URL here after deployment

## How It Works

1. User submits a business idea
2. **Orchestrator** (Claude) reads the idea and decides which 3–5 analysis tools are most relevant
3. Selected tools run **in parallel**, each as a specialized Claude call
4. **Synthesizer** combines results into scores and a final verdict
5. All traces are logged to Langfuse for observability

### Why This Is Agentic
The LLM makes a real routing decision — it doesn't always run all 5 tools. For a narrow idea (e.g. a niche B2B SaaS tool), it may skip the broad market size analysis and focus on competitor and monetization lenses. This dynamic selection is the agentic behavior.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript
- **Backend**: Next.js API Routes
- **Model**: Claude Sonnet (Anthropic API)
- **Observability**: Langfuse
- **Deployment**: Vercel

## Setup

### 1. Clone and install

```bash
git clone <your-repo-url>
cd business-validator
npm install
```

### 2. Set up environment variables

```bash
cp .env.local.example .env.local
```

Fill in `.env.local`:

```
ANTHROPIC_API_KEY=        # https://console.anthropic.com
LANGFUSE_SECRET_KEY=      # https://cloud.langfuse.com (free tier)
LANGFUSE_PUBLIC_KEY=      # https://cloud.langfuse.com
LANGFUSE_HOST=https://cloud.langfuse.com
```

> Langfuse is optional — if keys are missing, traces are logged to console instead.

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deployment (Vercel)

```bash
npm install -g vercel
vercel deploy
```

Add your environment variables in the Vercel dashboard under **Settings → Environment Variables**.

## Project Structure

```
app/
  page.tsx                  # Main input + results UI
  page.module.css
  layout.tsx
  globals.css
  api/
    validate/route.ts       # Core agentic logic (orchestrator + tools + synthesizer)
    metrics/route.ts        # Metrics endpoint
  metrics/
    page.tsx                # Metrics dashboard
lib/
  tools.ts                  # Tool definitions and prompts
  logger.ts                 # Langfuse observability + in-memory metrics
```

## Metrics

The app tracks two metrics:

| Metric | Why It Matters |
|---|---|
| **Success rate** | Quality signal — did the agent complete without error? |
| **Avg latency** | Operational — how long does a full validation take? |

Additional: avg tools selected per run (shows orchestrator routing behavior), recent run history.

View metrics at `/metrics`.

## Observability

Every validation run logs:
- User input (the idea)
- Which tools the orchestrator selected and why
- Each tool's output and latency
- Final synthesis scores
- Success/failure status

Traces are viewable in Langfuse at [cloud.langfuse.com](https://cloud.langfuse.com).

## Analysis Tools

| Tool | What It Analyzes |
|---|---|
| Market Size | TAM/SAM, growth trends, opportunity |
| Competitor Landscape | Existing alternatives, gaps |
| Risk Assessment | Top 3–4 risks and mitigations |
| Target Customer | Demographics, pain points, willingness to pay |
| Monetization Strategy | Revenue models, pricing, recommendations |
