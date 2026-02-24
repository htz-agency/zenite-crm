/**
 * Google Sheets Integration Routes
 *
 * Handles import/export of CRM data to/from Google Sheets.
 * Uses a Service Account for authentication (JWT → access_token).
 */

import { Hono } from "npm:hono";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import * as kv from "./kv_store.tsx";

const sheets = new Hono();

const supabase = () =>
  createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

const PREFIX = "/make-server-b0da2601/crm/sheets";

/* ================================================================== */
/*  Google Auth — Service Account JWT → Access Token                   */
/* ================================================================== */

function b64url(input: string): string {
  return btoa(input)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function uint8ToB64url(arr: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < arr.length; i++) {
    binary += String.fromCharCode(arr[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

let _cachedToken: { token: string; expiresAt: number } | null = null;

const KV_SA_KEY = "google_service_account_key";

async function getGoogleAccessToken(): Promise<string> {
  // Return cached token if still valid (with 60s buffer)
  if (_cachedToken && Date.now() < _cachedToken.expiresAt - 60_000) {
    return _cachedToken.token;
  }

  let keyJson: any = null;

  // ── Source 1: Environment variable ──
  const keyRaw = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_KEY");
  if (keyRaw && keyRaw.length > 100) {
    const strategies: Array<() => any> = [
      // 1 – direct parse
      () => {
        const parsed = JSON.parse(keyRaw);
        return typeof parsed === "string" ? JSON.parse(parsed) : parsed;
      },
      // 2 – trim + strip surrounding quotes + unescape
      () => {
        let cleaned = keyRaw.trim();
        if (
          (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
          (cleaned.startsWith("'") && cleaned.endsWith("'"))
        ) {
          cleaned = cleaned.slice(1, -1);
        }
        cleaned = cleaned
          .replace(/\\n/g, "\n")
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, "\\");
        return JSON.parse(cleaned);
      },
      // 3 – find first '{' and parse from there (skips BOM, stray chars)
      () => {
        const idx = keyRaw.indexOf("{");
        if (idx === -1) throw new Error("No '{' found");
        const lastIdx = keyRaw.lastIndexOf("}");
        if (lastIdx === -1) throw new Error("No '}' found");
        return JSON.parse(keyRaw.substring(idx, lastIdx + 1));
      },
      // 4 – base64 decode then parse
      () => {
        const decoded = atob(keyRaw.trim());
        return JSON.parse(decoded);
      },
    ];

    for (let i = 0; i < strategies.length; i++) {
      try {
        const result = strategies[i]();
        if (result && typeof result === "object" && result.client_email) {
          console.log(`GOOGLE_SERVICE_ACCOUNT_KEY parsed from env with strategy ${i + 1}`);
          keyJson = result;
          break;
        }
      } catch {
        // try next strategy
      }
    }
  }

  // ── Source 2: KV Store fallback ──
  if (!keyJson) {
    try {
      const stored = await kv.get(KV_SA_KEY);
      if (stored && typeof stored === "object" && stored.client_email) {
        console.log("GOOGLE_SERVICE_ACCOUNT_KEY loaded from KV store");
        keyJson = stored;
      }
    } catch (e) {
      console.log("Error reading SA key from KV store:", e);
    }
  }

  if (!keyJson) {
    throw new Error(
      "GOOGLE_SERVICE_ACCOUNT_KEY nao configurada. " +
      "Use a rota POST /crm/sheets/configure-key para salvar a chave, " +
      "ou configure o secret com o JSON completo da Service Account."
    );
  }

  if (!keyJson.client_email || !keyJson.private_key) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY is missing client_email or private_key fields");
  }

  // Import private key
  const pemContents = keyJson.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s/g, "");

  const binaryKey = Uint8Array.from(atob(pemContents), (c: string) =>
    c.charCodeAt(0),
  );

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const now = Math.floor(Date.now() / 1000);

  // ── Strategy A: Exchange JWT for access_token via token endpoint ──
  try {
    const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
    const claimSet = {
      iss: keyJson.client_email,
      scope: "https://www.googleapis.com/auth/spreadsheets",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    };
    const payload = b64url(JSON.stringify(claimSet));
    const signInput = `${header}.${payload}`;

    const signatureBuffer = await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      cryptoKey,
      new TextEncoder().encode(signInput),
    );
    const signature = uint8ToB64url(new Uint8Array(signatureBuffer));
    const jwt = `${signInput}.${signature}`;

    // Try with raw string body (no URLSearchParams encoding)
    const body = `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant_type%3Ajwt-bearer&assertion=${jwt}`;

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    const tokenData = await tokenRes.json();

    if (tokenData.access_token) {
      console.log("Google auth succeeded via token exchange (Strategy A)");
      _cachedToken = {
        token: tokenData.access_token,
        expiresAt: Date.now() + (tokenData.expires_in || 3600) * 1000,
      };
      return tokenData.access_token;
    }

    console.log("Strategy A (token exchange) failed:", JSON.stringify(tokenData));
  } catch (e) {
    console.log("Strategy A error:", e);
  }

  // ── Strategy B: Self-signed JWT used directly as Bearer token ──
  try {
    const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
    const claimSet = {
      iss: keyJson.client_email,
      sub: keyJson.client_email,
      aud: "https://sheets.googleapis.com/",
      iat: now,
      exp: now + 3600,
    };
    const payload = b64url(JSON.stringify(claimSet));
    const signInput = `${header}.${payload}`;

    const signatureBuffer = await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      cryptoKey,
      new TextEncoder().encode(signInput),
    );
    const signature = uint8ToB64url(new Uint8Array(signatureBuffer));
    const selfSignedJwt = `${signInput}.${signature}`;

    const testRes = await fetch(
      "https://sheets.googleapis.com/v4/spreadsheets/1?fields=spreadsheetId",
      { headers: { Authorization: `Bearer ${selfSignedJwt}` } },
    );

    if (testRes.status === 200 || testRes.status === 404) {
      console.log("Google auth succeeded via self-signed JWT (Strategy B)");
      _cachedToken = {
        token: selfSignedJwt,
        expiresAt: Date.now() + 3600 * 1000,
      };
      return selfSignedJwt;
    }

    const testData = await testRes.text();
    console.log(`Strategy B test call returned ${testRes.status}:`, testData.substring(0, 200));
  } catch (e) {
    console.log("Strategy B error:", e);
  }

  // ── Strategy C: Use old Google token endpoint ──
  try {
    const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
    const claimSet = {
      iss: keyJson.client_email,
      scope: "https://www.googleapis.com/auth/spreadsheets",
      aud: "https://accounts.google.com/o/oauth2/token",
      iat: now,
      exp: now + 3600,
    };
    const payload = b64url(JSON.stringify(claimSet));
    const signInput = `${header}.${payload}`;

    const signatureBuffer = await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      cryptoKey,
      new TextEncoder().encode(signInput),
    );
    const signature = uint8ToB64url(new Uint8Array(signatureBuffer));
    const jwt = `${signInput}.${signature}`;

    const body = `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant_type%3Ajwt-bearer&assertion=${jwt}`;

    const tokenRes = await fetch("https://accounts.google.com/o/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    const tokenData = await tokenRes.json();

    if (tokenData.access_token) {
      console.log("Google auth succeeded via old endpoint (Strategy C)");
      _cachedToken = {
        token: tokenData.access_token,
        expiresAt: Date.now() + (tokenData.expires_in || 3600) * 1000,
      };
      return tokenData.access_token;
    }

    console.log("Strategy C failed:", JSON.stringify(tokenData));
  } catch (e) {
    console.log("Strategy C error:", e);
  }

  throw new Error(
    "Todas as estrategias de autenticacao Google falharam. " +
    "Verifique se a Google Sheets API esta habilitada no projeto Google Cloud."
  );
}

/* ================================================================== */
/*  Helpers                                                            */
/* ================================================================== */

function extractSpreadsheetId(urlOrId: string): string {
  if (!urlOrId.includes("/")) return urlOrId.trim();
  const match = urlOrId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match) return match[1];
  throw new Error(`Could not extract spreadsheet ID from: ${urlOrId}`);
}

const SHEETS_API = "https://sheets.googleapis.com/v4/spreadsheets";

/* ================================================================== */
/*  CRM Object Definitions (fields for import/export)                  */
/* ================================================================== */

export const CRM_OBJECT_CONFIG: Record<
  string,
  {
    table: string;
    idPrefix: string;
    label: string;
    fields: { key: string; label: string; required?: boolean }[];
  }
> = {
  leads: {
    table: "crm_leads",
    idPrefix: "LD",
    label: "Leads",
    fields: [
      { key: "name", label: "Nome", required: true },
      { key: "lastname", label: "Sobrenome" },
      { key: "email", label: "Email", required: true },
      { key: "phone", label: "Telefone" },
      { key: "company", label: "Empresa" },
      { key: "role", label: "Cargo" },
      { key: "origin", label: "Origem" },
      { key: "segment", label: "Segmento" },
      { key: "stage", label: "Etapa" },
      { key: "owner", label: "Responsavel" },
      { key: "score", label: "Score" },
      { key: "website", label: "Website" },
      { key: "address", label: "Endereco" },
      { key: "type", label: "Tipo" },
      { key: "annual_revenue", label: "Receita Anual" },
      { key: "employee_count", label: "Nr Funcionarios" },
      { key: "preferred_contact", label: "Contato Preferido" },
      { key: "tags", label: "Tags" },
      { key: "notes", label: "Observacoes" },
    ],
  },
  accounts: {
    table: "crm_accounts",
    idPrefix: "AC",
    label: "Contas",
    fields: [
      { key: "name", label: "Nome", required: true },
      { key: "type", label: "Tipo" },
      { key: "stage", label: "Etapa" },
      { key: "owner", label: "Responsavel", required: true },
      { key: "sector", label: "Setor" },
      { key: "website", label: "Website" },
      { key: "phone", label: "Telefone" },
      { key: "cnpj", label: "CNPJ" },
      { key: "description", label: "Descricao" },
      { key: "annual_revenue", label: "Receita Anual" },
      { key: "employees", label: "Nr Funcionarios" },
      { key: "segment", label: "Segmento" },
      { key: "tags", label: "Tags" },
      { key: "notes", label: "Observacoes" },
    ],
  },
  contacts: {
    table: "crm_contacts",
    idPrefix: "CT",
    label: "Contatos",
    fields: [
      { key: "name", label: "Nome", required: true },
      { key: "last_name", label: "Sobrenome" },
      { key: "email", label: "Email", required: true },
      { key: "phone", label: "Telefone" },
      { key: "mobile", label: "Celular" },
      { key: "role", label: "Cargo" },
      { key: "department", label: "Departamento" },
      { key: "company", label: "Empresa" },
      { key: "account", label: "Conta" },
      { key: "linkedin", label: "LinkedIn" },
      { key: "website", label: "Website" },
      { key: "address", label: "Endereco" },
      { key: "stage", label: "Etapa" },
      { key: "owner", label: "Responsavel" },
      { key: "origin", label: "Origem" },
      { key: "birth_date", label: "Data de Nascimento" },
      { key: "cpf", label: "CPF" },
      { key: "preferred_contact", label: "Contato Preferido" },
      { key: "tags", label: "Tags" },
      { key: "notes", label: "Observacoes" },
    ],
  },
  opportunities: {
    table: "crm_opportunities",
    idPrefix: "OP",
    label: "Oportunidades",
    fields: [
      { key: "name", label: "Nome", required: true },
      { key: "company", label: "Empresa" },
      { key: "stage", label: "Etapa", required: true },
      { key: "owner", label: "Responsavel", required: true },
      { key: "value", label: "Valor" },
      { key: "tipo", label: "Tipo" },
      { key: "decisor", label: "Decisor" },
      { key: "account", label: "Conta" },
      { key: "origin", label: "Origem" },
      { key: "close_date", label: "Data de Fechamento" },
      { key: "score", label: "Score" },
      { key: "mkt_campanha", label: "Campanha MKT" },
      { key: "mkt_canal", label: "Canal MKT" },
      { key: "needs_objective", label: "Objetivo" },
      { key: "needs_budget", label: "Orcamento" },
      { key: "needs_timeline", label: "Timeline" },
      { key: "needs_notes", label: "Notas" },
    ],
  },
};

const NUMERIC_FIELDS = new Set([
  "score",
  "annual_revenue",
  "employee_count",
  "employees",
  "value",
  "revenue",
]);

const ID_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";

function generateId(prefix: string): string {
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += ID_CHARS[Math.floor(Math.random() * ID_CHARS.length)];
  }
  return `${prefix}-${code}`;
}

/* ================================================================== */
/*  Routes                                                             */
/* ================================================================== */

// Health check for sheets integration
sheets.get(`${PREFIX}/health`, async (c) => {
  try {
    const token = await getGoogleAccessToken();
    return c.json({ data: { status: "ok", hasToken: !!token } });
  } catch (err) {
    console.log("Sheets health check failed:", err);
    return c.json({ error: `Falha na autenticacao Google: ${err}` }, 500);
  }
});

// Save / update Google Service Account key (stores in KV as env var fallback)
sheets.post(`${PREFIX}/configure-key`, async (c) => {
  try {
    const { key } = await c.req.json();
    if (!key) {
      return c.json({ error: "Campo 'key' e obrigatorio (JSON da Service Account)" }, 400);
    }

    // Parse and validate
    let parsed: any;
    try {
      parsed = typeof key === "string" ? JSON.parse(key) : key;
    } catch {
      return c.json({ error: "JSON invalido. Cole o conteudo completo do arquivo .json da Service Account." }, 400);
    }

    if (!parsed.client_email || !parsed.private_key) {
      return c.json({ error: "JSON incompleto: faltam campos client_email e/ou private_key." }, 400);
    }

    // Store in KV
    await kv.set(KV_SA_KEY, parsed);

    // Invalidate cached token so next request uses the new key
    _cachedToken = null;

    console.log(`Service Account key saved to KV store for ${parsed.client_email}`);
    return c.json({
      data: {
        status: "ok",
        client_email: parsed.client_email,
        project_id: parsed.project_id || "unknown",
      },
    });
  } catch (err) {
    console.log("Error saving service account key:", err);
    return c.json({ error: `Erro ao salvar chave: ${err}` }, 500);
  }
});

// Check if key is configured (doesn't expose the key, just status)
sheets.get(`${PREFIX}/key-status`, async (c) => {
  try {
    // Check KV store
    const stored = await kv.get(KV_SA_KEY);
    if (stored && stored.client_email) {
      return c.json({
        data: {
          configured: true,
          source: "kv_store",
          client_email: stored.client_email,
          project_id: stored.project_id || "unknown",
        },
      });
    }

    // Check env var
    const envKey = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_KEY");
    if (envKey && envKey.length > 100) {
      return c.json({
        data: {
          configured: true,
          source: "env_var",
          client_email: "from_env",
        },
      });
    }

    return c.json({
      data: {
        configured: false,
        hint: "Use POST /crm/sheets/configure-key com o JSON da Service Account",
      },
    });
  } catch (err) {
    console.log("Error checking key status:", err);
    return c.json({ error: `Erro ao verificar chave: ${err}` }, 500);
  }
});

// Get sheet metadata (tab names)
sheets.post(`${PREFIX}/metadata`, async (c) => {
  try {
    const { url } = await c.req.json();
    if (!url) return c.json({ error: "URL da planilha e obrigatoria" }, 400);

    const spreadsheetId = extractSpreadsheetId(url);
    const token = await getGoogleAccessToken();

    const res = await fetch(
      `${SHEETS_API}/${spreadsheetId}?fields=properties.title,sheets.properties`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (!res.ok) {
      const err = await res.json();
      console.log("Google Sheets metadata error:", err);
      const msg = err.error?.message || res.statusText;
      if (res.status === 403) {
        return c.json(
          {
            error: `Sem permissao. Compartilhe a planilha com: zenite-sheets@zenite-price.iam.gserviceaccount.com`,
          },
          403,
        );
      }
      if (res.status === 404) {
        return c.json({ error: `Planilha nao encontrada. Verifique o URL.` }, 404);
      }
      return c.json({ error: `Erro ao acessar planilha: ${msg}` }, res.status as any);
    }

    const data = await res.json();
    const title = data.properties?.title || "Sem titulo";
    const tabs = (data.sheets || []).map((s: any) => ({
      title: s.properties.title,
      index: s.properties.index,
      rowCount: s.properties.gridProperties?.rowCount || 0,
      colCount: s.properties.gridProperties?.columnCount || 0,
    }));

    return c.json({ data: { spreadsheetId, title, tabs } });
  } catch (err) {
    console.log("Error fetching sheet metadata:", err);
    return c.json({ error: `Erro ao buscar metadados: ${err}` }, 500);
  }
});

// Preview sheet data (first N rows)
sheets.post(`${PREFIX}/preview`, async (c) => {
  try {
    const { url, sheetName, maxRows = 10 } = await c.req.json();
    if (!url || !sheetName) {
      return c.json({ error: "URL e nome da aba sao obrigatorios" }, 400);
    }

    const spreadsheetId = extractSpreadsheetId(url);
    const token = await getGoogleAccessToken();

    const range = encodeURIComponent(`'${sheetName}'`);
    const res = await fetch(
      `${SHEETS_API}/${spreadsheetId}/values/${range}?majorDimension=ROWS`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (!res.ok) {
      const err = await res.json();
      console.log("Google Sheets preview error:", err);
      return c.json(
        { error: `Erro ao ler planilha: ${err.error?.message || res.statusText}` },
        res.status as any,
      );
    }

    const data = await res.json();
    const allRows: string[][] = data.values || [];
    const headers = allRows[0] || [];
    const rows = allRows.slice(1, 1 + maxRows);
    const totalRows = Math.max(0, allRows.length - 1);

    return c.json({ data: { headers, rows, totalRows, spreadsheetId } });
  } catch (err) {
    console.log("Error previewing sheet:", err);
    return c.json({ error: `Erro ao pre-visualizar: ${err}` }, 500);
  }
});

// Get available CRM fields for an object type
sheets.get(`${PREFIX}/fields/:objectType`, (c) => {
  const objectType = c.req.param("objectType");
  const config = CRM_OBJECT_CONFIG[objectType];
  if (!config) {
    return c.json({ error: `Tipo de objeto invalido: ${objectType}` }, 400);
  }
  return c.json({ data: config.fields });
});

// Import from Google Sheet → CRM
sheets.post(`${PREFIX}/import`, async (c) => {
  try {
    const {
      url,
      sheetName,
      objectType,
      columnMapping,
      skipFirstRow = true,
    } = await c.req.json();

    const config = CRM_OBJECT_CONFIG[objectType];
    if (!config) {
      return c.json({ error: `Tipo de objeto invalido: ${objectType}` }, 400);
    }

    const spreadsheetId = extractSpreadsheetId(url);
    const token = await getGoogleAccessToken();

    // Read all data
    const range = encodeURIComponent(`'${sheetName}'`);
    const res = await fetch(
      `${SHEETS_API}/${spreadsheetId}/values/${range}?majorDimension=ROWS`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (!res.ok) {
      const err = await res.json();
      return c.json(
        { error: `Erro ao ler planilha: ${err.error?.message}` },
        res.status as any,
      );
    }

    const data = await res.json();
    const allRows: string[][] = data.values || [];
    const dataRows = skipFirstRow ? allRows.slice(1) : allRows;

    if (dataRows.length === 0) {
      return c.json({
        data: { imported: 0, total: 0, skipped: 0, errors: [] },
      });
    }

    // Transform rows to CRM records
    const db = supabase();
    const errors: string[] = [];
    const records: any[] = [];

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const record: any = {};
      const rowNum = i + (skipFirstRow ? 2 : 1);

      for (const [colIdx, fieldKey] of Object.entries(columnMapping)) {
        const value = row[parseInt(colIdx)] || "";
        if (value.trim()) {
          if (NUMERIC_FIELDS.has(fieldKey)) {
            const num = parseFloat(value.replace(/[^\d.,-]/g, "").replace(",", "."));
            record[fieldKey] = isNaN(num) ? null : num;
          } else {
            record[fieldKey] = value.trim();
          }
        }
      }

      // Check required fields
      const missing = config.fields
        .filter((f) => f.required && !record[f.key])
        .map((f) => f.label);

      if (missing.length > 0) {
        errors.push(`Linha ${rowNum}: faltando ${missing.join(", ")}`);
        continue;
      }

      // Generate ID & defaults
      record.id = generateId(config.idPrefix);
      if (!record.owner) record.owner = "Sistema";

      if (objectType === "leads") {
        record.is_active = true;
        record.is_deleted = false;
        if (!record.stage) record.stage = "novo";
      }
      if (objectType === "opportunities" && !record.stage) {
        record.stage = "qualificacao";
      }
      if (objectType === "accounts") {
        if (!record.stage) record.stage = "prospeccao";
        if (!record.type) record.type = "empresa";
      }
      if (objectType === "contacts") {
        record.is_deleted = false;
        record.do_not_contact = false;
      }

      records.push(record);
    }

    // Bulk insert in batches
    let imported = 0;
    const batchSize = 100;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const { data: inserted, error: insertErr } = await db
        .from(config.table)
        .upsert(batch, { onConflict: "id" })
        .select("id");

      if (insertErr) {
        console.log(`Batch insert error for ${config.table}:`, insertErr);
        errors.push(
          `Erro no lote ${Math.floor(i / batchSize) + 1}: ${insertErr.message}`,
        );
      } else {
        imported += inserted?.length || 0;
      }
    }

    return c.json({
      data: {
        imported,
        total: dataRows.length,
        skipped: dataRows.length - records.length,
        errors,
      },
    });
  } catch (err) {
    console.log("Error importing from sheet:", err);
    return c.json({ error: `Erro ao importar: ${err}` }, 500);
  }
});

// Export CRM data → Google Sheet
sheets.post(`${PREFIX}/export`, async (c) => {
  try {
    const { url, sheetName, objectType, fields } = await c.req.json();

    const config = CRM_OBJECT_CONFIG[objectType];
    if (!config) {
      return c.json({ error: `Tipo de objeto invalido: ${objectType}` }, 400);
    }

    const spreadsheetId = extractSpreadsheetId(url);
    const token = await getGoogleAccessToken();

    // Fetch CRM records
    const db = supabase();
    let query = db
      .from(config.table)
      .select("*")
      .order("created_at", { ascending: false });

    if (objectType === "leads") {
      query = query.eq("is_deleted", false).eq("is_active", true);
    }
    if (objectType === "contacts") {
      query = query.eq("is_deleted", false);
    }

    const { data: records, error: fetchErr } = await query;
    if (fetchErr) {
      console.log(`Error fetching ${config.table} for export:`, fetchErr);
      return c.json(
        { error: `Erro ao buscar dados: ${fetchErr.message}` },
        500,
      );
    }

    if (!records || records.length === 0) {
      return c.json({
        data: { exported: 0, message: "Nenhum registro encontrado" },
      });
    }

    // Build rows
    const fieldDefs = config.fields.filter((f) => fields.includes(f.key));
    const headerRow = ["ID", ...fieldDefs.map((f) => f.label)];

    const dataRows = records.map((r: any) => [
      r.id,
      ...fieldDefs.map((f) => {
        const val = r[f.key];
        if (val === null || val === undefined) return "";
        return String(val);
      }),
    ]);

    const allRows = [headerRow, ...dataRows];

    // Check if tab exists
    const metaRes = await fetch(
      `${SHEETS_API}/${spreadsheetId}?fields=sheets.properties`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (!metaRes.ok) {
      const err = await metaRes.json();
      return c.json(
        { error: `Erro ao acessar planilha: ${err.error?.message}` },
        metaRes.status as any,
      );
    }

    const metaData = await metaRes.json();
    const existingTabs = (metaData.sheets || []).map(
      (s: any) => s.properties.title,
    );

    if (!existingTabs.includes(sheetName)) {
      // Create new tab
      const createRes = await fetch(
        `${SHEETS_API}/${spreadsheetId}:batchUpdate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            requests: [
              { addSheet: { properties: { title: sheetName } } },
            ],
          }),
        },
      );

      if (!createRes.ok) {
        const err = await createRes.json();
        console.log("Error creating sheet tab:", err);
        return c.json(
          { error: `Erro ao criar aba: ${err.error?.message}` },
          500,
        );
      }
    } else {
      // Clear existing data
      const clearRange = encodeURIComponent(`'${sheetName}'`);
      await fetch(
        `${SHEETS_API}/${spreadsheetId}/values/${clearRange}:clear`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` } },
      );
    }

    // Write data
    const writeRange = encodeURIComponent(`'${sheetName}'!A1`);
    const writeRes = await fetch(
      `${SHEETS_API}/${spreadsheetId}/values/${writeRange}?valueInputOption=USER_ENTERED`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          range: `'${sheetName}'!A1`,
          majorDimension: "ROWS",
          values: allRows,
        }),
      },
    );

    if (!writeRes.ok) {
      const err = await writeRes.json();
      console.log("Error writing to sheet:", err);
      return c.json(
        { error: `Erro ao escrever na planilha: ${err.error?.message}` },
        500,
      );
    }

    return c.json({
      data: {
        exported: records.length,
        totalFields: fieldDefs.length + 1,
      },
    });
  } catch (err) {
    console.log("Error exporting to sheet:", err);
    return c.json({ error: `Erro ao exportar: ${err}` }, 500);
  }
});

export { sheets };