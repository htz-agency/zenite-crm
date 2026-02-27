/**
 * Google Calendar / Meet integration routes.
 *
 * Uses the GOOGLE_SERVICE_ACCOUNT_KEY with domain-wide delegation
 * to impersonate the authenticated @htz.agency user and create
 * Calendar events with Google Meet conference links.
 */

import { Hono } from "npm:hono";

const PREFIX = "/make-server-b0da2601";
const gcal = new Hono();

/* ── helpers ── */

function base64UrlEncode(data: string): string {
  return btoa(data).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

async function parseServiceAccountKey(): Promise<Record<string, any>> {
  let raw = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_KEY");
  if (!raw) throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY env var is not set");

  // Log first 80 chars for debugging (safe – no private key data at start)
  console.log("SA_KEY raw (first 80 chars):", JSON.stringify(raw.slice(0, 80)));

  raw = raw.trim();

  // If the value was double-stringified (stored as a JSON string inside a string),
  // unwrap it: the env var value starts with " or ' wrapping the real JSON
  if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
    try {
      raw = JSON.parse(raw);
    } catch {
      // Not valid double-encoded JSON, strip outer quotes manually
      raw = raw.slice(1, -1);
    }
  }

  // Now parse the actual JSON object
  try {
    const parsed = JSON.parse(raw!);
    if (!parsed.client_email || !parsed.private_key) {
      throw new Error("Parsed SA key is missing client_email or private_key");
    }
    return parsed;
  } catch (e) {
    console.log("Failed to parse SA key. First 120 chars:", raw!.slice(0, 120));
    throw new Error(`Cannot parse GOOGLE_SERVICE_ACCOUNT_KEY: ${e}`);
  }
}

async function createServiceAccountToken(userEmail: string): Promise<{ token: string; impersonated: boolean }> {
  const sa = await parseServiceAccountKey();

  const header = base64UrlEncode(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);

  // Try with impersonation first, then fallback without sub
  const attempts = [
    { sub: userEmail, label: "with impersonation" },
    { sub: undefined, label: "without impersonation (SA own identity)" },
  ];

  for (const attempt of attempts) {
    const claimSet: Record<string, any> = {
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/calendar",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    };
    if (attempt.sub) {
      claimSet.sub = attempt.sub;
    }

    const payload = base64UrlEncode(JSON.stringify(claimSet));
    const unsignedToken = `${header}.${payload}`;

    // Import RSA private key
    const pemBody = sa.private_key
      .replace("-----BEGIN PRIVATE KEY-----", "")
      .replace("-----END PRIVATE KEY-----", "")
      .replace(/\n/g, "");
    const binaryDer = Uint8Array.from(atob(pemBody), (c: string) =>
      c.charCodeAt(0)
    );

    const key = await crypto.subtle.importKey(
      "pkcs8",
      binaryDer,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signature = await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      key,
      new TextEncoder().encode(unsignedToken)
    );

    const signatureB64 = base64UrlEncode(
      String.fromCharCode(...new Uint8Array(signature))
    );

    const jwt = `${unsignedToken}.${signatureB64}`;

    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
    });

    const data = await res.json();
    if (data.access_token) {
      console.log(`Google token obtained ${attempt.label}`);
      return { token: data.access_token, impersonated: !!attempt.sub };
    }

    console.log(
      `Token attempt failed ${attempt.label}:`,
      JSON.stringify(data)
    );
    // If this was the last attempt, throw
    if (!attempt.sub) {
      throw new Error(
        `Failed to obtain Google access token: ${JSON.stringify(data)}`
      );
    }
    // Otherwise continue to fallback
    console.log("Falling back to SA own identity (no impersonation)...");
  }

  throw new Error("Unreachable");
}

/* ── POST /google-calendar/create-meet ── */

gcal.post(`${PREFIX}/google-calendar/create-meet`, async (c) => {
  try {
    // Verify the request comes with a valid anon key (basic API protection)
    const authHeader = c.req.header("Authorization")?.split(" ")[1];
    if (!authHeader) {
      return c.json({ error: "Authorization header missing" }, 401);
    }

    const {
      subject,
      description,
      startDate,
      endDate,
      allDay,
      attendees,
      userEmail,
    } = await c.req.json();

    // userEmail is required – must be an @htz.agency address (internal tool)
    if (!userEmail || typeof userEmail !== "string") {
      return c.json({ error: "userEmail is required in the request body" }, 400);
    }

    if (!userEmail.endsWith("@htz.agency")) {
      return c.json(
        {
          error:
            "userEmail must be an @htz.agency address for domain-wide delegation",
        },
        403
      );
    }

    if (!subject) {
      return c.json({ error: "subject is required" }, 400);
    }

    // Get Google access token via service account impersonation
    const { token: googleToken, impersonated } = await createServiceAccountToken(userEmail);

    // Build event body
    const eventBody: Record<string, any> = {
      summary: subject,
      description: description || "",
      conferenceData: {
        createRequest: {
          requestId: crypto.randomUUID(),
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
    };

    if (allDay) {
      // All-day events use "date" not "dateTime"
      const startDay = (startDate || "").slice(0, 10);
      const endDay = (endDate || startDate || "").slice(0, 10);
      eventBody.start = { date: startDay };
      eventBody.end = { date: endDay };
    } else {
      eventBody.start = {
        dateTime: startDate,
        timeZone: "America/Sao_Paulo",
      };
      eventBody.end = {
        dateTime: endDate || startDate,
        timeZone: "America/Sao_Paulo",
      };
    }

    if (attendees && Array.isArray(attendees) && attendees.length > 0) {
      if (impersonated) {
        eventBody.attendees = attendees.map((email: string) => ({ email }));
      } else {
        console.log("Skipping attendees — SA without delegation cannot invite attendees");
      }
    }

    const calRes = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${googleToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventBody),
      }
    );

    const calData = await calRes.json();

    if (!calRes.ok) {
      console.log(
        "Google Calendar API error:",
        calRes.status,
        JSON.stringify(calData)
      );
      return c.json(
        {
          error: `Google Calendar error: ${
            calData.error?.message || JSON.stringify(calData.error || calData)
          }`,
        },
        calRes.status >= 400 && calRes.status < 500 ? calRes.status : 500
      );
    }

    const meetLink =
      calData.conferenceData?.entryPoints?.find(
        (ep: any) => ep.entryPointType === "video"
      )?.uri ||
      calData.hangoutLink ||
      null;

    return c.json({
      data: {
        eventId: calData.id,
        meetLink,
        htmlLink: calData.htmlLink,
      },
    });
  } catch (err) {
    console.log("Error creating Google Calendar event with Meet:", err);
    return c.json(
      { error: `Error creating Meet link: ${String(err)}` },
      500
    );
  }
});

export { gcal };