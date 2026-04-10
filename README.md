# AI App Failure Debugger

A minimal support tool that diagnoses why AI-generated apps aren't working correctly.

Built with Next.js (App Router) + Tailwind CSS. No database. No auth.

## What it does

Paste in what you were trying to build, what went wrong, and any error logs. The tool returns a structured diagnosis:

- **Likely Root Cause** — clear 1–2 sentence summary
- **Why This Happened** — plain language explanation of the failure pattern
- **Suggested Fix** — specific, numbered steps
- **Improved Prompt** — a rewritten version of your original intent for better AI builder results
- **Confidence Level** — Low / Medium / High with reasoning

## Common failure patterns covered

- Missing backend logic / unimplemented handlers
- Auth / session not persisting
- Database not saving data (client-only state)
- Stripe / payment integrations failing
- Email API misconfiguration
- API route errors (404, 500, CORS)
- Vague or underspecified prompts

## Quick-fill scenarios

Three pre-filled examples are available:
- Auth not working
- Payments failing
- Data not saving

## Running locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Stack

- [Next.js 15](https://nextjs.org) (App Router)
- [Tailwind CSS v4](https://tailwindcss.com)
- TypeScript
