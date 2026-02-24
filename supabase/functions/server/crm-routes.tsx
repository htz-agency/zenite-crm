/**
 * CRM Server Routes — CRUD for Leads, Opportunities, Contacts, Accounts,
 * Activities, Call Records, Field History, Opportunity Services & Proposals.
 *
 * All routes prefixed with /make-server-b0da2601/crm
 */

import { Hono } from "npm:hono";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import * as kv from "./kv_store.tsx";

const crm = new Hono();

const supabase = () =>
  createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

const PREFIX = "/make-server-b0da2601/crm";

/* ================================================================== */
/*  Startup: drop incorrect FK on crm_leads.company (it's plain text) */
/* ================================================================== */

(async () => {
  try {
    const dbUrl = Deno.env.get("SUPABASE_DB_URL");
    if (!dbUrl) {
      console.log("SUPABASE_DB_URL not set — skipping FK cleanup");
      return;
    }
    const postgres = (await import("npm:postgres")).default;
    const sql = postgres(dbUrl, { max: 1 });
    await sql`ALTER TABLE crm_leads DROP CONSTRAINT IF EXISTS crm_leads_company_fkey`;
    console.log("Dropped crm_leads_company_fkey (company is plain text on leads)");
    await sql.end();
  } catch (err) {
    console.log("Non-critical: failed to drop crm_leads_company_fkey:", err);
  }
})();

/* ================================================================== */
/*  ID Generator — XX-XXXX (4 uppercase alphanumeric chars)            */
/* ================================================================== */

const ID_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";

function generateCrmId(prefix: string): string {
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += ID_CHARS[Math.floor(Math.random() * ID_CHARS.length)];
  }
  return `${prefix}-${code}`;
}

/* ================================================================== */
/*  Helper: generic list / get / create / update / delete              */
/* ================================================================== */

function registerCrud(
  table: string,
  route: string,
  opts?: {
    orderBy?: string;
    orderAsc?: boolean;
    select?: string;
    defaultValues?: Record<string, unknown>;
    idPrefix?: string;
  },
) {
  const { orderBy = "created_at", orderAsc = false, select = "*", defaultValues = {}, idPrefix } = opts ?? {};

  // List
  crm.get(`${PREFIX}/${route}`, async (c) => {
    try {
      const db = supabase();
      const { data, error } = await db
        .from(table)
        .select(select)
        .order(orderBy, { ascending: orderAsc });
      if (error) {
        console.log(`Error listing ${table}:`, error);
        return c.json({ error: `Error listing ${table}: ${error.message}` }, 500);
      }
      return c.json({ data: data ?? [] });
    } catch (err) {
      console.log(`Unexpected error listing ${table}:`, err);
      return c.json({ error: `Unexpected error: ${err}` }, 500);
    }
  });

  // Get by ID
  crm.get(`${PREFIX}/${route}/:id`, async (c) => {
    try {
      const id = c.req.param("id");
      const db = supabase();
      const { data, error } = await db
        .from(table)
        .select(select)
        .eq("id", id)
        .maybeSingle();
      if (error) {
        console.log(`Error fetching ${table} ${id}:`, error);
        return c.json({ error: `Error fetching ${table}: ${error.message}` }, 500);
      }
      if (!data) return c.json({ error: `${table} ${id} not found` }, 404);
      return c.json({ data });
    } catch (err) {
      console.log(`Unexpected error fetching ${table}:`, err);
      return c.json({ error: `Unexpected error: ${err}` }, 500);
    }
  });

  // Create
  crm.post(`${PREFIX}/${route}`, async (c) => {
    try {
      const body = await c.req.json();
      const db = supabase();
      const row = { ...defaultValues, ...body };
      if (idPrefix && !row.id) {
        row.id = generateCrmId(idPrefix);
      }
      const { data, error } = await db.from(table).insert(row).select(select).single();
      if (error) {
        console.log(`Error creating ${table}:`, error);
        return c.json({ error: `Error creating ${table}: ${error.message}` }, 500);
      }
      return c.json({ data }, 201);
    } catch (err) {
      console.log(`Unexpected error creating ${table}:`, err);
      return c.json({ error: `Unexpected error: ${err}` }, 500);
    }
  });

  // Bulk create (upsert)
  crm.post(`${PREFIX}/${route}/bulk`, async (c) => {
    try {
      const body = await c.req.json();
      const rows: any[] = Array.isArray(body) ? body : body.rows;
      if (!rows || rows.length === 0) return c.json({ data: [] });
      const db = supabase();
      const prepared = rows.map((r: any) => {
        const row = { ...defaultValues, ...r };
        if (idPrefix && !row.id) {
          row.id = generateCrmId(idPrefix);
        }
        return row;
      });
      const { data, error } = await db
        .from(table)
        .upsert(prepared, { onConflict: "id" })
        .select(select);
      if (error) {
        console.log(`Error bulk upserting ${table}:`, error);
        return c.json({ error: `Error bulk upserting ${table}: ${error.message}` }, 500);
      }
      return c.json({ data: data ?? [] }, 201);
    } catch (err) {
      console.log(`Unexpected error bulk upserting ${table}:`, err);
      return c.json({ error: `Unexpected error: ${err}` }, 500);
    }
  });

  // Update
  crm.put(`${PREFIX}/${route}/:id`, async (c) => {
    try {
      const id = c.req.param("id");
      const body = await c.req.json();
      const db = supabase();
      const { data, error } = await db
        .from(table)
        .update({ ...body, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select(select)
        .single();
      if (error) {
        console.log(`Error updating ${table} ${id}:`, error);
        return c.json({ error: `Error updating ${table}: ${error.message}` }, 500);
      }
      return c.json({ data });
    } catch (err) {
      console.log(`Unexpected error updating ${table}:`, err);
      return c.json({ error: `Unexpected error: ${err}` }, 500);
    }
  });

  // Patch (partial)
  crm.patch(`${PREFIX}/${route}/:id`, async (c) => {
    try {
      const id = c.req.param("id");
      const body = await c.req.json();
      const db = supabase();
      const { data, error } = await db
        .from(table)
        .update(body)
        .eq("id", id)
        .select(select)
        .single();
      if (error) {
        console.log(`Error patching ${table} ${id}:`, error);
        return c.json({ error: `Error patching ${table}: ${error.message}` }, 500);
      }
      return c.json({ data });
    } catch (err) {
      console.log(`Unexpected error patching ${table}:`, err);
      return c.json({ error: `Unexpected error: ${err}` }, 500);
    }
  });

  // Delete
  crm.delete(`${PREFIX}/${route}/:id`, async (c) => {
    try {
      const id = c.req.param("id");
      const db = supabase();
      const { error } = await db.from(table).delete().eq("id", id);
      if (error) {
        console.log(`Error deleting ${table} ${id}:`, error);
        return c.json({ error: `Error deleting ${table}: ${error.message}` }, 500);
      }
      return c.json({ data: { id, deleted: true } });
    } catch (err) {
      console.log(`Unexpected error deleting ${table}:`, err);
      return c.json({ error: `Unexpected error: ${err}` }, 500);
    }
  });
}

/* ================================================================== */
/*  Register CRUD for each entity                                      */
/* ================================================================== */

registerCrud("crm_accounts", "accounts", {
  orderBy: "created_at",
  orderAsc: false,
  idPrefix: "AC",
});

registerCrud("crm_leads", "leads", {
  orderBy: "created_at",
  orderAsc: false,
  idPrefix: "LD",
});

registerCrud("crm_opportunities", "opportunities", {
  orderBy: "created_at",
  orderAsc: false,
  idPrefix: "OP",
});

registerCrud("crm_contacts", "contacts", {
  orderBy: "created_at",
  orderAsc: false,
  idPrefix: "CT",
});

registerCrud("crm_activities", "activities", {
  orderBy: "created_at",
  orderAsc: false,
  idPrefix: "AT",
});

registerCrud("crm_call_records", "call-records", {
  orderBy: "created_at",
  orderAsc: false,
  idPrefix: "CR",
});

registerCrud("crm_field_history", "field-history", {
  orderBy: "changed_at",
  orderAsc: false,
  idPrefix: "FH",
});

registerCrud("crm_opportunity_proposals", "opportunity-proposals", {
  orderBy: "created_at",
  orderAsc: false,
  idPrefix: "PR",
});

/* ================================================================== */
/*  Special routes                                                     */
/* ================================================================== */

// List activities by entity
crm.get(`${PREFIX}/activities/entity/:type/:id`, async (c) => {
  try {
    const entityType = c.req.param("type");
    const entityId = c.req.param("id");
    const db = supabase();
    const { data, error } = await db
      .from("crm_activities")
      .select("*")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .order("created_at", { ascending: false });
    if (error) {
      console.log(`Error listing activities for ${entityType}/${entityId}:`, error);
      return c.json({ error: `Error: ${error.message}` }, 500);
    }
    return c.json({ data: data ?? [] });
  } catch (err) {
    console.log("Unexpected error listing entity activities:", err);
    return c.json({ error: `Unexpected error: ${err}` }, 500);
  }
});

// List field history by entity
crm.get(`${PREFIX}/field-history/entity/:type/:id`, async (c) => {
  try {
    const entityType = c.req.param("type");
    const entityId = c.req.param("id");
    const db = supabase();
    const { data, error } = await db
      .from("crm_field_history")
      .select("*")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .order("changed_at", { ascending: false });
    if (error) {
      console.log(`Error listing field history for ${entityType}/${entityId}:`, error);
      return c.json({ error: `Error: ${error.message}` }, 500);
    }
    return c.json({ data: data ?? [] });
  } catch (err) {
    console.log("Unexpected error listing field history:", err);
    return c.json({ error: `Unexpected error: ${err}` }, 500);
  }
});

// List opportunity services
crm.get(`${PREFIX}/opportunity-services/:oppId`, async (c) => {
  try {
    const oppId = c.req.param("oppId");
    const db = supabase();
    const { data, error } = await db
      .from("crm_opportunity_services")
      .select("*")
      .eq("opportunity_id", oppId);
    if (error) {
      console.log(`Error listing op services for ${oppId}:`, error);
      return c.json({ error: `Error: ${error.message}` }, 500);
    }
    return c.json({ data: data ?? [] });
  } catch (err) {
    console.log("Unexpected error listing op services:", err);
    return c.json({ error: `Unexpected error: ${err}` }, 500);
  }
});

// Replace opportunity services (delete + insert)
crm.put(`${PREFIX}/opportunity-services/:oppId`, async (c) => {
  try {
    const oppId = c.req.param("oppId");
    const body = await c.req.json();
    const services: any[] = Array.isArray(body) ? body : body.services;
    const db = supabase();

    await db.from("crm_opportunity_services").delete().eq("opportunity_id", oppId);

    if (services && services.length > 0) {
      const rows = services.map((s: any) => ({ ...s, opportunity_id: oppId }));
      const { error } = await db.from("crm_opportunity_services").insert(rows);
      if (error) {
        console.log(`Error replacing op services for ${oppId}:`, error);
        return c.json({ error: `Error: ${error.message}` }, 500);
      }
    }

    const { data } = await db
      .from("crm_opportunity_services")
      .select("*")
      .eq("opportunity_id", oppId);

    return c.json({ data: data ?? [] });
  } catch (err) {
    console.log("Unexpected error replacing op services:", err);
    return c.json({ error: `Unexpected error: ${err}` }, 500);
  }
});

// List opportunity proposals
crm.get(`${PREFIX}/opportunity-proposals/opp/:oppId`, async (c) => {
  try {
    const oppId = c.req.param("oppId");
    const db = supabase();
    const { data, error } = await db
      .from("crm_opportunity_proposals")
      .select("*")
      .eq("opportunity_id", oppId)
      .order("created_at", { ascending: false });
    if (error) {
      console.log(`Error listing op proposals for ${oppId}:`, error);
      return c.json({ error: `Error: ${error.message}` }, 500);
    }
    return c.json({ data: data ?? [] });
  } catch (err) {
    console.log("Unexpected error listing op proposals:", err);
    return c.json({ error: `Unexpected error: ${err}` }, 500);
  }
});

// Seed initial data (idempotent — upserts)
crm.post(`${PREFIX}/seed`, async (c) => {
  try {
    const body = await c.req.json();
    const db = supabase();
    const results: Record<string, { count: number; error?: string }> = {};

    for (const [table, rows] of Object.entries(body)) {
      if (!Array.isArray(rows) || rows.length === 0) continue;
      const { data, error } = await db
        .from(table)
        .upsert(rows as any[], { onConflict: "id" })
        .select("id");
      if (error) {
        console.log(`Seed error for ${table}:`, error);
        results[table] = { count: 0, error: error.message };
      } else {
        results[table] = { count: data?.length ?? 0 };
      }
    }

    return c.json({ data: results }, 201);
  } catch (err) {
    console.log("Unexpected error seeding CRM data:", err);
    return c.json({ error: `Unexpected error: ${err}` }, 500);
  }
});

/* ================================================================== */
/*  Lead Conversion                                                    */
/* ================================================================== */

crm.post(`${PREFIX}/leads/:id/convert`, async (c) => {
  try {
    const leadId = c.req.param("id");
    const body = await c.req.json();
    const {
      account,   // { mode: 'create'|'existing', id?: string, name?: string }
      contact,   // { mode: 'create'|'existing', id?: string, name?: string, lastName?: string }
      opportunity, // { mode: 'create'|'skip', name?: string }
      owner,     // string — record owner
    } = body;

    const db = supabase();

    // 1. Fetch the lead
    const { data: lead, error: leadErr } = await db
      .from("crm_leads")
      .select("*")
      .eq("id", leadId)
      .maybeSingle();

    if (leadErr) {
      console.log(`Error fetching lead ${leadId} for conversion:`, leadErr);
      return c.json({ error: `Error fetching lead: ${leadErr.message}` }, 500);
    }
    if (!lead) {
      return c.json({ error: `Lead ${leadId} not found` }, 404);
    }

    const now = new Date().toISOString();
    const results: Record<string, any> = { leadId };

    // 2. Account — create or link existing
    let accountId: string;
    if (account.mode === "existing" && account.id) {
      accountId = account.id;
    } else {
      const newAccId = generateCrmId("AC");
      const { data: newAcc, error: accErr } = await db
        .from("crm_accounts")
        .insert({
          id: newAccId,
          name: account.name || lead.company || lead.name,
          type: "empresa",
          stage: "prospeccao",
          owner: owner || lead.owner || "Sistema",
          phone: lead.phone || null,
          website: lead.website || null,
          sector: lead.segment || null,
          annual_revenue: lead.annual_revenue || null,
          employees: lead.employee_count || null,
        })
        .select()
        .single();
      if (accErr) {
        console.log("Error creating account during lead conversion:", accErr);
        return c.json({ error: `Error creating account: ${accErr.message}` }, 500);
      }
      accountId = newAccId;
      results.accountCreated = newAcc;
    }
    results.accountId = accountId;

    // 3. Contact — create or link existing
    let contactId: string;
    if (contact.mode === "existing" && contact.id) {
      contactId = contact.id;
    } else {
      const newCtId = generateCrmId("CT");
      // Split lead name into first/last
      const nameParts = (lead.name || "").trim().split(/\s+/);
      const firstName = nameParts[0] || lead.name || "Contato";
      const lastName = contact.lastName || nameParts.slice(1).join(" ") || "";

      const { data: newCt, error: ctErr } = await db
        .from("crm_contacts")
        .insert({
          id: newCtId,
          name: firstName,
          last_name: lastName,
          role: lead.role || null,
          email: lead.email || `${firstName.toLowerCase()}@example.com`,
          phone: lead.phone || null,
          mobile: lead.phone || null,
          account: accountId,
          company: accountId,
          owner: owner || lead.owner || "Sistema",
          origin: lead.origin || null,
          address: lead.address || null,
          stage: "ativo",
          preferred_contact: lead.preferred_contact || null,
          tags: lead.tags || null,
          notes: lead.notes || null,
        })
        .select()
        .single();
      if (ctErr) {
        console.log("Error creating contact during lead conversion:", ctErr);
        return c.json({ error: `Error creating contact: ${ctErr.message}` }, 500);
      }
      contactId = newCtId;
      results.contactCreated = newCt;
    }
    results.contactId = contactId;

    // 4. Opportunity (optional)
    if (opportunity && opportunity.mode === "create") {
      const newOpId = generateCrmId("OP");
      const { data: newOp, error: opErr } = await db
        .from("crm_opportunities")
        .insert({
          id: newOpId,
          name: opportunity.name || `${lead.name} — Oportunidade`,
          company: accountId,
          account: accountId,
          stage: "apresentacao",
          owner: owner || lead.owner || "Sistema",
          tipo: "novo_negocio",
          origin: lead.origin || null,
          decisor: contactId,
          mkt_campanha: lead.mkt_campanha || null,
          mkt_grupo_anuncios: lead.mkt_grupo_anuncios || null,
          mkt_anuncio: lead.mkt_anuncio || null,
          mkt_canal: lead.mkt_canal || null,
        })
        .select()
        .single();
      if (opErr) {
        console.log("Error creating opportunity during lead conversion:", opErr);
        return c.json({ error: `Error creating opportunity: ${opErr.message}` }, 500);
      }
      results.opportunityId = newOpId;
      results.opportunityCreated = newOp;
    }

    // 5. Transfer activities from lead to new entities
    const { data: leadActivities } = await db
      .from("crm_activities")
      .select("*")
      .eq("entity_type", "lead")
      .eq("entity_id", leadId);

    if (leadActivities && leadActivities.length > 0) {
      // Clone activities to contact and opportunity
      const clones: any[] = [];
      for (const act of leadActivities) {
        clones.push({
          ...act,
          id: generateCrmId("AT"),
          entity_type: "contact",
          entity_id: contactId,
          created_at: now,
        });
        if (results.opportunityId) {
          clones.push({
            ...act,
            id: generateCrmId("AT"),
            entity_type: "opportunity",
            entity_id: results.opportunityId,
            created_at: now,
          });
        }
      }
      if (clones.length > 0) {
        await db.from("crm_activities").insert(clones);
      }
    }

    // 6. Mark lead as converted (qualificado)
    const { error: updateErr } = await db
      .from("crm_leads")
      .update({
        stage: "qualificado",
        stage_complement: "convertido",
        updated_at: now,
      })
      .eq("id", leadId);

    if (updateErr) {
      console.log("Error updating lead stage after conversion:", updateErr);
      // Non-fatal — records were already created
    }

    // 7. Record conversion in field history
    await db.from("crm_field_history").insert({
      id: generateCrmId("FH"),
      entity_type: "lead",
      entity_id: leadId,
      field_name: "stage",
      old_value: lead.stage,
      new_value: "qualificado",
      changed_by: owner || lead.owner || "Sistema",
      change_source: "conversion",
    });

    results.converted = true;
    return c.json({ data: results }, 201);
  } catch (err) {
    console.log("Unexpected error converting lead:", err);
    return c.json({ error: `Unexpected error converting lead: ${err}` }, 500);
  }
});

/* ================================================================== */
/*  Custom Fields — Definitions (kv_store)                             */
/* ================================================================== */

const CF_DEFS_KEY = "crm_custom_field_defs";

crm.get(`${PREFIX}/custom-fields`, async (c) => {
  try {
    const raw = await kv.get(CF_DEFS_KEY);
    const defs = raw ? JSON.parse(raw) : [];
    return c.json({ data: defs });
  } catch (err) {
    console.log("Error listing custom fields:", err);
    return c.json({ error: `Error: ${err}` }, 500);
  }
});

crm.post(`${PREFIX}/custom-fields`, async (c) => {
  try {
    const body = await c.req.json();
    const raw = await kv.get(CF_DEFS_KEY);
    const defs: any[] = raw ? JSON.parse(raw) : [];
    const idx = defs.findIndex((d: any) => d.key === body.key);
    if (idx >= 0) {
      defs[idx] = { ...defs[idx], ...body, updated_at: new Date().toISOString() };
    } else {
      defs.push({ ...body, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    }
    await kv.set(CF_DEFS_KEY, JSON.stringify(defs));
    return c.json({ data: body }, 201);
  } catch (err) {
    console.log("Error saving custom field:", err);
    return c.json({ error: `Error: ${err}` }, 500);
  }
});

crm.delete(`${PREFIX}/custom-fields/:key`, async (c) => {
  try {
    const key = c.req.param("key");
    const raw = await kv.get(CF_DEFS_KEY);
    const defs: any[] = raw ? JSON.parse(raw) : [];
    const filtered = defs.filter((d: any) => d.key !== key);
    await kv.set(CF_DEFS_KEY, JSON.stringify(filtered));
    return c.json({ data: { key, deleted: true } });
  } catch (err) {
    console.log("Error deleting custom field:", err);
    return c.json({ error: `Error: ${err}` }, 500);
  }
});

/* ================================================================== */
/*  Custom Fields — Values per entity (kv_store)                       */
/* ================================================================== */

crm.get(`${PREFIX}/custom-field-values/:entityType/:entityId`, async (c) => {
  try {
    const { entityType, entityId } = c.req.param();
    const kvKey = `crm_cfv:${entityType}:${entityId}`;
    const raw = await kv.get(kvKey);
    return c.json({ data: raw ? JSON.parse(raw) : {} });
  } catch (err) {
    console.log("Error fetching custom field values:", err);
    return c.json({ error: `Error: ${err}` }, 500);
  }
});

crm.put(`${PREFIX}/custom-field-values/:entityType/:entityId`, async (c) => {
  try {
    const { entityType, entityId } = c.req.param();
    const body = await c.req.json();
    const kvKey = `crm_cfv:${entityType}:${entityId}`;
    // Merge with existing values
    const raw = await kv.get(kvKey);
    const existing = raw ? JSON.parse(raw) : {};
    const merged = { ...existing, ...body };
    await kv.set(kvKey, JSON.stringify(merged));
    return c.json({ data: merged });
  } catch (err) {
    console.log("Error saving custom field values:", err);
    return c.json({ error: `Error: ${err}` }, 500);
  }
});

/* ================================================================== */
/*  Native Field Config — Overrides (visibility/required) (kv_store)   */
/* ================================================================== */

crm.get(`${PREFIX}/field-config/:objectType`, async (c) => {
  try {
    const objectType = c.req.param("objectType");
    const kvKey = `crm_field_cfg:${objectType}`;
    const raw = await kv.get(kvKey);
    return c.json({ data: raw ? JSON.parse(raw) : {} });
  } catch (err) {
    console.log("Error fetching field config:", err);
    return c.json({ error: `Error: ${err}` }, 500);
  }
});

crm.patch(`${PREFIX}/field-config/:objectType`, async (c) => {
  try {
    const objectType = c.req.param("objectType");
    const body = await c.req.json();
    // body shape: { fieldKey: { visible?: boolean, required?: boolean } }
    const kvKey = `crm_field_cfg:${objectType}`;
    const raw = await kv.get(kvKey);
    const existing = raw ? JSON.parse(raw) : {};
    // Deep merge per field
    for (const [fieldKey, overrides] of Object.entries(body)) {
      existing[fieldKey] = { ...(existing[fieldKey] || {}), ...(overrides as any) };
    }
    await kv.set(kvKey, JSON.stringify(existing));
    return c.json({ data: existing });
  } catch (err) {
    console.log("Error saving field config:", err);
    return c.json({ error: `Error: ${err}` }, 500);
  }
});

/* ================================================================== */
/*  Object Config — Per-object settings (rules, stages, etc.)          */
/* ================================================================== */

crm.get(`${PREFIX}/obj-config/:objectType`, async (c) => {
  try {
    const objectType = c.req.param("objectType");
    const kvKey = `crm_obj_cfg:${objectType}`;
    const raw = await kv.get(kvKey);
    return c.json({ data: raw ? JSON.parse(raw) : null });
  } catch (err) {
    console.log("Error fetching object config:", err);
    return c.json({ error: `Error: ${err}` }, 500);
  }
});

crm.patch(`${PREFIX}/obj-config/:objectType`, async (c) => {
  try {
    const objectType = c.req.param("objectType");
    const body = await c.req.json();
    const kvKey = `crm_obj_cfg:${objectType}`;
    const raw = await kv.get(kvKey);
    const existing = raw ? JSON.parse(raw) : {};
    const merged = { ...existing, ...body, updated_at: new Date().toISOString() };
    await kv.set(kvKey, JSON.stringify(merged));
    return c.json({ data: merged });
  } catch (err) {
    console.log("Error saving object config:", err);
    return c.json({ error: `Error: ${err}` }, 500);
  }
});

export { crm };