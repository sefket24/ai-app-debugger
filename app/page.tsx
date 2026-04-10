"use client";

import { useState } from "react";
import type { DiagnosisResult } from "./api/diagnose/route";

const QUICK_FILLS = [
  {
    label: "Auth not working",
    intent:
      "A user authentication system where users can sign up, log in, and access a protected dashboard",
    behavior:
      "Users can fill out the login form and click submit, but they keep getting redirected back to the login page. It looks like the session isn't being saved. Sometimes it works on the first try but resets on page refresh.",
    logs: "Error: No session found\nGET /dashboard 302 Redirected to /login\nWarning: cookies() was called outside of a request context",
  },
  {
    label: "Payments failing",
    intent:
      "A checkout page where customers can buy a $49 product using their credit card via Stripe",
    behavior:
      "The payment form loads correctly and accepts card details, but when the user clicks Pay, nothing happens. No error message, no confirmation. The payment never shows up in the Stripe dashboard.",
    logs: "TypeError: Cannot read properties of undefined (reading 'confirmCardPayment')\nStripe.js not loaded\nFailed to load resource: net::ERR_BLOCKED_BY_CLIENT",
  },
  {
    label: "Data not saving",
    intent:
      "A simple task manager where users can add tasks, mark them complete, and see their list persist between visits",
    behavior:
      "The app works great during a session — I can add tasks and check them off. But every time I refresh the page or come back later, all my tasks are gone. It's like it starts fresh every time.",
    logs: "",
  },
];

const CONFIDENCE_STYLES: Record<DiagnosisResult["confidence"], string> = {
  Low: "text-amber-600 bg-amber-50 border-amber-200",
  Medium: "text-blue-600 bg-blue-50 border-blue-200",
  High: "text-emerald-600 bg-emerald-50 border-emerald-200",
};

export default function Home() {
  const [intent, setIntent] = useState("");
  const [behavior, setBehavior] = useState("");
  const [logs, setLogs] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent, behavior, logs }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Request failed");
      }

      const data: DiagnosisResult = await res.json();
      setResult(data);

      setTimeout(() => {
        document.getElementById("diagnosis-output")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 50);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function applyQuickFill(fill: (typeof QUICK_FILLS)[number]) {
    setIntent(fill.intent);
    setBehavior(fill.behavior);
    setLogs(fill.logs);
    setResult(null);
    setError(null);
  }

  async function copyPrompt(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-1.5 bg-violet-100 text-violet-700 text-xs font-semibold px-3 py-1 rounded-full mb-4 tracking-wide uppercase">
            Support Tool
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">
            AI App Failure Debugger
          </h1>
          <p className="text-gray-500 text-base">
            Figure out why your AI-built app isn&apos;t working
          </p>
        </div>

        {/* Quick Fill */}
        <div className="mb-6">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2.5">
            Quick fill
          </p>
          <div className="flex flex-wrap gap-2">
            {QUICK_FILLS.map((fill) => (
              <button
                key={fill.label}
                onClick={() => applyQuickFill(fill)}
                className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-violet-400 hover:text-violet-700 hover:bg-violet-50 transition-colors cursor-pointer"
              >
                {fill.label}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              What were you trying to build?
            </label>
            <textarea
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              rows={3}
              placeholder="e.g. A dashboard where users can log in, see their sales data, and export reports as CSV"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent resize-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              What happened instead?
            </label>
            <textarea
              value={behavior}
              onChange={(e) => setBehavior(e.target.value)}
              rows={3}
              placeholder="e.g. The login form appears but submitting it does nothing — no redirect, no error message"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent resize-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Logs or error output{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={logs}
              onChange={(e) => setLogs(e.target.value)}
              rows={4}
              placeholder="Paste console errors, server logs, or network errors here"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent resize-none font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-colors text-sm cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Diagnosing...
              </span>
            ) : (
              "Diagnose Issue"
            )}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div className="mt-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Output */}
        {result && (
          <div id="diagnosis-output" className="mt-10 space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Diagnosis
              </h2>
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${CONFIDENCE_STYLES[result.confidence]}`}
              >
                {result.confidence} Confidence
              </span>
            </div>

            <Card title="Likely Root Cause" icon="🎯">
              <p className="text-gray-700 text-sm leading-relaxed">
                {result.rootCause}
              </p>
            </Card>

            <Card title="Why This Happened" icon="🔍">
              <p className="text-gray-700 text-sm leading-relaxed">
                {result.whyItHappened}
              </p>
            </Card>

            <Card title="Suggested Fix" icon="🔧">
              <ol className="space-y-2.5">
                {result.suggestedFix.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-gray-700">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-100 text-violet-700 text-xs font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </Card>

            <Card title="Improved Prompt" icon="✨">
              <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 mb-2">
                <p className="text-sm text-gray-700 leading-relaxed font-mono whitespace-pre-wrap">
                  {result.improvedPrompt}
                </p>
              </div>
              <button
                onClick={() => copyPrompt(result.improvedPrompt)}
                className="text-xs text-violet-600 hover:text-violet-800 font-medium cursor-pointer transition-colors"
              >
                {copied ? "Copied!" : "Copy prompt →"}
              </button>
            </Card>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
              <p className="text-xs text-gray-500 leading-relaxed">
                <span className="font-semibold text-gray-600">
                  Confidence note:
                </span>{" "}
                {result.confidenceReason}
              </p>
            </div>
          </div>
        )}

        <p className="mt-12 text-center text-xs text-gray-300">
          AI App Failure Debugger — built for Blink support workflows
        </p>
      </div>
    </main>
  );
}

function Card({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base leading-none">{icon}</span>
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      </div>
      {children}
    </div>
  );
}
