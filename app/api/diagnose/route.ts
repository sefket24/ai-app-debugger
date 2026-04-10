import { NextRequest, NextResponse } from "next/server";

export interface DiagnosisResult {
  rootCause: string;
  whyItHappened: string;
  suggestedFix: string[];
  improvedPrompt: string;
  confidence: "Low" | "Medium" | "High";
  confidenceReason: string;
}

function detectPattern(intent: string, behavior: string, logs: string): string {
  const text = `${intent} ${behavior} ${logs}`.toLowerCase();

  if (
    text.includes("login") ||
    text.includes("auth") ||
    text.includes("session") ||
    text.includes("sign in") ||
    text.includes("logged out") ||
    text.includes("token") ||
    text.includes("unauthorized") ||
    text.includes("401")
  ) {
    return "auth";
  }
  if (
    text.includes("payment") ||
    text.includes("stripe") ||
    text.includes("checkout") ||
    text.includes("charge") ||
    text.includes("billing") ||
    text.includes("card")
  ) {
    return "payment";
  }
  if (
    text.includes("database") ||
    text.includes("save") ||
    text.includes("persist") ||
    text.includes("store") ||
    text.includes("data") ||
    text.includes("record") ||
    text.includes("not saving") ||
    text.includes("disappear") ||
    text.includes("lost")
  ) {
    return "data";
  }
  if (
    text.includes("email") ||
    text.includes("sendgrid") ||
    text.includes("smtp") ||
    text.includes("notification") ||
    text.includes("mailgun")
  ) {
    return "email";
  }
  if (
    text.includes("api") ||
    text.includes("endpoint") ||
    text.includes("fetch") ||
    text.includes("request") ||
    text.includes("cors") ||
    text.includes("500") ||
    text.includes("404")
  ) {
    return "api";
  }
  if (
    text.includes("button") ||
    text.includes("click") ||
    text.includes("nothing happens") ||
    text.includes("no response") ||
    text.includes("doesn't work") ||
    text.includes("not working")
  ) {
    return "ui_wiring";
  }
  if (
    text.includes("vague") ||
    text.includes("didn't understand") ||
    text.includes("wrong") ||
    text.includes("different") ||
    text.includes("not what i wanted")
  ) {
    return "vague_prompt";
  }
  return "generic";
}

function buildDiagnosis(
  pattern: string,
  intent: string,
  behavior: string,
  logs: string
): DiagnosisResult {
  const hasLogs = logs.trim().length > 0;

  switch (pattern) {
    case "auth":
      return {
        rootCause:
          "The authentication flow was generated without a persistent session mechanism. The AI likely scaffolded login UI but skipped server-side session management or JWT validation.",
        whyItHappened:
          "AI builders often generate the visual login form and client-side state correctly, but miss the critical backend pieces: setting secure cookies, validating tokens on protected routes, and handling token refresh. Without these, users appear to log in but the session evaporates on the next request.",
        suggestedFix: [
          "Check if a session cookie or JWT is actually being set after login (use DevTools → Application → Cookies)",
          "Verify your auth callback route is persisting the session — look for a `/api/auth/session` or similar endpoint",
          "If using NextAuth or Supabase Auth, make sure the provider is initialized in your root layout and the session provider wraps your app",
          "Add middleware to protect routes: check for a valid session token before serving authenticated pages",
        ],
        improvedPrompt: `Build a full-stack ${intent} app with complete authentication. Include: (1) a login/signup form, (2) server-side session management using [NextAuth / Supabase Auth / JWT cookies], (3) a middleware file that redirects unauthenticated users to /login, (4) protected API routes that return 401 if no valid session exists, and (5) a logout button that destroys the session server-side.`,
        confidence: hasLogs ? "High" : "Medium",
        confidenceReason: hasLogs
          ? "Log output confirms auth-related errors (401/403 or token issues)"
          : "Strong keyword match on auth/session patterns; would be High with error logs",
      };

    case "payment":
      return {
        rootCause:
          "The payment integration is missing a server-side step. Stripe (and most payment processors) require a backend to create a PaymentIntent or checkout session — the AI likely only generated frontend charge code.",
        whyItHappened:
          "AI builders frequently generate Stripe's client-side code correctly but skip the mandatory server-side PaymentIntent creation. Stripe's security model requires secret key operations to happen on the server. Running them in the browser either silently fails or exposes your secret key.",
        suggestedFix: [
          "Create a `/api/checkout` route that creates a Stripe PaymentIntent server-side using your secret key",
          "Pass only the `clientSecret` returned from that route to your frontend Stripe.js Elements component",
          "Verify your Stripe secret key is in `.env` (never hardcoded) and your publishable key is used on the client",
          "Enable Stripe webhook handling for post-payment fulfillment — don't fulfill orders based on client-side success alone",
          "Test with Stripe's test card: `4242 4242 4242 4242`, any future expiry, any CVV",
        ],
        improvedPrompt: `Build a checkout flow for ${intent}. Use Stripe. Requirements: (1) a server-side API route that creates a PaymentIntent using the Stripe secret key from environment variables, (2) a client-side form using Stripe Elements that collects card details and confirms the PaymentIntent with the clientSecret, (3) a webhook handler at /api/webhooks/stripe that verifies the Stripe signature and fulfills orders on payment_intent.succeeded events, (4) never expose the secret key to the client.`,
        confidence: hasLogs ? "High" : "High",
        confidenceReason:
          "Payment failure patterns are highly consistent — almost always a missing backend PaymentIntent or misplaced secret key",
      };

    case "data":
      return {
        rootCause:
          "Data is being stored in client-side state (React state or localStorage) instead of a real database. When the page refreshes or the component unmounts, everything disappears.",
        whyItHappened:
          "AI builders often scaffold a working UI with useState or useReducer, which looks correct during a session. But without a database write on every mutation, nothing actually persists. The AI may have generated a mock data layer that was never wired to a real backend.",
        suggestedFix: [
          "Identify where your data mutations happen (form submits, button clicks) and add a fetch/POST call to a backend API route",
          "Create API routes (e.g. `/api/records`) that read and write to a real database (Supabase, PlanetScale, SQLite)",
          "Replace any mock arrays or useState with server-fetched data via async server components or SWR/React Query",
          "Check your database connection string — many AI-generated apps have a placeholder like `DATABASE_URL=your-db-url-here`",
        ],
        improvedPrompt: `Build ${intent} with real data persistence. Use Supabase (or Postgres). Requirements: (1) a database schema with the required tables, (2) server-side API routes for all CRUD operations, (3) client components that call those APIs on every state change — never store business data only in React state, (4) data should survive a full page refresh.`,
        confidence: "High",
        confidenceReason:
          "Data loss on refresh is almost always client-only state — one of the most common AI builder failure modes",
      };

    case "email":
      return {
        rootCause:
          "Email sending requires a server-side API call with authenticated credentials. The AI likely generated frontend code that tries to send email directly, or generated a backend route with missing/incorrect SMTP configuration.",
        whyItHappened:
          "Email APIs (SendGrid, Resend, Postmark) require secret API keys that can only be used server-side. If the AI generated client-side email code, it will always fail. Even if server-side, the from-address often needs to be a verified sender domain.",
        suggestedFix: [
          "Move all email logic into a server-side API route — never call email APIs from the browser",
          "Verify your API key is correct and set in environment variables (not hardcoded)",
          "Check that your sender domain or from-address is verified in your email provider's dashboard",
          "For transactional email, use Resend (resend.com) — it's the simplest integration with Next.js",
          "Test with your own email first before using dynamic recipient addresses",
        ],
        improvedPrompt: `Add email functionality to ${intent}. Use Resend (or SendGrid). Requirements: (1) an API route at /api/send-email that accepts POST requests with recipient and content, (2) the email API key loaded from environment variables only, (3) a verified sender address, (4) error handling that returns meaningful status codes, (5) the client only calls this API route — no email SDK imports on the client side.`,
        confidence: "Medium",
        confidenceReason:
          "Email failures have multiple causes; would need logs to confirm whether it's auth, domain verification, or a code issue",
      };

    case "api":
      return {
        rootCause:
          "An API route is failing — either a 404 (route doesn't exist or wrong path), 500 (server error in the handler), or CORS error (calling a different origin without proper headers).",
        whyItHappened:
          "AI builders often generate API routes with subtle path mismatches, missing error handling, or unhandled promise rejections that crash the handler silently. CORS issues appear when the frontend and backend are on different ports or domains and no CORS headers are configured.",
        suggestedFix: [
          hasLogs && logs.includes("CORS")
            ? "Add CORS headers to your API route: `res.setHeader('Access-Control-Allow-Origin', '*')` or configure allowed origins"
            : "Open the Network tab in DevTools and check the exact URL being called — verify it matches your route file path",
          "Wrap your API handler in try/catch and log errors: `console.error(err)` before returning a 500",
          "Check for unhandled async errors — missing `await` on database calls is a common silent failure",
          "Verify environment variables are set — API routes that use undefined env vars often fail silently",
        ],
        improvedPrompt: `Fix the API layer for ${intent}. Requirements: (1) all API routes have try/catch with descriptive error responses, (2) route paths match exactly what the client is calling, (3) async operations are properly awaited, (4) environment variables are validated at startup, (5) CORS is configured if the client is on a different origin.`,
        confidence: hasLogs ? "High" : "Medium",
        confidenceReason: hasLogs
          ? "Error codes in logs narrow this down precisely"
          : "Multiple possible API failure causes — logs would confirm",
      };

    case "ui_wiring":
      return {
        rootCause:
          "The UI elements were generated without functional event handlers. Buttons, forms, or interactive components are rendered correctly but have no logic connected to them — onClick/onSubmit handlers either don't exist or reference functions that were never implemented.",
        whyItHappened:
          "This is one of the most common AI builder failure modes: the AI generates a visually complete interface and scaffolds handler names, but doesn't implement the actual logic inside them. You get a `handleSubmit` function that does nothing, or a button with no onClick at all.",
        suggestedFix: [
          "Inspect the component file — check that onClick/onSubmit handlers are actually defined and contain logic, not just empty functions",
          "Search for TODO comments or empty function bodies: `() => {}` or `// TODO: implement`",
          "Trace the data flow: form submission → handler → API call → state update → UI re-render. Find where the chain breaks",
          "Add `console.log` at the start of each handler to confirm they're being called at all",
        ],
        improvedPrompt: `Build ${intent} with fully functional interactions. For every button and form: (1) define the event handler with complete implementation (not placeholder), (2) connect it to the relevant API route, (3) update UI state based on the response, (4) show loading and error states. Do not generate empty handler functions.`,
        confidence: "Medium",
        confidenceReason:
          "UI wiring issues require code inspection to confirm — description matches the pattern but logs would help",
      };

    default:
      return {
        rootCause:
          "The prompt given to the AI builder was likely underspecified, causing the generated app to make incorrect assumptions about data flow, state management, or backend requirements.",
        whyItHappened:
          "AI builders fill in gaps in your prompt with generic patterns that may not match your actual requirements. The more specific your intent, the less guessing the AI does. Vague prompts like 'build a dashboard' leave critical decisions (how data is fetched, what actions are available, who can access what) undefined.",
        suggestedFix: [
          "Identify the specific behavior that's wrong and describe it exactly — not 'it doesn't work' but 'when I click X, Y happens instead of Z'",
          "Re-prompt with explicit technical requirements: list your data model, the user actions you need, and the expected outcome of each",
          "Break the app into smaller pieces and build/verify each one before combining",
          "If the AI built something structurally wrong, it's often faster to delete and re-prompt than to patch",
        ],
        improvedPrompt: `Rebuild ${intent} with these explicit requirements: (1) describe your exact data model with field names and types, (2) list every user action and what it should do, (3) specify the tech stack (Next.js App Router, Supabase, Tailwind), (4) describe error states and edge cases, (5) include authentication requirements if any.`,
        confidence: "Low",
        confidenceReason:
          "Insufficient context to identify a specific failure pattern — more detail in the logs or behavior description would improve accuracy",
      };
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { intent, behavior, logs } = body as {
    intent: string;
    behavior: string;
    logs: string;
  };

  if (!intent?.trim() || !behavior?.trim()) {
    return NextResponse.json(
      { error: "Intent and behavior are required" },
      { status: 400 }
    );
  }

  const pattern = detectPattern(intent, behavior, logs || "");
  const diagnosis = buildDiagnosis(pattern, intent, behavior, logs || "");

  return NextResponse.json(diagnosis);
}
