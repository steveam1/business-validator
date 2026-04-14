# Business Idea Validator

An agentic AI web application that analyzes business ideas across multiple dimensions and generates a structured validation brief. Built with Next.js and Claude (Anthropic).

**Author:** Ashley Stevens  
**Live App:** [business-validator-ten.vercel.app](https://business-validator-ten.vercel.app)

---

## What It Does

You describe a business idea. The system:

1. Runs an **orchestrator** — Claude reads the idea and decides which 3–5 analysis tools are most relevant to run
2. Executes the selected tools **in parallel** — each is a specialized Claude prompt covering market size, competitors, risks, target customer, or monetization
3. Runs a **synthesizer** — Claude combines all tool outputs into scores (viability, opportunity, risk) and a final verdict
4. Logs the full trace for observability

---

## Why This Is Agentic

The orchestrator LLM makes a genuine routing decision on every request. It does not always call all 5 tools. For a narrow B2B idea it might skip market size and focus on competitors and monetization. For a broad consumer idea it might run all 5. The LLM controls the workflow — this is the agentic behavior.

A system where every tool always runs in the same order would not be agentic. This one is, because the LLM decides what happens next based on the input.

---

## Architecture

```
User Input
    │
    ▼
┌─────────────────────────────┐
│        Orchestrator          │  Claude decides which tools to run
│   (LLM routing decision)     │
└─────────────┬───────────────┘
              │  selected tool IDs
              ▼
┌─────────────────────────────┐
│     Parallel Tool Calls      │  Each tool = one specialized Claude call
│  market │ competitor │ risks │
│  customer │ monetization     │
└─────────────┬───────────────┘
              │  tool results
              ▼
┌─────────────────────────────┐
│         Synthesizer          │  Claude combines results → scores + verdict
└─────────────┬───────────────┘
              │
              ▼
         UI + Metrics
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript |
| Backend | Next.js API Routes (serverless) |
| Model | Claude Sonnet (`claude-sonnet-4-6`) via Anthropic API |
| Observability | Langfuse (optional) + file-backed custom metrics |
| Deployment | Vercel |

---

## Analysis Tools

| Tool | What It Analyzes |
|---|---|
| **Market Size** | TAM/SAM estimates, growth trends, opportunity verdict |
| **Competitor Landscape** | 3–4 real competitors, their weaknesses, gaps to fill |
| **Risk Assessment** | Top 3–4 risks with mitigations |
| **Target Customer** | Demographics, pain points, willingness to pay |
| **Monetization Strategy** | 2–3 revenue models with pricing and a recommendation |

---

## Metrics

Tracked on every run and viewable at `/metrics`:

| Metric | Type | Why It Matters |
|---|---|---|
| **Success rate** | Quality | Did the agent complete the full pipeline without error? |
| **Avg latency** | Operational | How long does a full validation take end to end? |
| **Avg tools selected** | Behavioral | Shows how the orchestrator routes across different ideas |

Metrics persist to a local `metrics.json` file — they survive server restarts.

---

## Observability

Every validation run logs:
- The user's input idea
- Which tools the orchestrator selected and its reasoning
- Each tool's output and individual latency
- The synthesized scores and verdict
- Overall success/failure status and total latency

If Langfuse keys are configured, full traces are sent to [cloud.langfuse.com](https://cloud.langfuse.com). If not, traces are logged to the console. The app never crashes due to missing Langfuse credentials.

---

## Local Setup

### 1. Clone and install dependencies

```bash
git clone https://github.com/steveam1/business-validator.git
cd business-validator
npm install
```

### 2. Configure environment variables

```bash
cp .env.local.example .env.local
```

Open `.env.local` and fill in:

```
ANTHROPIC_API_KEY=        # Required — get from console.anthropic.com
LANGFUSE_SECRET_KEY=      # Optional — get from cloud.langfuse.com
LANGFUSE_PUBLIC_KEY=      # Optional — get from cloud.langfuse.com
LANGFUSE_HOST=https://cloud.langfuse.com
```

> `ANTHROPIC_API_KEY` is required. Langfuse keys are optional — the app works without them.

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deployment

The app is deployed on Vercel. To deploy your own instance:

1. Push the repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository
3. Add `ANTHROPIC_API_KEY` under Environment Variables in the Vercel dashboard
4. Click Deploy

Vercel auto-detects Next.js — no additional configuration needed.

---

## Project Structure

```
app/
  page.tsx                  # Main UI — idea input and results display
  page.module.css
  layout.tsx
  globals.css
  api/
    validate/route.ts       # Core agentic logic: orchestrator → tools → synthesizer
    metrics/route.ts        # Metrics API endpoint
  metrics/
    page.tsx                # Metrics dashboard
lib/
  tools.ts                  # Tool definitions, prompts, and system messages
  logger.ts                 # Observability (Langfuse) + metrics persistence
.env.local.example          # Environment variable template
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | ✅ Yes | Anthropic API key for Claude |
| `LANGFUSE_SECRET_KEY` | No | Langfuse secret key for tracing |
| `LANGFUSE_PUBLIC_KEY` | No | Langfuse public key for tracing |
| `LANGFUSE_HOST` | No | Langfuse host URL (defaults to cloud.langfuse.com) |

Do not commit `.env.local` — it is already in `.gitignore`.
