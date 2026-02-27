import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import { crm } from "./crm-routes.tsx";
import { sheets } from "./sheets-routes.tsx";
import { gcal } from "./google-calendar-routes.tsx";
import { gtasks } from "./google-tasks-routes.tsx";
import * as kv from "./kv_store.tsx";

const app = new Hono();

const supabase = () =>
  createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

// Enable logger
app.use("*", logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  })
);

const PREFIX = "/make-server-b0da2601";

/* ── Idempotent bucket creation for avatars ── */
const AVATAR_BUCKET = "make-b0da2601-avatars";
(async () => {
  try {
    const db = supabase();
    const { data: buckets } = await db.storage.listBuckets();
    const bucketExists = buckets?.some((bucket: any) => bucket.name === AVATAR_BUCKET);
    if (!bucketExists) {
      await db.storage.createBucket(AVATAR_BUCKET, { public: false });
      console.log(`Created storage bucket: ${AVATAR_BUCKET}`);
    }
  } catch (err) {
    console.log("Error creating avatar bucket (non-fatal):", err);
  }
})();

// Health check endpoint
app.get(`${PREFIX}/health`, (c) => {
  return c.json({ status: "ok" });
});

// ────────────────────────────────────
//  AUTH — Signup (admin creates user)
// ────────────────────────────────────

app.post(`${PREFIX}/signup`, async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    if (!email || !password) {
      return c.json({ error: "Email and password are required for signup." }, 400);
    }

    const db = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data, error } = await db.auth.admin.createUser({
      email,
      password,
      user_metadata: { name: name || email.split("@")[0] },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true,
    });

    if (error) {
      console.log("Error creating user during signup:", error);
      return c.json({ error: `Signup error: ${error.message}` }, 400);
    }

    return c.json({ data: { user: data.user } }, 201);
  } catch (err) {
    console.log("Unexpected error during signup:", err);
    return c.json({ error: `Unexpected signup error: ${err}` }, 500);
  }
});

// ────────────────────────────────────
//  AUTH — Get current user (verify token)
// ────────────────────────────────────

app.get(`${PREFIX}/me`, async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    if (!accessToken) {
      return c.json({ error: "Authorization header missing" }, 401);
    }

    const db = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: { user }, error } = await db.auth.getUser(accessToken);
    if (error || !user) {
      console.log("Auth verification error:", error);
      return c.json({ error: `Unauthorized: ${error?.message || "Invalid token"}` }, 401);
    }

    return c.json({ data: { user } });
  } catch (err) {
    console.log("Unexpected error verifying user:", err);
    return c.json({ error: `Unexpected error: ${err}` }, 500);
  }
});

// ────────────────────────────────────
//  TEAM — Upload user avatar
// ────────────────────────────────────

app.post(`${PREFIX}/team/members/:userId/avatar`, async (c) => {
  try {
    const userId = c.req.param("userId");
    const db = supabase();

    // Parse multipart form data
    const formData = await c.req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return c.json({ error: "No file uploaded" }, 400);
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return c.json({ error: `Invalid file type: ${file.type}. Allowed: ${allowedTypes.join(", ")}` }, 400);
    }

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      return c.json({ error: "File too large. Max 5MB." }, 400);
    }

    const ext = file.name.split(".").pop() || "jpg";
    const filePath = `${userId}/avatar-${Date.now()}.${ext}`;

    // Delete old avatar files for this user
    try {
      const { data: existing } = await db.storage.from(AVATAR_BUCKET).list(userId);
      if (existing && existing.length > 0) {
        const paths = existing.map((f: any) => `${userId}/${f.name}`);
        await db.storage.from(AVATAR_BUCKET).remove(paths);
      }
    } catch (err) {
      console.log("Warning: could not clean old avatars:", err);
    }

    // Upload new file
    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await db.storage
      .from(AVATAR_BUCKET)
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.log("Error uploading avatar to storage:", uploadError);
      return c.json({ error: `Upload error: ${uploadError.message}` }, 500);
    }

    // Create a signed URL (valid for 10 years = effectively permanent)
    const { data: signedData, error: signedError } = await db.storage
      .from(AVATAR_BUCKET)
      .createSignedUrl(filePath, 60 * 60 * 24 * 365 * 10);

    if (signedError || !signedData?.signedUrl) {
      console.log("Error creating signed URL:", signedError);
      return c.json({ error: `Signed URL error: ${signedError?.message || "unknown"}` }, 500);
    }

    const avatarUrl = signedData.signedUrl;

    // Update user_metadata with the new avatar_url
    const { error: updateError } = await db.auth.admin.updateUserById(userId, {
      user_metadata: { avatar_url: avatarUrl },
    });

    if (updateError) {
      console.log("Error updating user avatar_url in metadata:", updateError);
      return c.json({ error: `Error updating user metadata: ${updateError.message}` }, 500);
    }

    return c.json({ data: { avatarUrl } });
  } catch (err) {
    console.log("Unexpected error uploading avatar:", err);
    return c.json({ error: `Unexpected error uploading avatar: ${err}` }, 500);
  }
});

// ────────────────────────────────────
//  TEAM — List team members from auth.users
// ────────────────────────────────────

app.get(`${PREFIX}/team/members`, async (c) => {
  try {
    const db = supabase();
    const { data: { users }, error } = await db.auth.admin.listUsers({ perPage: 200 });

    if (error) {
      console.log("Error listing team members from auth.users:", error);
      return c.json({ error: `Error listing team members: ${error.message}` }, 500);
    }

    // Filter to @htz.agency users and map to a clean shape
    const members = (users ?? [])
      .filter((u: any) => u.email?.endsWith("@htz.agency"))
      .map((u: any) => ({
        id: u.id,
        email: u.email,
        name: u.user_metadata?.name || u.user_metadata?.full_name || u.email?.split("@")[0] || "",
        avatar_url: u.user_metadata?.avatar_url || u.user_metadata?.picture || null,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        email_confirmed_at: u.email_confirmed_at,
        phone: u.phone || null,
      }));

    return c.json({ data: members });
  } catch (err) {
    console.log("Unexpected error listing team members:", err);
    return c.json({ error: `Unexpected error listing team members: ${err}` }, 500);
  }
});

// ────────────────────────────────────
//  TEAM — Get/Set user role (kv_store)
// ────────────────────────────────────

app.get(`${PREFIX}/team/members/:userId/role`, async (c) => {
  try {
    const userId = c.req.param("userId");
    const role = await kv.get(`user_role:${userId}`);
    return c.json({ data: { userId, role: role || "membro" } });
  } catch (err) {
    console.log("Error getting user role:", err);
    return c.json({ error: `Error getting user role: ${err}` }, 500);
  }
});

app.put(`${PREFIX}/team/members/:userId/role`, async (c) => {
  try {
    const userId = c.req.param("userId");
    const { role } = await c.req.json();
    if (!role) {
      return c.json({ error: "role is required" }, 400);
    }
    await kv.set(`user_role:${userId}`, role);
    return c.json({ data: { userId, role } });
  } catch (err) {
    console.log("Error setting user role:", err);
    return c.json({ error: `Error setting user role: ${err}` }, 500);
  }
});

// ────────────────────────────────────
//  PERMISSIONS — Role-based permissions matrix (kv_store)
// ────────────────────────────────────

app.get(`${PREFIX}/permissions`, async (c) => {
  try {
    const data = await kv.get("crm_permissions");
    return c.json({ data: data || null });
  } catch (err) {
    console.log("Error getting permissions:", err);
    return c.json({ error: `Error getting permissions: ${err}` }, 500);
  }
});

app.put(`${PREFIX}/permissions`, async (c) => {
  try {
    const body = await c.req.json();
    if (!body || typeof body !== "object") {
      return c.json({ error: "Invalid permissions payload" }, 400);
    }
    await kv.set("crm_permissions", body);
    return c.json({ data: body });
  } catch (err) {
    console.log("Error saving permissions:", err);
    return c.json({ error: `Error saving permissions: ${err}` }, 500);
  }
});

// ────────────────────────────────────
//  TEAMS — CRUD for CRM teams (kv_store)
// ────────────────────────────────────

app.get(`${PREFIX}/teams`, async (c) => {
  try {
    const raw = await kv.getByPrefix("crm_team:");
    const teams = (raw ?? []).map((r: any) => {
      try { return typeof r === "string" ? JSON.parse(r) : r; } catch { return r; }
    });
    return c.json({ data: teams });
  } catch (err) {
    console.log("Error listing teams:", err);
    return c.json({ error: `Error listing teams: ${err}` }, 500);
  }
});

app.get(`${PREFIX}/teams/:id`, async (c) => {
  try {
    const id = c.req.param("id");
    const raw = await kv.get(`crm_team:${id}`);
    if (!raw) return c.json({ error: "Team not found" }, 404);
    const team = typeof raw === "string" ? JSON.parse(raw) : raw;
    return c.json({ data: team });
  } catch (err) {
    console.log("Error getting team:", err);
    return c.json({ error: `Error getting team: ${err}` }, 500);
  }
});

app.post(`${PREFIX}/teams`, async (c) => {
  try {
    const body = await c.req.json();
    if (!body?.name) return c.json({ error: "Team name is required" }, 400);
    const id = `TEAM-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const now = new Date().toISOString();
    const team = {
      id,
      name: body.name,
      description: body.description ?? "",
      color: body.color ?? "#4E6987",
      icon: body.icon ?? "UsersThree",
      members: body.members ?? [],
      leaderId: body.leaderId ?? null,
      createdAt: now,
      updatedAt: now,
    };
    await kv.set(`crm_team:${id}`, team);
    return c.json({ data: team }, 201);
  } catch (err) {
    console.log("Error creating team:", err);
    return c.json({ error: `Error creating team: ${err}` }, 500);
  }
});

app.put(`${PREFIX}/teams/:id`, async (c) => {
  try {
    const id = c.req.param("id");
    const existing = await kv.get(`crm_team:${id}`);
    if (!existing) return c.json({ error: "Team not found" }, 404);
    const old = typeof existing === "string" ? JSON.parse(existing) : existing;
    const body = await c.req.json();
    const updated = {
      ...old,
      ...body,
      id, // preserve id
      updatedAt: new Date().toISOString(),
    };
    await kv.set(`crm_team:${id}`, updated);
    return c.json({ data: updated });
  } catch (err) {
    console.log("Error updating team:", err);
    return c.json({ error: `Error updating team: ${err}` }, 500);
  }
});

app.delete(`${PREFIX}/teams/:id`, async (c) => {
  try {
    const id = c.req.param("id");
    await kv.del(`crm_team:${id}`);
    return c.json({ data: { deleted: true } });
  } catch (err) {
    console.log("Error deleting team:", err);
    return c.json({ error: `Error deleting team: ${err}` }, 500);
  }
});

// ────────────────────────────────────
//  PROPOSALS — Read-only routes for CRM
//  (Full CRUD lives in Zenite Price at price.htz.agency)
// ────────────────────────────────────

// List all proposals (with services) — used by CRM ProposalPicker
app.get(`${PREFIX}/proposals`, async (c) => {
  try {
    const db = supabase();
    const { data, error } = await db
      .from("price_proposals")
      .select("*, price_proposal_services(*)")
      .order("created_at", { ascending: false });

    if (error) {
      console.log("Error listing proposals:", error);
      return c.json({ error: `Error listing proposals: ${error.message}` }, 500);
    }

    return c.json({ data: data ?? [] });
  } catch (err) {
    console.log("Unexpected error listing proposals:", err);
    return c.json({ error: `Unexpected error: ${err}` }, 500);
  }
});

// Get proposals linked to a specific CRM entity (MUST be before :id route)
// Query params: accountId, opportunityId, contactId (any combo)
app.get(`${PREFIX}/proposals/by-crm`, async (c) => {
  try {
    const accountId = c.req.query("accountId");
    const opportunityId = c.req.query("opportunityId");
    const contactId = c.req.query("contactId");

    if (!accountId && !opportunityId && !contactId) {
      return c.json({ data: [] });
    }

    const db = supabase();
    let query = db.from("price_proposals").select("*, price_proposal_services(*)");

    // Build OR filter for any matching column
    const orFilters: string[] = [];
    if (accountId) orFilters.push(`account.eq.${accountId}`);
    if (opportunityId) orFilters.push(`opportunity.eq.${opportunityId}`);
    if (contactId) orFilters.push(`contact.eq.${contactId}`);

    query = query.or(orFilters.join(","));
    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.log("Error fetching proposals by CRM entity:", error);
      return c.json({ error: `Error: ${error.message}` }, 500);
    }

    return c.json({ data: data ?? [] });
  } catch (err) {
    console.log("Error fetching proposals by CRM entity:", err);
    return c.json({ error: `Error: ${err}` }, 500);
  }
});

// Get single proposal by ID
app.get(`${PREFIX}/proposals/:id`, async (c) => {
  try {
    const id = c.req.param("id");
    const db = supabase();

    const { data, error } = await db
      .from("price_proposals")
      .select("*, price_proposal_services(*)")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.log(`Error fetching proposal ${id}:`, error);
      return c.json({ error: `Error fetching proposal: ${error.message}` }, 500);
    }

    if (!data) {
      return c.json({ error: `Proposal ${id} not found` }, 404);
    }

    return c.json({ data });
  } catch (err) {
    console.log("Unexpected error fetching proposal:", err);
    return c.json({ error: `Unexpected error: ${err}` }, 500);
  }
});

// ────────────────────────────────────
//  PROPOSAL CRM LINKS (price_proposals columns: account, opportunity, contact)
//  Kept for CRM ↔ Price link management
// ────────────────────────────────────

// Get CRM links for a proposal
app.get(`${PREFIX}/proposals/:id/crm-links`, async (c) => {
  try {
    const id = c.req.param("id");
    const db = supabase();

    const { data: proposal, error } = await db
      .from("price_proposals")
      .select("account, opportunity, contact")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.log("Error fetching proposal CRM links:", error);
      return c.json({ error: `Error: ${error.message}` }, 500);
    }
    if (!proposal) {
      return c.json({ data: {} });
    }

    const result: Record<string, any> = {};

    // Resolve account name
    if (proposal.account) {
      result.accountId = proposal.account;
      const { data: acc } = await db
        .from("crm_accounts")
        .select("name")
        .eq("id", proposal.account)
        .maybeSingle();
      result.accountName = acc?.name ?? "";
    }

    // Resolve contact name
    if (proposal.contact) {
      result.contactId = proposal.contact;
      const { data: ct } = await db
        .from("crm_contacts")
        .select("name, last_name")
        .eq("id", proposal.contact)
        .maybeSingle();
      result.contactName = ct ? `${ct.name ?? ""} ${ct.last_name ?? ""}`.trim() : "";
    }

    // Resolve opportunity name
    if (proposal.opportunity) {
      result.opportunityId = proposal.opportunity;
      const { data: op } = await db
        .from("crm_opportunities")
        .select("name")
        .eq("id", proposal.opportunity)
        .maybeSingle();
      result.opportunityName = op?.name ?? "";
    }

    return c.json({ data: result });
  } catch (err) {
    console.log("Error fetching proposal CRM links:", err);
    return c.json({ error: `Error: ${err}` }, 500);
  }
});

// Save CRM links for a proposal
app.put(`${PREFIX}/proposals/:id/crm-links`, async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const db = supabase();

    const updatePayload: Record<string, any> = {
      account: body.accountId || null,
      contact: body.contactId || null,
      opportunity: body.opportunityId || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await db
      .from("price_proposals")
      .update(updatePayload)
      .eq("id", id);

    if (error) {
      console.log("Error saving proposal CRM links:", error);
      return c.json({ error: `Error: ${error.message}` }, 500);
    }

    return c.json({ data: body });
  } catch (err) {
    console.log("Error saving proposal CRM links:", err);
    return c.json({ error: `Error: ${err}` }, 500);
  }
});

// ────────────────────────────────────
//  SERVICES — Read-only for CRM TabServices catalog
//  (Service CRUD/seeding lives in Zenite Price)
// ────────────────────────────────────

app.get(`${PREFIX}/services`, async (c) => {
  try {
    const db = supabase();
    const { data, error } = await db
      .from("price_services")
      .select("*")
      .order("service_group")
      .order("name");

    if (error) {
      console.log("Error listing services:", error);
      return c.json({ error: `Error listing services: ${error.message}` }, 500);
    }

    return c.json({ data: data ?? [] });
  } catch (err) {
    console.log("Unexpected error listing services:", err);
    return c.json({ error: `Unexpected error: ${err}` }, 500);
  }
});

// Mount CRM routes
app.route("/", crm);

// Mount Google Sheets routes
app.route("/", sheets);

// Mount Google Calendar / Meet routes
app.route("/", gcal);

// Mount Google Tasks routes
app.route("/", gtasks);

Deno.serve(app.fetch);