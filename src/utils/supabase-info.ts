/**
 * Supabase project info — reads from environment variables on Vercel,
 * falls back to hardcoded values for Figma Make compatibility.
 *
 * On Vercel, set these env vars:
 *   VITE_SUPABASE_PROJECT_ID
 *   VITE_SUPABASE_ANON_KEY
 */

export const projectId =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_SUPABASE_PROJECT_ID) ||
  "ratwnpugnptmfplezgve";

export const publicAnonKey =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhdHducHVnbnB0bWZwbGV6Z3ZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzODA5OTEsImV4cCI6MjA4Njk1Njk5MX0.nObBgBLXmg9ti-oIyKt65DBQH9Ig5F5n0ecX-g3nLtE";
