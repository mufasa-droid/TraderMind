<div align="center">

# TraderMind — AI Trading Behavioral Intelligence

**Most trading tools analyze the market. We analyze the trader.**

An institutional-grade trading psychology and performance intelligence platform that measures discipline, emotional stability, risk creep, and cognitive leaks.

[![Next.js 15](https://img.shields.io/badge/Next.js-15.2-000000?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![OpenAI GPT-4o](https://img.shields.io/badge/OpenAI-GPT--4o-412991?style=flat-square&logo=openai)](https://openai.com/)
[![Google Gemini](https://img.shields.io/badge/Google-Gemini%20API-4285F4?style=flat-square&logo=google)](https://ai.google.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS%204.0-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

[Live Demo](http://localhost:3000) · [Architecture](#-two-layer-ai-architecture) · [Features](#-core-platform-features) · [Quickstart](#-quickstart-guide) · [MQL5 EA Guide](#-free-mql5-desktop-ea-integration)

</div>

---

## 📌 Executive Overview

Retail traders don't fail because they lack chart patterns or indicators. They fail because of **behavioral collapse**: revenge trading after losses, risk creep following win streaks, FOMO impulse entries, and session fatigue.

**TraderMind** solves this problem by functioning as an AI-powered trading performance psychologist:
- ❌ **What TraderMind is NOT:** It never provides buy/sell signals, price forecasts, copy trading, chart indicators, or automated execution bots.
- ✅ **What TraderMind IS:** It quantitatively analyzes **the human behind the execution** — tracking rule compliance, emotional states, cognitive leaks, and session-specific consistency.

---

## 🧠 Two-Layer AI Architecture

TraderMind separates mathematical rigor from psychological language through a strict two-layer architecture:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        RAW TRADE DATA & JOURNAL                        │
│             (Live MQL5 EA Webhook, Cloud Sync, or Journal)             │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│              LAYER 1: DETERMINISTIC BEHAVIORAL ENGINE                  │
│                     (lib/behavioral/engine.ts)                         │
├────────────────────────────────────────────────────────────────────────┤
│  • Pure TypeScript mathematical computation (Zero LLM / Zero API calls)│
│  • Calculates 4 Core Scores (0–100):                                  │
│      - Discipline Score (rule compliance, trade frequency, sizing)     │
│      - Consistency Score (holding times, R:R stability, setup follow)   │
│      - Risk Quality Score (stop-loss enforcement, variance control)    │
│      - Emotional Stability Score (state-to-outcome correlations)       │
│  • Session Attribution (London, New York, Asian, Overlap)              │
│  • 12 Behavioral Leak Detectors (revenge trading, post-win risk creep) │
│  • Output: Structured, immutable PerformanceAnalytics JSON snapshot    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                LAYER 2: AI BEHAVIORAL COACHING LAYER                   │
│                        (lib/ai/coach.ts)                               │
├────────────────────────────────────────────────────────────────────────┤
│  • Powered by GPT-4o & Google Gemini (with resilient fallback)         │
│  • NEVER calculates numbers — ONLY interprets Layer 1 analytics        │
│  • Conversational Coach (context-aware chat grounded in trade history) │
│  • Monthly Psychological Audit Reports & Proactive Action Items        │
│  • Speaks strictly as a performance psychologist (no market bias)      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   EXECUTIVE BEHAVIORAL INTELLIGENCE                    │
│      (Overview Dashboard, Radar Profiles, Scatter Charts, Alerts)      │
└────────────────────────────────────────────────────────────────────────┘
```

---

## ⚡ Core Platform Features

### 1. Executive Behavioral Dashboard (`/dashboard`)
* **4 Behavioral Score Cards**: Discipline (78), Consistency (84), Risk Quality (61), and Emotional Stability (72) with institutional mini sparklines.
* **Dual-Axis Equity & Discipline Curve**: Interactive Recharts visualization with synchronized vertical crosshair comparing account equity growth against discipline levels.
* **Session Performance Breakdown**: Win rate and volume distribution across London (67%), New York (48%), Asian (55%), and Overlap (71%) sessions.
* **Live Evaluator & Flags**: Real-time behavioral alignment status and active leak alerts.

### 2. Behavioral Intelligence Hub (`/behavior`)
* **6-Factor Psychological Radar**: 360° evaluation across Discipline, Risk Management, Consistency, Emotional Control, Entry Quality, and Exit Quality.
* **Emotion vs. R:R Scatter Chart**: Visual correlation matrix identifying which psychological states yield positive expectancy vs. negative drawdowns.
* **Behavioral Event Timeline**: Chronological log of psychological milestones and detected behavioral anomalies.

### 3. AI Behavioral Coach (`/ai-coach`)
* **Monthly Audit Report**: In-depth psychological narrative covering session divergence, revenge trading costs, and 5 actionable process improvements.
* **Interactive Chat Coach**: Context-grounded dialogue allowing traders to ask follow-up questions about their patterns (e.g., *"Why do I overtrade in New York?"*).

### 4. Trade History & Pre-Trade Evaluator (`/trades`)
* **Pre-Trade Alignment Evaluator**: 5-input deterministic checklist (Symbol, Direction, Risk %, Session, Strategy) scoring proposed trades against historical performance before execution.
* **Sortable Intelligence Log**: Complete trade log enriched with behavioral tags, session alignment scores, and emotional states.

### 5. Behavioral Journal (`/journal`)
* **Pre- & Post-Trade Reflection**: Capture trader mindset before entry and post-exit lessons.
* **Psychological Sliders**: Quantifies Confidence, Stress, Fear, and Focus levels on calibrated 1–10 scales across 9 distinct emotions.

### 6. Goals & Rule Compliance (`/goals`)
* **Interactive Rule Enforcer**: Active rule toggles for maximum daily loss, risk per trade limits, and mandatory cooldown periods.
* **Violation Counters**: Tracks historical infractions to highlight recurring discipline leaks.

### 7. Free MQL5 Desktop EA & Webhook Sync (`/broker/connect`)
* **Zero-Cost Live Ingestion**: Custom [`TraderMind_Sync.mq5`](public/downloads/TraderMind_Sync.mq5) Expert Advisor runs directly on desktop MetaTrader 5 terminals.
* **High-Throughput Webhook**: Receives historical sweeps, live closed-deal events, and balance/equity heartbeats with idempotent deduplication.

### 8. Screenshot Review Gallery (`/screenshots`)
* **Visual Chart Log**: Upload and link chart setups to individual trades via Supabase Storage with high-resolution modal inspection.

---

## 🛠 Technology Stack

| Domain | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | **Next.js 15 (App Router)** | Route groups, server components, and streaming UI |
| **Language** | **TypeScript 5 (Strict)** | Unified types across engine, database, and UI |
| **Database & Auth** | **Supabase (PostgreSQL + RLS)** | 11 relational tables with strict row-level security |
| **Storage** | **Supabase Storage** | Secure `screenshots` bucket for chart setups |
| **AI Models** | **GPT-4o & Gemini** | Lazy-instantiated behavioral coach with auto-fallback |
| **Visualization** | **Recharts 2.x** | Dual-axis curves, Radars, Scatters, and Bar charts |
| **Styling** | **Vanilla CSS + Tailwind 4** | Institutional dark theme design system (`#0A0B0E`) |
| **Broker Protocol** | **MQL5 EA + MetaAPI** | Free desktop EA webhook ingestion + Cloud API bridge |

---

## 🚀 Quickstart Guide

### Prerequisites
* Node.js 18.18+ or 20+
* Git
* A Supabase account (or use built-in demo mode)

### 1. Clone & Install
```bash
git clone https://github.com/mufasa-droid/TraderMind.git
cd TraderMind
npm install
```

### 2. Configure Environment
Copy the template configuration:
```bash
cp .env.example .env.local
```
*(For instant local demo exploration, `NEXT_PUBLIC_DEMO_MODE=true` is enabled by default).*

### 3. Launch Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 4. Portfolio Demo Credentials
To explore the pre-seeded account:
* **Email:** `demo@tradermind.io`
* **Password:** `TraderMind2026!`
* *(Or simply click the one-click **"✦ Portfolio Demo"** sign-in button on `/auth/login`)*

---

## 📡 Free MQL5 Desktop EA Integration

TraderMind provides a **100% free, direct MetaTrader 5 Expert Advisor** that streams trades to your local or deployed dashboard without requiring paid third-party cloud bridges.

### 4-Step Setup:
1. **Download the EA:** Download [`TraderMind_Sync.mq5`](public/downloads/TraderMind_Sync.mq5) from `/broker/connect` or the repository.
2. **Install in MT5:** Open MetaTrader 5 $\to$ `File` $\to$ `Open Data Folder` $\to$ `MQL5` $\to$ `Experts` $\to$ paste `TraderMind_Sync.mq5`.
3. **Whitelist Webhook URL:** In MT5, go to `Tools` $\to$ `Options` $\to$ `Expert Advisors` $\to$ check *"Allow WebRequest for listed URL"* $\to$ add your endpoint:
   ```text
   http://localhost:3000/api/broker/webhook
   ```
4. **Attach to Any Chart:** Open Navigator (`Ctrl+N`), drag `TraderMind_Sync` onto any chart, enter your **Private Sync Key**, and click **OK**.

### Live Stream Simulator (Terminal Demo)
To simulate live MT5 trade events and balance heartbeats without running MetaTrader:
```bash
node scripts/simulate_mt5_stream.js
```

---

## 🧪 Testing & Code Quality

TraderMind enforces strict TypeScript compilation and production build validation:

```bash
# Verify TypeScript strictness (0 errors)
cmd /c npx tsc --noEmit

# Production build verification
cmd /c npm run build
```

---

## 📄 License & Attribution

This project is licensed under the MIT License. Developed as a modern financial technology showcase and hackathon project demonstrating full-stack AI engineering, deterministic behavioral analysis, and institutional financial UX.
