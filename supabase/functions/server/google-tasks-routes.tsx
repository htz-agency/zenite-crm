/**
 * Google Tasks integration routes.
 *
 * Uses the GOOGLE_SERVICE_ACCOUNT_KEY with domain-wide delegation
 * to impersonate the authenticated @htz.agency user and create
 * tasks in Google Tasks.
 */

import { Hono } from "npm:hono";

const PREFIX = "/make-server-b0da2601";
const gtasks = new Hono();

/* ── helpers ── */

function base64UrlEncode(data: string): string {
  return btoa(data).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

async function parseServiceAccountKey(): Promise<Record<string, any>> {
  let raw = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_KEY");
  if (!raw) throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY env var is not set");

  raw = raw.trim();

  if (
    (raw.startsWith('"') && raw.endsWith('"')) ||
    (raw.startsWith("'") && raw.endsWith("'"))
  ) {
    try {
      raw = JSON.parse(raw);
    } catch {
      raw = raw.slice(1, -1);
    }
  }

  try {
    const parsed = JSON.parse(raw!);
    if (!parsed.client_email || !parsed.private_key) {
      throw new Error("Parsed SA key is missing client_email or private_key");
    }
    return parsed;
  } catch (e) {
    throw new Error(`Cannot parse GOOGLE_SERVICE_ACCOUNT_KEY: ${e}`);
  }
}

async function getGoogleTasksToken(
  userEmail: string
): Promise<{ token: string; impersonated: boolean }> {
  const sa = await parseServiceAccountKey();

  const header = base64UrlEncode(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);

  const attempts = [
    { sub: userEmail, label: "with impersonation" },
    { sub: undefined, label: "without impersonation (SA own identity)" },
  ];

  for (const attempt of attempts) {
    const claimSet: Record<string, any> = {
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/tasks",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    };
    if (attempt.sub) {
      claimSet.sub = attempt.sub;
    }

    const payload = base64UrlEncode(JSON.stringify(claimSet));
    const unsignedToken = `${header}.${payload}`;

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
      console.log(`Google Tasks token obtained ${attempt.label}`);
      return { token: data.access_token, impersonated: !!attempt.sub };
    }

    console.log(
      `Tasks token attempt failed ${attempt.label}:`,
      JSON.stringify(data)
    );
    if (!attempt.sub) {
      throw new Error(
        `Failed to obtain Google Tasks access token: ${JSON.stringify(data)}`
      );
    }
    console.log("Falling back to SA own identity (no impersonation)...");
  }

  throw new Error("Unreachable");
}

/* ── POST /google-tasks/create ── */

gtasks.post(`${PREFIX}/google-tasks/create`, async (c) => {
  try {
    const authHeader = c.req.header("Authorization")?.split(" ")[1];
    if (!authHeader) {
      return c.json({ error: "Authorization header missing" }, 401);
    }

    const { title, notes, dueDate, userEmail } = await c.req.json();

    if (!userEmail || typeof userEmail !== "string") {
      return c.json(
        { error: "userEmail is required in the request body" },
        400
      );
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

    if (!title) {
      return c.json({ error: "title is required" }, 400);
    }

    // Get Google access token via service account impersonation
    const { token: googleToken } = await getGoogleTasksToken(userEmail);

    // Build task body per Google Tasks API
    const taskBody: Record<string, any> = {
      title,
      status: "needsAction",
    };

    if (notes) {
      taskBody.notes = notes;
    }

    // Google Tasks API expects due date in RFC 3339 format
    if (dueDate) {
      taskBody.due = `${dueDate}T00:00:00.000Z`;
    }

    // Create task in the user's default task list (@default)
    const taskRes = await fetch(
      "https://tasks.googleapis.com/tasks/v1/lists/@default/tasks",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${googleToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(taskBody),
      }
    );

    const taskData = await taskRes.json();

    if (!taskRes.ok) {
      console.log(
        "Google Tasks API error:",
        taskRes.status,
        JSON.stringify(taskData)
      );
      return c.json(
        {
          error: `Google Tasks error: ${
            taskData.error?.message ||
            JSON.stringify(taskData.error || taskData)
          }`,
        },
        taskRes.status >= 400 && taskRes.status < 500 ? taskRes.status : 500
      );
    }

    console.log("Google Task created successfully:", taskData.id);

    return c.json({
      data: {
        taskId: taskData.id,
        title: taskData.title,
        status: taskData.status,
        selfLink: taskData.selfLink,
      },
    });
  } catch (err) {
    console.log("Error creating Google Task:", err);
    return c.json(
      { error: `Error creating Google Task: ${String(err)}` },
      500
    );
  }
});

export { gtasks };
