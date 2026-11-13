# LAKSHYA — JEE / IIT Motivation Companion

**LAKSHYA** is an Orbital Mission Control motivation and focus companion built for JEE Main & JEE Advanced aspirants. It features a personalized 3-step onboarding flow, streak tracking, exam countdown telemetry, a 5-stage campaign roadmap, and three specialized AI mentors powered by **xAI's Grok API**:

1. **Calm (Teal / Cyan)** — Stress relief companion with a 4-4-6 breathing guide, emotional validation, 5-minute nervous system resets, and Tele-MANAS (`14416`) crisis care.
2. **Now (Electric Violet)** — Decisive tactical study coach that takes your available time window and energy level (`15%–100%`) and returns **ONE** immediate action (`ACTION`, `WHY`, `TIME`) with a working countdown timer.
3. **Mission (Mission Gold)** — Big-sibling mentor that guards your North Star goal, tracks your 5-stage JEE roadmap (`Foundation` → `Practice` → `Mocks` → `Final Sprint` → `JEE Day`), manages 3 checkable daily tasks with confetti celebration, and delivers a full-screen *"Remind me why I started"* pep talk.

---

## Quick Setup & Running Locally

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure your xAI (Grok) API Key:**
   - Copy `.env.example` to `.env` in the root directory:
     ```bash
     cp .env.example .env
     ```
   - Paste your xAI API key from [https://console.x.ai](https://console.x.ai) into `.env`:
     ```env
     XAI_API_KEY="xai-your-actual-key-here"
     ```
   - *(Note: In Google AI Studio, open the **Secrets / Environment Variables** panel and add `XAI_API_KEY` there. If no key is provided, LAKSHYA automatically runs in **Demo Mode** with realistic, profile-aware mentor replies so the UI works out of the box.)*

3. **Start the full-stack development server (Port 3000):**
   ```bash
   npm run dev
   ```

---

## Architecture & Changing the Grok Model

- **`api/grok.js`**: Holds the single `GROK_MODEL` constant (`'grok-3-mini'` by default, or overridden via `XAI_MODEL`), temperature presets (`0.8` for Calm & Mission, `0.5` for Now), the reusable `callGrok({ systemPrompt, messages })` function, and the Demo Mode fallback generator.
- **`server.ts` (`/api/chat`)**: Express backend proxy route that reads `process.env.XAI_API_KEY` on the server and forwards requests to `https://api.x.ai/v1/chat/completions` so your API key is never exposed in browser bundle code.
- **Deploying to Vercel / Netlify**: See the top comments in `api/grok.js` for 3-line serverless wrapper instructions.
