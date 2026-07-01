import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// CleverReach REST API v3 — Newsletter-Anmeldung mit DSGVO-Double-Opt-in.
// Flow (verifiziert gegen rest.cleverreach.com):
//   1) OAuth-Token (client_credentials, Basic-Auth)
//   2) Empfänger INAKTIV in Gruppe anlegen (activated:0)
//   3) Double-Opt-in-Mail über das Formular auslösen
// Env (Netlify Production): CLEVERREACH_CLIENT_ID, CLEVERREACH_CLIENT_SECRET,
//   CLEVERREACH_GROUP_ID, CLEVERREACH_FORM_ID
const CR_BASE = "https://rest.cleverreach.com";

// Einfaches Best-Effort-Rate-Limit (pro warmer Function-Instanz), damit niemand
// über den Endpoint fremde Adressen mit Bestätigungsmails bombardiert.
const RL_WINDOW_MS = 60_000;
const RL_MAX = 5;
const rlHits = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const arr = (rlHits.get(ip) ?? []).filter((t) => now - t < RL_WINDOW_MS);
  arr.push(now);
  rlHits.set(ip, arr);
  if (rlHits.size > 5000) rlHits.delete(rlHits.keys().next().value as string);
  return arr.length > RL_MAX;
}

function isValidEmail(e: unknown): e is string {
  return typeof e === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

export async function POST(req: Request) {
  try {
    const ip = (
      req.headers.get("x-nf-client-connection-ip") ||
      req.headers.get("x-forwarded-for") ||
      "unknown"
    ).split(",")[0].trim();
    if (rateLimited(ip)) {
      return NextResponse.json({ error: "Zu viele Versuche. Bitte in einer Minute erneut probieren." }, { status: 429 });
    }

    const { email, consent } = (await req.json()) as { email?: string; consent?: boolean };
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Bitte eine gültige E-Mail-Adresse angeben." }, { status: 400 });
    }
    if (!consent) {
      return NextResponse.json({ error: "Bitte der Datenschutzerklärung zustimmen." }, { status: 400 });
    }

    const clientId = process.env.CLEVERREACH_CLIENT_ID;
    const clientSecret = process.env.CLEVERREACH_CLIENT_SECRET;
    const groupId = process.env.CLEVERREACH_GROUP_ID;
    const formId = process.env.CLEVERREACH_FORM_ID;
    if (!clientId || !clientSecret || !groupId || !formId) {
      console.error("[/api/newsletter] CleverReach-Env unvollständig");
      return NextResponse.json({ error: "Newsletter ist gerade nicht verfügbar." }, { status: 503 });
    }

    // 1) OAuth-Token
    const tokenRes = await fetch(`${CR_BASE}/oauth/token.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
      },
      body: JSON.stringify({ grant_type: "client_credentials" }),
    });
    if (!tokenRes.ok) throw new Error(`oauth ${tokenRes.status}`);
    const token = (await tokenRes.json())?.access_token;
    if (!token) throw new Error("kein access_token");

    // DSGVO-Nachweis-Metadaten
    const doidata = {
      user_ip: ip === "unknown" ? "" : ip,
      referer: req.headers.get("referer") || "https://www.finanzleser.de/",
      user_agent: req.headers.get("user-agent") || "",
    };

    // 2) Empfänger inaktiv anlegen (Double-Opt-in)
    const recRes = await fetch(`${CR_BASE}/v3/groups.json/${groupId}/receivers`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        email,
        registered: Math.floor(Date.now() / 1000),
        activated: 0,
        source: "finanzleser.de Newsletter",
      }),
    });
    // 409 = existiert bereits → trotzdem DOI-Mail schicken (erneute Bestätigung möglich)
    if (!recRes.ok && recRes.status !== 409) {
      throw new Error(`receiver ${recRes.status}: ${(await recRes.text().catch(() => "")).slice(0, 200)}`);
    }

    // 3) Double-Opt-in-Mail auslösen
    const doiRes = await fetch(`${CR_BASE}/v3/forms.json/${formId}/send/activate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ email, doidata }),
    });
    if (!doiRes.ok) {
      throw new Error(`doi ${doiRes.status}: ${(await doiRes.text().catch(() => "")).slice(0, 200)}`);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[/api/newsletter]", e instanceof Error ? e.message : String(e));
    return NextResponse.json({ error: "Anmeldung fehlgeschlagen. Bitte später erneut versuchen." }, { status: 500 });
  }
}
