import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import { crm } from "./crm-routes.tsx";
import { sheets } from "./sheets-routes.tsx";
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
//  PROPOSALS - CRUD
// ────────────────────────────────────

// List all proposals (with service names)
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

// Create proposal
app.post(`${PREFIX}/proposals`, async (c) => {
  try {
    const body = await c.req.json();
    const db = supabase();

    const {
      id,
      client_name,
      status,
      notes,
      global_discount,
      combo_discount_percent,
      combo_label,
      total_monthly,
      total_impl,
      total_hours,
      grand_total,
      services: proposalServices,
    } = body;

    // Insert proposal
    const { data: proposal, error: proposalError } = await db
      .from("price_proposals")
      .insert({
        id,
        client_name,
        status: status || "rascunho",
        notes: notes || "",
        global_discount: global_discount || 0,
        combo_discount_percent: combo_discount_percent || 0,
        combo_label: combo_label || "",
        total_monthly: total_monthly || 0,
        total_impl: total_impl || 0,
        total_hours: total_hours || 0,
        grand_total: grand_total || 0,
      })
      .select()
      .single();

    if (proposalError) {
      console.log("Error creating proposal:", proposalError);
      return c.json(
        { error: `Error creating proposal: ${proposalError.message}` },
        500
      );
    }

    // Insert proposal services
    if (proposalServices && proposalServices.length > 0) {
      const rows = proposalServices.map((s: any) => ({
        proposal_id: id,
        service_id: s.service_id,
        complexity: s.complexity || "basico",
        recurrence: s.recurrence || "mensal",
        seniority: s.seniority || "pleno",
        allocation: s.allocation || "compartilhado",
        include_impl: s.include_impl ?? true,
        quantity: s.quantity || 1,
        computed_monthly: s.computed_monthly || 0,
        computed_impl: s.computed_impl || 0,
        computed_hours: s.computed_hours || 0,
      }));

      const { error: servicesError } = await db
        .from("price_proposal_services")
        .insert(rows);

      if (servicesError) {
        console.log("Error inserting proposal services:", servicesError);
        // Rollback: delete the proposal
        await db.from("price_proposals").delete().eq("id", id);
        return c.json(
          {
            error: `Error inserting proposal services: ${servicesError.message}`,
          },
          500
        );
      }
    }

    // Fetch the complete proposal with services
    const { data: full, error: fetchError } = await db
      .from("price_proposals")
      .select("*, price_proposal_services(*)")
      .eq("id", id)
      .single();

    if (fetchError) {
      console.log("Error fetching created proposal:", fetchError);
      return c.json({ data: proposal });
    }

    return c.json({ data: full }, 201);
  } catch (err) {
    console.log("Unexpected error creating proposal:", err);
    return c.json({ error: `Unexpected error: ${err}` }, 500);
  }
});

// Update proposal
app.put(`${PREFIX}/proposals/:id`, async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const db = supabase();

    const {
      client_name,
      status,
      notes,
      global_discount,
      combo_discount_percent,
      combo_label,
      total_monthly,
      total_impl,
      total_hours,
      grand_total,
      services: proposalServices,
    } = body;

    // Update proposal
    const { error: updateError } = await db
      .from("price_proposals")
      .update({
        client_name,
        status,
        notes,
        global_discount,
        combo_discount_percent,
        combo_label,
        total_monthly,
        total_impl,
        total_hours,
        grand_total,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      console.log(`Error updating proposal ${id}:`, updateError);
      return c.json(
        { error: `Error updating proposal: ${updateError.message}` },
        500
      );
    }

    // Replace services: delete old, insert new
    if (proposalServices) {
      const { error: delError } = await db
        .from("price_proposal_services")
        .delete()
        .eq("proposal_id", id);

      if (delError) {
        console.log("Error deleting old services:", delError);
      }

      if (proposalServices.length > 0) {
        const rows = proposalServices.map((s: any) => ({
          proposal_id: id,
          service_id: s.service_id,
          complexity: s.complexity || "basico",
          recurrence: s.recurrence || "mensal",
          seniority: s.seniority || "pleno",
          allocation: s.allocation || "compartilhado",
          include_impl: s.include_impl ?? true,
          quantity: s.quantity || 1,
          computed_monthly: s.computed_monthly || 0,
          computed_impl: s.computed_impl || 0,
          computed_hours: s.computed_hours || 0,
        }));

        const { error: insertError } = await db
          .from("price_proposal_services")
          .insert(rows);

        if (insertError) {
          console.log("Error inserting updated services:", insertError);
          return c.json(
            { error: `Error updating services: ${insertError.message}` },
            500
          );
        }
      }
    }

    // Fetch updated
    const { data: full } = await db
      .from("price_proposals")
      .select("*, price_proposal_services(*)")
      .eq("id", id)
      .single();

    return c.json({ data: full });
  } catch (err) {
    console.log("Unexpected error updating proposal:", err);
    return c.json({ error: `Unexpected error: ${err}` }, 500);
  }
});

// Update proposal status only
app.patch(`${PREFIX}/proposals/:id/status`, async (c) => {
  try {
    const id = c.req.param("id");
    const { status } = await c.req.json();
    const db = supabase();

    const { error } = await db
      .from("price_proposals")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      console.log(`Error updating status for ${id}:`, error);
      return c.json({ error: `Error updating status: ${error.message}` }, 500);
    }

    return c.json({ data: { id, status } });
  } catch (err) {
    console.log("Unexpected error updating status:", err);
    return c.json({ error: `Unexpected error: ${err}` }, 500);
  }
});

// Update proposal tag only
app.patch(`${PREFIX}/proposals/:id/tag`, async (c) => {
  try {
    const id = c.req.param("id");
    const { tag } = await c.req.json();
    const db = supabase();

    const { error } = await db
      .from("price_proposals")
      .update({ tag, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      console.log(`Error updating tag for ${id}:`, error);
      return c.json({ error: `Error updating tag: ${error.message}` }, 500);
    }

    return c.json({ data: { id, tag } });
  } catch (err) {
    console.log("Unexpected error updating tag:", err);
    return c.json({ error: `Unexpected error: ${err}` }, 500);
  }
});

// Delete proposal (cascade deletes services via FK)
app.delete(`${PREFIX}/proposals/:id`, async (c) => {
  try {
    const id = c.req.param("id");
    const db = supabase();

    // Delete services first (in case no CASCADE)
    await db.from("price_proposal_services").delete().eq("proposal_id", id);

    const { error } = await db
      .from("price_proposals")
      .delete()
      .eq("id", id);

    if (error) {
      console.log(`Error deleting proposal ${id}:`, error);
      return c.json({ error: `Error deleting proposal: ${error.message}` }, 500);
    }

    return c.json({ data: { id, deleted: true } });
  } catch (err) {
    console.log("Unexpected error deleting proposal:", err);
    return c.json({ error: `Unexpected error: ${err}` }, 500);
  }
});

// Duplicate proposal
app.post(`${PREFIX}/proposals/:id/duplicate`, async (c) => {
  try {
    const id = c.req.param("id");
    const db = supabase();

    // Fetch original
    const { data: original, error: fetchError } = await db
      .from("price_proposals")
      .select("*, price_proposal_services(*)")
      .eq("id", id)
      .single();

    if (fetchError || !original) {
      console.log(`Error fetching original proposal ${id}:`, fetchError);
      return c.json({ error: `Original proposal not found: ${id}` }, 404);
    }

    // Generate new ID
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let newId = "PR-";
    for (let i = 0; i < 4; i++) {
      newId += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Insert duplicated proposal
    const { error: insertError } = await db.from("price_proposals").insert({
      id: newId,
      client_name: `${original.client_name} (copia)`,
      status: "rascunho",
      notes: original.notes,
      global_discount: original.global_discount,
      combo_discount_percent: original.combo_discount_percent,
      combo_label: original.combo_label,
      total_monthly: original.total_monthly,
      total_impl: original.total_impl,
      total_hours: original.total_hours,
      grand_total: original.grand_total,
    });

    if (insertError) {
      console.log("Error duplicating proposal:", insertError);
      return c.json(
        { error: `Error duplicating proposal: ${insertError.message}` },
        500
      );
    }

    // Duplicate services
    const services = original.price_proposal_services;
    if (services && services.length > 0) {
      const rows = services.map((s: any) => ({
        proposal_id: newId,
        service_id: s.service_id,
        complexity: s.complexity,
        recurrence: s.recurrence,
        seniority: s.seniority,
        allocation: s.allocation,
        include_impl: s.include_impl,
        quantity: s.quantity,
        computed_monthly: s.computed_monthly,
        computed_impl: s.computed_impl,
        computed_hours: s.computed_hours,
      }));

      const { error: svcError } = await db
        .from("price_proposal_services")
        .insert(rows);

      if (svcError) {
        console.log("Error duplicating services:", svcError);
      }
    }

    // Fetch complete duplicated proposal
    const { data: full } = await db
      .from("price_proposals")
      .select("*, price_proposal_services(*)")
      .eq("id", newId)
      .single();

    return c.json({ data: full }, 201);
  } catch (err) {
    console.log("Unexpected error duplicating proposal:", err);
    return c.json({ error: `Unexpected error: ${err}` }, 500);
  }
});

// ────────────────────────────────────
//  PROPOSAL CRM LINKS (kv_store)
// ────────────────────────────────────

// Get CRM links for a proposal
app.get(`${PREFIX}/proposals/:id/crm-links`, async (c) => {
  try {
    const id = c.req.param("id");
    const raw = await kv.get(`price_proposal_crm:${id}`);
    return c.json({ data: raw ? JSON.parse(raw) : {} });
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
    await kv.set(`price_proposal_crm:${id}`, JSON.stringify(body));
    return c.json({ data: body });
  } catch (err) {
    console.log("Error saving proposal CRM links:", err);
    return c.json({ error: `Error: ${err}` }, 500);
  }
});

// ────────────────────────────────────
//  DASHBOARD STATS
// ────────────────────────────────────

// ────────────────────────────────────
//  PUBLIC PROPOSAL SHARING (kv_store)
// ────────────────────────────────────

// Generate share token for a proposal
app.post(`${PREFIX}/proposals/:id/share`, async (c) => {
  try {
    const id = c.req.param("id");

    // Check if already has a share token (idempotent)
    const existingToken = await kv.get(`proposal_share_token:${id}`);
    if (existingToken) {
      return c.json({ data: { token: existingToken, proposalId: id } });
    }

    // Generate secure random token (URL-safe)
    const bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    const token = Array.from(bytes)
      .map((b) => b.toString(36))
      .join("")
      .slice(0, 32);

    // Store bidirectional mapping in kv_store
    await kv.set(`proposal_share:${token}`, id);
    await kv.set(`proposal_share_token:${id}`, token);

    console.log(`Share link created for proposal ${id}: token=${token}`);
    return c.json({ data: { token, proposalId: id } }, 201);
  } catch (err) {
    console.log("Error creating share link:", err);
    return c.json({ error: `Error creating share link: ${err}` }, 500);
  }
});

// Get share token for a proposal (if exists)
app.get(`${PREFIX}/proposals/:id/share`, async (c) => {
  try {
    const id = c.req.param("id");
    const token = await kv.get(`proposal_share_token:${id}`);
    return c.json({ data: token ? { token, proposalId: id } : null });
  } catch (err) {
    console.log("Error fetching share token:", err);
    return c.json({ error: `Error: ${err}` }, 500);
  }
});

// Revoke share token
app.delete(`${PREFIX}/proposals/:id/share`, async (c) => {
  try {
    const id = c.req.param("id");
    const token = await kv.get(`proposal_share_token:${id}`);
    if (token) {
      await kv.del(`proposal_share:${token}`);
      await kv.del(`proposal_share_token:${id}`);
    }
    return c.json({ data: { revoked: true } });
  } catch (err) {
    console.log("Error revoking share link:", err);
    return c.json({ error: `Error: ${err}` }, 500);
  }
});

// PUBLIC: Fetch proposal by share token (no auth required)
app.get(`${PREFIX}/public/proposal/:token`, async (c) => {
  try {
    const token = c.req.param("token");
    const proposalId = await kv.get(`proposal_share:${token}`);

    if (!proposalId) {
      return c.json({ error: "Link inválido ou expirado." }, 404);
    }

    const db = supabase();
    const { data: proposal, error } = await db
      .from("price_proposals")
      .select("*, price_proposal_services(*)")
      .eq("id", proposalId)
      .single();

    if (error || !proposal) {
      return c.json({ error: "Proposta não encontrada." }, 404);
    }

    return c.json({ data: proposal });
  } catch (err) {
    console.log("Error fetching public proposal:", err);
    return c.json({ error: `Error: ${err}` }, 500);
  }
});

// PUBLIC: Client responds to proposal (approve/decline)
app.patch(`${PREFIX}/public/proposal/:token/respond`, async (c) => {
  try {
    const token = c.req.param("token");
    const { response } = await c.req.json();

    if (!response || !["aprovada", "recusada"].includes(response)) {
      return c.json({ error: "Resposta deve ser 'aprovada' ou 'recusada'." }, 400);
    }

    const proposalId = await kv.get(`proposal_share:${token}`);
    if (!proposalId) {
      return c.json({ error: "Link inválido ou expirado." }, 404);
    }

    const db = supabase();
    const { data, error } = await db
      .from("price_proposals")
      .update({ status: response })
      .eq("id", proposalId)
      .select()
      .single();

    if (error) {
      return c.json({ error: `Erro ao atualizar proposta: ${error.message}` }, 500);
    }

    console.log(`Proposal ${proposalId} responded with: ${response}`);
    return c.json({ data });
  } catch (err) {
    console.log("Error responding to proposal:", err);
    return c.json({ error: `Error: ${err}` }, 500);
  }
});

app.get(`${PREFIX}/dashboard/stats`, async (c) => {
  try {
    const db = supabase();

    const { data: proposals, error } = await db
      .from("price_proposals")
      .select("id, status, total_monthly, grand_total, created_at");

    if (error) {
      console.log("Error fetching dashboard stats:", error);
      return c.json({ error: `Error: ${error.message}` }, 500);
    }

    const all = proposals ?? [];
    const enviadas = all.filter((p) => p.status === "enviada").length;
    const aprovadas = all.filter((p) => p.status === "aprovada").length;
    const pendentes = all.filter(
      (p) => p.status === "rascunho" || p.status === "criada" || p.status === "enviada"
    ).length;
    const receitaEstimada = all
      .filter((p) => p.status === "aprovada")
      .reduce((sum, p) => sum + (p.total_monthly || 0), 0);

    return c.json({
      data: {
        total: all.length,
        enviadas,
        aprovadas,
        pendentes,
        receitaEstimada,
      },
    });
  } catch (err) {
    console.log("Unexpected error fetching stats:", err);
    return c.json({ error: `Unexpected error: ${err}` }, 500);
  }
});

// ────────────────────────────────────
//  SERVICES - Seed & List
// ────────────────────────────────────

const SERVICE_CATALOG = [
  {
    id: "perf-google-ads", name: "Gestão de Google Ads", service_group: "performance",
    description: "Criação, gestão e otimização de campanhas no Google Ads (Search, Display, Shopping, YouTube).",
    base_price: 2500, impl_price: 1500, hours_estimate: 20, is_ads: true,
    complexity_basico: 1, complexity_intermediario: 1.6, complexity_avancado: 2.4,
  },
  {
    id: "perf-meta-ads", name: "Gestão de Meta Ads", service_group: "performance",
    description: "Campanhas de performance em Facebook e Instagram Ads com estratégia de funil completo.",
    base_price: 2200, impl_price: 1200, hours_estimate: 18, is_ads: true,
    complexity_basico: 1, complexity_intermediario: 1.5, complexity_avancado: 2.2,
  },
  {
    id: "perf-linkedin-ads", name: "Gestão de LinkedIn Ads", service_group: "performance",
    description: "Campanhas B2B no LinkedIn com segmentação avançada por cargo, empresa e setor.",
    base_price: 3000, impl_price: 1800, hours_estimate: 16, is_ads: true,
    complexity_basico: 1, complexity_intermediario: 1.5, complexity_avancado: 2.0,
  },
  {
    id: "perf-tiktok-ads", name: "Gestão de TikTok Ads", service_group: "performance",
    description: "Campanhas de awareness e conversão no TikTok com criação de criativos nativos.",
    base_price: 2000, impl_price: 1000, hours_estimate: 15, is_ads: true,
    complexity_basico: 1, complexity_intermediario: 1.4, complexity_avancado: 2.0,
  },
  {
    id: "perf-seo", name: "SEO & Conteúdo Orgânico", service_group: "performance",
    description: "Otimização técnica, on-page e off-page para mecanismos de busca.",
    base_price: 3500, impl_price: 2500, hours_estimate: 30, is_ads: false,
    complexity_basico: 1, complexity_intermediario: 1.7, complexity_avancado: 2.5,
  },
  {
    id: "perf-analytics", name: "Analytics & Dashboards", service_group: "performance",
    description: "Configuração de GA4, GTM, dashboards de BI e relatórios de performance.",
    base_price: 1800, impl_price: 3000, hours_estimate: 12, is_ads: false,
    complexity_basico: 1, complexity_intermediario: 1.5, complexity_avancado: 2.0,
  },
  {
    id: "sales-crm", name: "Implementação de CRM", service_group: "sales_ops",
    description: "Setup completo de CRM (HubSpot, Pipedrive, RD Station) com customização de pipelines.",
    base_price: 2800, impl_price: 5000, hours_estimate: 24, is_ads: false,
    complexity_basico: 1, complexity_intermediario: 1.8, complexity_avancado: 2.8,
  },
  {
    id: "sales-automation", name: "Automação de Marketing", service_group: "sales_ops",
    description: "Fluxos de nutrição, lead scoring e automações de email marketing.",
    base_price: 2200, impl_price: 3500, hours_estimate: 18, is_ads: false,
    complexity_basico: 1, complexity_intermediario: 1.6, complexity_avancado: 2.4,
  },
  {
    id: "sales-lead-scoring", name: "Lead Scoring & Qualificação", service_group: "sales_ops",
    description: "Definição de critérios de qualificação, MQL/SQL e integração com vendas.",
    base_price: 1500, impl_price: 2000, hours_estimate: 10, is_ads: false,
    complexity_basico: 1, complexity_intermediario: 1.5, complexity_avancado: 2.0,
  },
  {
    id: "sales-pipeline", name: "Pipeline de Vendas", service_group: "sales_ops",
    description: "Estruturação do pipeline comercial com etapas, gatilhos e métricas de conversão.",
    base_price: 1800, impl_price: 2500, hours_estimate: 14, is_ads: false,
    complexity_basico: 1, complexity_intermediario: 1.5, complexity_avancado: 2.2,
  },
  {
    id: "sales-integration", name: "Integração de Ferramentas", service_group: "sales_ops",
    description: "Integração entre CRM, ferramentas de marketing, ERP e plataformas de vendas.",
    base_price: 1200, impl_price: 3000, hours_estimate: 10, is_ads: false,
    complexity_basico: 1, complexity_intermediario: 1.8, complexity_avancado: 2.5,
  },
  {
    id: "sales-onboarding", name: "Onboarding de Clientes", service_group: "sales_ops",
    description: "Treinamento da equipe comercial e implementação de processos de vendas.",
    base_price: 1500, impl_price: 2000, hours_estimate: 12, is_ads: false,
    complexity_basico: 1, complexity_intermediario: 1.4, complexity_avancado: 1.8,
  },
  {
    id: "brand-identity", name: "Branding & Identidade Visual", service_group: "brand_co",
    description: "Desenvolvimento de marca, logo, manual de identidade visual e brand guidelines.",
    base_price: 0, impl_price: 12000, hours_estimate: 60, is_ads: false,
    complexity_basico: 1, complexity_intermediario: 1.5, complexity_avancado: 2.5,
  },
  {
    id: "brand-social", name: "Social Media Management", service_group: "brand_co",
    description: "Gestão de redes sociais com planejamento editorial, criação de conteúdo e community management.",
    base_price: 3500, impl_price: 1500, hours_estimate: 30, is_ads: false,
    complexity_basico: 1, complexity_intermediario: 1.5, complexity_avancado: 2.2,
  },
  {
    id: "brand-content", name: "Produção de Conteúdo", service_group: "brand_co",
    description: "Blog posts, e-books, whitepapers, infográficos e materiais ricos.",
    base_price: 2800, impl_price: 1000, hours_estimate: 24, is_ads: false,
    complexity_basico: 1, complexity_intermediario: 1.6, complexity_avancado: 2.3,
  },
  {
    id: "brand-design", name: "Design Gráfico", service_group: "brand_co",
    description: "Criação de peças gráficas, apresentações, materiais impressos e digitais.",
    base_price: 2000, impl_price: 800, hours_estimate: 16, is_ads: false,
    complexity_basico: 1, complexity_intermediario: 1.4, complexity_avancado: 2.0,
  },
  {
    id: "brand-video", name: "Vídeo & Motion Design", service_group: "brand_co",
    description: "Produção de vídeos institucionais, motion graphics, reels e conteúdo audiovisual.",
    base_price: 3000, impl_price: 2000, hours_estimate: 20, is_ads: false,
    complexity_basico: 1, complexity_intermediario: 1.6, complexity_avancado: 2.5,
  },
  {
    id: "brand-web", name: "Website & Landing Pages", service_group: "brand_co",
    description: "Design e desenvolvimento de websites, landing pages e páginas de conversão.",
    base_price: 0, impl_price: 8000, hours_estimate: 40, is_ads: false,
    complexity_basico: 1, complexity_intermediario: 1.5, complexity_avancado: 2.5,
  },
];

// Seed services (idempotent upsert)
app.post(`${PREFIX}/seed-services`, async (c) => {
  try {
    const db = supabase();

    // Upsert all services
    const { data, error } = await db
      .from("price_services")
      .upsert(SERVICE_CATALOG, { onConflict: "id" })
      .select();

    if (error) {
      console.log("Error seeding services:", error);
      return c.json({ error: `Error seeding services: ${error.message}` }, 500);
    }

    return c.json({ data, count: data?.length ?? 0 }, 201);
  } catch (err) {
    console.log("Unexpected error seeding services:", err);
    return c.json({ error: `Unexpected error: ${err}` }, 500);
  }
});

// List all services from DB
app.get(`${PREFIX}/services`, async (c) => {
  try {
    const db = supabase();
    const { data, error } = await db
      .from("price_services")
      .select("*")
      .order("service_group", { ascending: true });

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

// Create a new service
app.post(`${PREFIX}/services`, async (c) => {
  try {
    const db = supabase();
    const body = await c.req.json();

    const row = {
      id: body.id,
      name: body.name,
      service_group: body.service_group,
      description: body.description ?? "",
      base_price: body.base_price ?? 0,
      impl_price: body.impl_price ?? 0,
      hours_estimate: body.hours_estimate ?? 0,
      is_ads: body.is_ads ?? false,
      complexity_basico: body.complexity_basico ?? 1,
      complexity_intermediario: body.complexity_intermediario ?? 1.5,
      complexity_avancado: body.complexity_avancado ?? 2.0,
    };

    const { data, error } = await db
      .from("price_services")
      .upsert([row], { onConflict: "id" })
      .select()
      .single();

    if (error) {
      console.log("Error creating service:", error);
      return c.json({ error: `Error creating service: ${error.message}` }, 500);
    }

    return c.json({ data }, 201);
  } catch (err) {
    console.log("Unexpected error creating service:", err);
    return c.json({ error: `Unexpected error: ${err}` }, 500);
  }
});

// Diagnostic: list columns of price_services table
app.get(`${PREFIX}/debug/price-services-columns`, async (c) => {
  try {
    const db = supabase();
    
    // Query information_schema to get column names and types
    const { data, error } = await db.rpc("", {}).maybeSingle();
    
    // Fallback: use a raw query via PostgREST - try select * with limit 0
    // to see column names from the response headers
    const { data: sample, error: sampleError } = await db
      .from("price_services")
      .select("*")
      .limit(0);

    // Also try inserting a single test row to get the exact error
    const testRow = SERVICE_CATALOG[0];
    const { data: insertData, error: insertError } = await db
      .from("price_services")
      .upsert([testRow], { onConflict: "id" })
      .select();

    return c.json({
      selectError: sampleError ? sampleError.message : null,
      selectHint: sampleError?.hint || null,
      insertError: insertError ? insertError.message : null,
      insertHint: insertError?.hint || null,
      insertDetails: insertError?.details || null,
      insertCode: insertError?.code || null,
      insertedRow: insertData,
      testRowKeys: Object.keys(testRow),
    });
  } catch (err) {
    console.log("Debug error:", err);
    return c.json({ error: `${err}` }, 500);
  }
});

// Diagnostic: test proposals tables
app.get(`${PREFIX}/debug/proposals-tables`, async (c) => {
  try {
    const db = supabase();
    
    // Test price_proposals
    const { data: pSample, error: pError } = await db
      .from("price_proposals")
      .select("*")
      .limit(0);

    // Test price_proposal_services
    const { data: psSample, error: psError } = await db
      .from("price_proposal_services")
      .select("*")
      .limit(0);

    // Try a test insert to price_proposals
    const testId = "PR-TEST";
    const { data: testInsert, error: insertError } = await db
      .from("price_proposals")
      .upsert([{
        id: testId,
        client_name: "Test Client",
        status: "rascunho",
        notes: "",
        global_discount: 0,
        combo_discount_percent: 0,
        combo_label: "",
        total_monthly: 0,
        total_impl: 0,
        total_hours: 0,
        grand_total: 0,
      }], { onConflict: "id" })
      .select();

    // Try test insert to price_proposal_services
    let svcInsertError = null;
    if (!insertError) {
      const { error: svcErr } = await db
        .from("price_proposal_services")
        .insert([{
          proposal_id: testId,
          service_id: "perf-google-ads",
          complexity: "basico",
          recurrence: "mensal",
          seniority: "pleno",
          allocation: "compartilhado",
          include_impl: true,
          quantity: 1,
          computed_monthly: 2500,
          computed_impl: 1500,
          computed_hours: 20,
        }]);
      svcInsertError = svcErr ? { message: svcErr.message, hint: svcErr.hint, details: svcErr.details, code: svcErr.code } : null;

      // Cleanup test data
      await db.from("price_proposal_services").delete().eq("proposal_id", testId);
      await db.from("price_proposals").delete().eq("id", testId);
    }

    return c.json({
      proposals: {
        selectError: pError ? pError.message : null,
        insertError: insertError ? { message: insertError.message, hint: insertError.hint, details: insertError.details, code: insertError.code } : null,
        insertedRow: testInsert,
      },
      proposal_services: {
        selectError: psError ? psError.message : null,
        insertError: svcInsertError,
      },
    });
  } catch (err) {
    console.log("Debug proposals error:", err);
    return c.json({ error: `${err}` }, 500);
  }
});

// Mount CRM routes
app.route("/", crm);

// Mount Google Sheets routes
app.route("/", sheets);

Deno.serve(app.fetch);