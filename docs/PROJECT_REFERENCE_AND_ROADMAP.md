# TraderMind — Project Reference & Implementation Roadmap

> **Single Source of Reference for TraderMind Behavioral Intelligence Platform**
> Compiled from core project architecture, skill guides, and prompt specifications.

---

## 1. Core Mission & Scope
TraderMind is an **AI-powered trading behavioral intelligence platform**.
- **Core Purpose:** Analyzes **trader psychology, discipline, risk habits, and decision quality**.
- **Strict Constraint:** **NEVER** generate, suggest, or imply buy/sell signals, price predictions, market directions, or trade targets.

---

## 2. Technical Stack & Architecture

| Layer | Technology | Key Patterns & Rules |
| :--- | :--- | :--- |
| **Framework** | Next.js 15 App Router | Route groups `(dashboard)`, server components by default, `'use client'` on line 1 col 1 for interactive pages. |
| **Styling** | Tailwind CSS + Custom CSS Variables | Dark theme only (`#0A0B0E` bg, `#111318` surface). JetBrains Mono for all numeric/financial values. |
| **AI** | OpenAI GPT-4o & GPT-4o-mini | **Lazy initialization** via `getOpenAI()` inside function bodies (prevents Vercel build failure). `gpt-4o` for deep reports, `gpt-4o-mini` for chat & quick insights. |
| **Database & Auth** | Supabase (PostgreSQL + RLS) | `@supabase/ssr` with separate server (`await createClient()`) and browser clients. RLS policies with `auth.uid() = user_id`. |
| **Charts** | Recharts 2.x | Always wrapped in `<ResponsiveContainer width="100%" />`. Custom dark theme tooltip (`#161920`), grid `rgba(255,255,255,0.04)`. |
| **Broker Ingestion** | MetaAPI (MT4/MT5) | Dynamic import inside sync functions (`await import('metaapi.cloud-sdk')`). Deal-to-trade mapping and upserts. |

---

## 3. Skills Summary Reference

### A. OpenAI (`skills/openai.md`)
- **Instantiation:**
  ```ts
  import OpenAI from 'openai'
  function getOpenAI() {
    return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  ```
- **System Prompt Standard:** Behavioral coach only, data-grounded, constructive, addressing the trader in the second person ("you"), never discussing market direction.

### B. Supabase (`skills/supabase.md`)
- **Server Client (API Routes & Server Components):**
  ```ts
  import { createClient } from '@/lib/supabase/server'
  const supabase = await createClient()
  ```
- **Client Components:**
  ```ts
  import { createClient } from '@/lib/supabase/client'
  const supabase = createClient()
  ```
- Always scope queries to `user.id`.

### C. Recharts (`skills/recharts.md`)
- **Standard Dark Tooltip Configuration:**
  ```tsx
  const tooltipStyle = {
    contentStyle: {
      background: '#161920',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '8px',
      fontSize: '11px',
      fontFamily: "'JetBrains Mono', monospace",
      color: '#E8EAF0',
    },
    labelStyle: { color: '#8B90A0', fontSize: '10px', marginBottom: '4px' },
    itemStyle: { color: '#E8EAF0' },
  }
  ```
- AreaChart (Equity Curve), ComposedChart (Equity + Discipline line), RadarChart (Behavioral dimensions), ScatterChart (Emotion vs R:R), BarChart (Session performance).

### D. MetaAPI (`skills/metaapi.md`)
- Account creation, deployment (`account.deploy()`), historical deal sync (`getHistoricalDeals`), and RPC account balance / equity sync.

---

## 4. Feature Matrix & Build Plan

### Feature 1: AI Coach (`prompts/build-ai-coach.md`)
- **Route:** `/ai-coach` (`app/(dashboard)/ai-coach/page.tsx`)
- **APIs:** `/api/ai/report`, `/api/ai/chat`
- **Capabilities:**
  - Tab 1: **Monthly Behavioral Report** (Overall discipline score banner, 3 narrative sections, 5 key insights, 5 actionable suggestions).
  - Tab 2: **Conversational Coach Chat** with streaming/fallback response, pre-configured quick prompts.

### Feature 2: Main Overview Dashboard (`prompts/build-dashboard.md`)
- **Route:** `/dashboard` (`app/(dashboard)/dashboard/page.tsx`)
- **Capabilities:**
  - 4 Key Behavioral Scores (Discipline 78, Consistency 84, Risk Quality 61, Emotional Stability 72).
  - AI Behavioral Insight callout card.
  - Interactive Equity Curve + Discipline Overlay chart.
  - Live Pre-Trade Evaluation Widget.
  - Session Performance Breakdown (London: 67% WR, NY: 48% WR, Asian: 55% WR, Overlap: 71% WR).
  - Emotion Distribution & Risk Sizing Meter.
  - Recent Trades Feed with Behavioral Alignment tags.

### Feature 3: Behavioral Intelligence Hub (`prompts/build-behavior.md`)
- **Route:** `/behavior` (`app/(dashboard)/behavior/page.tsx`)
- **Capabilities:**
  - Radar Chart: 6-factor psychological profile.
  - Scatter Chart: Emotion vs R:R distribution.
  - Leak Detector: Revenge trading (3 instances), Post-win risk creep (6 instances), FOMO entries (2 instances).

### Feature 4: Behavioral Journal (`prompts/build-journal.md`)
- **Route:** `/journal` (`app/(dashboard)/journal/page.tsx`)
- **Capabilities:**
  - Log drawer for Pre-Trade and Post-Trade reflections.
  - Emotion badges, Discipline/Conviction/FOMO sliders, Lessons learned cards.

### Feature 5: Risk Rules & Pre-Trade Evaluation (`prompts/build-trade-eval.md`)
- **Route:** `/goals` & `/api/behavioral/evaluate`
- **Capabilities:**
  - Deterministic evaluation engine (`lib/behavioral/engine.ts`).
  - Pre-trade checklist, warning triggers, and alignment scores.

---

## 5. Standard Demo Data Reference

```ts
// User Context
name: 'Alex Kim', plan: 'pro', broker: 'MT5 · Connected', balance: 11247.50, equity: 11380.20

// Scores & Deltas
disciplineScore: 78 (+3)
consistencyScore: 84 (+7)
riskQualityScore: 61 (-4)
emotionalStabilityScore: 72 (+11)

// Performance
winRate: 59.6%, netPnl: +$1,247, profitFactor: 1.87, maxDrawdown: -4.2%, avgRR: 2.3R, totalTrades: 47

// Sessions
London:  { wr: 67, trades: 19 }
New York:{ wr: 48, trades: 15 }
Asian:   { wr: 55, trades: 8 }
Overlap: { wr: 71, trades: 5 }

// Behavioral Leak Flags
revengeTrading:    { count: 3, severity: 'high' }
postWinRiskCreep: { count: 6, severity: 'medium' }
fomoEntry:        { count: 2, severity: 'medium' }
ruleViolations:   { count: 1, severity: 'low' }
```
