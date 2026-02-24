/**
 * CRM Google Sheets — Import / Export
 *
 * Full-page wizard to import data from Google Sheets into CRM objects
 * or export CRM data out to a Google Sheet tab.
 */

import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  Table,
  DownloadSimple,
  UploadSimple,
  CaretRight,
  CheckCircle,
  Warning,
  SpinnerGap,
  ArrowsClockwise,
  Check,
  Heart,
  SketchLogo,
  IdentificationCard,
  Building,
  Info,
  Copy,
} from "@phosphor-icons/react";
import { PillButton } from "../pill-button";
import {
  sheetsGetMetadata,
  sheetsPreview,
  sheetsGetFields,
  sheetsImport,
  sheetsExport,
  sheetsConfigureKey,
  sheetsKeyStatus,
} from "./crm-api";
import type {
  SheetMetadata,
  SheetPreview as SheetPreviewData,
  SheetCrmField,
  SheetImportResult,
  SheetExportResult,
} from "./crm-api";

import svgPaths from "../../../imports/svg-jhbg1ycv8q";

/* ================================================================== */
/*  Constants                                                          */
/* ================================================================== */

type Mode = "import" | "export";
type ObjectType = "leads" | "accounts" | "contacts" | "opportunities";

const OBJECTS: { key: ObjectType; label: string; icon: any; color: string; bg: string }[] = [
  { key: "leads", label: "Leads", icon: Heart, color: "#C8A117", bg: "#FFF6D6" },
  { key: "accounts", label: "Contas", icon: Building, color: "#17B882", bg: "#D9F8EF" },
  { key: "contacts", label: "Contatos", icon: IdentificationCard, color: "#E0563B", bg: "#FFEDEB" },
  { key: "opportunities", label: "Oportunidades", icon: SketchLogo, color: "#3B82F6", bg: "#DCF0FF" },
];

const SERVICE_ACCOUNT_EMAIL = "zenite-sheets@zenite-price.iam.gserviceaccount.com";

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */

export function CrmSheets() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("import");

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col h-full"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-8 pt-7 pb-5">
        <button
          onClick={() => navigate("/crm/ajustes/campos")}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--color-bg-subtle)] transition-colors"
        >
          <ArrowLeft size={18} weight="bold" />
        </button>
        <div className="w-[22px] h-[22px] relative shrink-0">
          <svg className="block w-full h-full" fill="none" viewBox="0 0 16 16">
            <g clipPath="url(#clip_sheets_hdr)">
              <rect fill="#29A86B" height="16" rx="2" width="16" />
              <path d={svgPaths.pd021b00} fill="white" />
            </g>
            <defs>
              <clipPath id="clip_sheets_hdr">
                <rect fill="white" height="16" width="16" />
              </clipPath>
            </defs>
          </svg>
        </div>
        <h1 className="text-[18px] font-semibold text-[var(--color-text)]">
          Google Sheets
        </h1>
        <div className="flex-1" />

        {/* Mode pills */}
        <div className="flex gap-1 bg-[var(--color-bg-subtle)] rounded-[500px] p-1">
          <button
            onClick={() => setMode("import")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-[500px] text-[13px] font-medium transition-all ${
              mode === "import"
                ? "bg-white text-[var(--color-text)] shadow-sm"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            }`}
          >
            <DownloadSimple size={14} weight="bold" />
            Importar
          </button>
          <button
            onClick={() => setMode("export")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-[500px] text-[13px] font-medium transition-all ${
              mode === "export"
                ? "bg-white text-[var(--color-text)] shadow-sm"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            }`}
          >
            <UploadSimple size={14} weight="bold" />
            Exportar
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 pb-8">
        <AnimatePresence mode="wait">
          {mode === "import" ? (
            <motion.div
              key="import"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.2 }}
            >
              <ImportWizard />
            </motion.div>
          ) : (
            <motion.div
              key="export"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
            >
              <ExportWizard />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ================================================================== */
/*  Shared components                                                  */
/* ================================================================== */

function ServiceAccountBanner() {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    const textArea = document.createElement("textarea");
    textArea.value = SERVICE_ACCOUNT_EMAIL;
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.select();
    try { document.execCommand("copy"); } catch {}
    document.body.removeChild(textArea);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-[#F0F7FF] border border-[#D0E3FF]">
      <Info size={18} weight="fill" className="text-[#3B82F6] mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-[#1E3A5F] leading-[1.5]">
          Compartilhe a planilha com a conta de serviço abaixo (como <strong>Editor</strong>) para permitir leitura e escrita:
        </p>
        <div className="flex items-center gap-2 mt-2">
          <code className="text-[12px] bg-white px-2.5 py-1 rounded-lg border border-[#D0E3FF] text-[#1E3A5F] font-mono truncate">
            {SERVICE_ACCOUNT_EMAIL}
          </code>
          <button
            onClick={copy}
            className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center bg-white border border-[#D0E3FF] hover:bg-[#E8F0FE] transition-colors"
            title="Copiar"
          >
            {copied ? <Check size={14} className="text-[#34A853]" /> : <Copy size={14} className="text-[#3B82F6]" />}
          </button>
        </div>
      </div>
    </div>
  );
}

function ObjectSelector({
  value,
  onChange,
}: {
  value: ObjectType | null;
  onChange: (v: ObjectType) => void;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {OBJECTS.map((obj) => {
        const Icon = obj.icon;
        const selected = value === obj.key;
        return (
          <button
            key={obj.key}
            onClick={() => onChange(obj.key)}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
              selected
                ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5 shadow-sm"
                : "border-[var(--color-border)] hover:border-[var(--color-border-hover)] bg-white"
            }`}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: obj.bg }}
            >
              <Icon size={20} weight={selected ? "fill" : "duotone"} style={{ color: obj.color }} />
            </div>
            <span className={`text-[13px] font-medium ${selected ? "text-[var(--color-text)]" : "text-[var(--color-text-muted)]"}`}>
              {obj.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function StepBadge({ step, active, done }: { step: number; active: boolean; done: boolean }) {
  return (
    <div
      className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold transition-all ${
        done
          ? "bg-[#34A853] text-white"
          : active
          ? "bg-[var(--color-primary)] text-white"
          : "bg-[var(--color-bg-subtle)] text-[var(--color-text-muted)]"
      }`}
    >
      {done ? <Check size={14} weight="bold" /> : step}
    </div>
  );
}

function LoadingSpinner({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 py-8 justify-center">
      <SpinnerGap size={20} className="animate-spin text-[var(--color-primary)]" />
      <span className="text-[14px] text-[var(--color-text-muted)]">{text}</span>
    </div>
  );
}

/* ================================================================== */
/*  Key Configuration Banner                                           */
/* ================================================================== */

function KeyConfigBanner() {
  const [status, setStatus] = useState<"loading" | "configured" | "missing" | "error">("loading");
  const [email, setEmail] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    sheetsKeyStatus()
      .then((s) => {
        if (s.configured) {
          setStatus("configured");
          setEmail(s.client_email || "");
        } else {
          setStatus("missing");
        }
      })
      .catch(() => setStatus("error"));
  }, []);

  const handleSave = async () => {
    if (!keyInput.trim()) return;
    setSaving(true);
    setSaveError("");
    try {
      const result = await sheetsConfigureKey(keyInput.trim());
      setStatus("configured");
      setEmail(result.client_email);
      setShowForm(false);
      setKeyInput("");
    } catch (err: any) {
      setSaveError(err.message || "Erro ao salvar chave");
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading") return null;
  if (status === "configured" && !showForm) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl bg-[#F0FFF4] border border-[#C6F6D5] mb-4">
        <CheckCircle size={16} weight="fill" className="text-[#34A853] shrink-0" />
        <span className="text-[12px] text-[#1E3A2F]">
          Service Account configurada: <strong>{email}</strong>
        </span>
        <button
          onClick={() => setShowForm(true)}
          className="ml-auto text-[11px] text-[var(--color-text-muted)] hover:text-[var(--color-text)] underline"
        >
          Alterar
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-[#FFF8E1] border border-[#FFE082] mb-4 space-y-3">
      <div className="flex items-start gap-2">
        <Warning size={16} weight="fill" className="text-[#F9A825] mt-0.5 shrink-0" />
        <div className="flex-1">
          <p className="text-[13px] font-semibold text-[#5D4037]">
            {status === "configured" ? "Atualizar" : "Configurar"} Service Account Key
          </p>
          <p className="text-[12px] text-[#795548] mt-0.5">
            Cole o conteudo completo do arquivo <code className="bg-white/60 px-1 rounded text-[11px]">.json</code> da Service Account do Google Cloud Console.
          </p>
        </div>
        {status === "configured" && (
          <button onClick={() => setShowForm(false)} className="text-[11px] text-[#795548] underline">
            Cancelar
          </button>
        )}
      </div>
      <textarea
        value={keyInput}
        onChange={(e) => setKeyInput(e.target.value)}
        placeholder='{"type": "service_account", "project_id": "...", ...}'
        rows={5}
        className="w-full px-3 py-2 rounded-lg border border-[#FFE082] bg-white text-[12px] font-mono resize-none focus:outline-none focus:ring-2 focus:ring-[#F9A825]/30 placeholder:text-[#BDBDBD]"
      />
      {saveError && (
        <p className="text-[12px] text-red-600">{saveError}</p>
      )}
      <div className="flex justify-end">
        <PillButton onClick={handleSave} disabled={!keyInput.trim() || saving}>
          {saving ? (
            <SpinnerGap size={14} className="animate-spin" />
          ) : (
            <>
              <Check size={14} weight="bold" />
              Salvar Chave
            </>
          )}
        </PillButton>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  IMPORT WIZARD                                                      */
/* ================================================================== */

type ImportStep = 1 | 2 | 3 | 4;

function ImportWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState<ImportStep>(1);

  // Step 1
  const [sheetUrl, setSheetUrl] = useState("");
  const [objectType, setObjectType] = useState<ObjectType | null>(null);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [metadata, setMetadata] = useState<SheetMetadata | null>(null);
  const [metaError, setMetaError] = useState("");

  // Step 2
  const [selectedTab, setSelectedTab] = useState<string>("");
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [preview, setPreview] = useState<SheetPreviewData | null>(null);
  const [previewError, setPreviewError] = useState("");
  const [crmFields, setCrmFields] = useState<SheetCrmField[]>([]);

  // Step 3
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<SheetImportResult | null>(null);
  const [importError, setImportError] = useState("");

  // Auto-detect column mapping from header names
  const autoMapColumns = useCallback(
    (headers: string[], fields: SheetCrmField[]) => {
      const mapping: Record<string, string> = {};
      const normalize = (s: string) =>
        s
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]/g, "");

      headers.forEach((h, idx) => {
        const nh = normalize(h);
        for (const f of fields) {
          const nk = normalize(f.key);
          const nl = normalize(f.label);
          if (nh === nk || nh === nl || nh.includes(nk) || nk.includes(nh)) {
            mapping[String(idx)] = f.key;
            break;
          }
        }
      });
      return mapping;
    },
    [],
  );

  const handleLoadSheet = async () => {
    if (!sheetUrl.trim() || !objectType) return;
    setLoadingMeta(true);
    setMetaError("");
    setMetadata(null);
    try {
      const [meta, fields] = await Promise.all([
        sheetsGetMetadata(sheetUrl),
        sheetsGetFields(objectType),
      ]);
      setMetadata(meta);
      setCrmFields(fields);
      if (meta.tabs.length > 0) {
        setSelectedTab(meta.tabs[0].title);
      }
      setStep(2);
    } catch (err: any) {
      setMetaError(err.message || "Erro ao conectar à planilha");
    } finally {
      setLoadingMeta(false);
    }
  };

  const handlePreview = async () => {
    if (!selectedTab) return;
    setLoadingPreview(true);
    setPreviewError("");
    setPreview(null);
    try {
      const data = await sheetsPreview(sheetUrl, selectedTab, 5);
      setPreview(data);
      const auto = autoMapColumns(data.headers, crmFields);
      setColumnMapping(auto);
      setStep(3);
    } catch (err: any) {
      setPreviewError(err.message || "Erro ao visualizar dados");
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleImport = async () => {
    if (!objectType || !preview) return;
    // Must have at least 1 mapped column
    const mapped = Object.values(columnMapping).filter(Boolean);
    if (mapped.length === 0) {
      setImportError("Mapeie pelo menos uma coluna antes de importar");
      return;
    }
    setImporting(true);
    setImportError("");
    try {
      const result = await sheetsImport(sheetUrl, selectedTab, objectType, columnMapping);
      setImportResult(result);
      setStep(4);
    } catch (err: any) {
      setImportError(err.message || "Erro ao importar");
    } finally {
      setImporting(false);
    }
  };

  const reset = () => {
    setStep(1);
    setSheetUrl("");
    setObjectType(null);
    setMetadata(null);
    setMetaError("");
    setSelectedTab("");
    setPreview(null);
    setPreviewError("");
    setColumnMapping({});
    setImportResult(null);
    setImportError("");
  };

  return (
    <div className="max-w-[900px]">
      {/* Steps indicator */}
      <div className="flex items-center gap-2 mb-6">
        {[
          { n: 1, label: "Planilha & Objeto" },
          { n: 2, label: "Selecionar Aba" },
          { n: 3, label: "Mapear Colunas" },
          { n: 4, label: "Resultado" },
        ].map((s, i) => (
          <div key={s.n} className="flex items-center gap-2">
            {i > 0 && <div className="w-6 h-px bg-[var(--color-border)]" />}
            <StepBadge step={s.n} active={step === s.n} done={step > s.n} />
            <span
              className={`text-[13px] ${
                step === s.n ? "font-semibold text-[var(--color-text)]" : "text-[var(--color-text-muted)]"
              }`}
            >
              {s.label}
            </span>
          </div>
        ))}
      </div>

      <ServiceAccountBanner />
      <KeyConfigBanner />

      <div className="mt-6">
        <AnimatePresence mode="wait">
          {/* ─── Step 1 ─── */}
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              <div>
                <label className="text-[13px] font-semibold text-[var(--color-text)] mb-2 block">
                  URL da Planilha
                </label>
                <input
                  type="text"
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="w-full h-10 px-4 rounded-xl border border-[var(--color-border)] bg-white text-[14px] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] transition-all placeholder:text-[var(--color-text-muted)]/50"
                />
              </div>

              <div>
                <label className="text-[13px] font-semibold text-[var(--color-text)] mb-3 block">
                  Objeto CRM de destino
                </label>
                <ObjectSelector value={objectType} onChange={setObjectType} />
              </div>

              {metaError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
                  <Warning size={16} className="text-red-500 shrink-0" />
                  <span className="text-[13px] text-red-700">{metaError}</span>
                </div>
              )}

              <div className="flex justify-end">
                <PillButton
                  onClick={handleLoadSheet}
                  disabled={!sheetUrl.trim() || !objectType || loadingMeta}
                >
                  {loadingMeta ? (
                    <SpinnerGap size={16} className="animate-spin" />
                  ) : (
                    <>
                      Carregar Planilha
                      <CaretRight size={14} weight="bold" />
                    </>
                  )}
                </PillButton>
              </div>
            </motion.div>
          )}

          {/* ─── Step 2 ─── */}
          {step === 2 && metadata && (
            <motion.div key="s2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-[#F0FFF4] border border-[#C6F6D5]">
                <CheckCircle size={18} weight="fill" className="text-[#34A853] shrink-0" />
                <div>
                  <p className="text-[13px] font-semibold text-[#1E3A2F]">{metadata.title}</p>
                  <p className="text-[12px] text-[#4A7C59]">{metadata.tabs.length} aba(s) encontrada(s)</p>
                </div>
              </div>

              <div>
                <label className="text-[13px] font-semibold text-[var(--color-text)] mb-3 block">
                  Selecione a aba para importar
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {metadata.tabs.map((tab) => (
                    <button
                      key={tab.title}
                      onClick={() => setSelectedTab(tab.title)}
                      className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-left ${
                        selectedTab === tab.title
                          ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                          : "border-[var(--color-border)] hover:border-[var(--color-border-hover)] bg-white"
                      }`}
                    >
                      <Table size={16} weight="duotone" className="text-[#34A853] shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium truncate">{tab.title}</p>
                        <p className="text-[11px] text-[var(--color-text-muted)]">
                          {tab.rowCount} linhas · {tab.colCount} colunas
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {previewError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
                  <Warning size={16} className="text-red-500 shrink-0" />
                  <span className="text-[13px] text-red-700">{previewError}</span>
                </div>
              )}

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="text-[13px] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors flex items-center gap-1"
                >
                  <ArrowLeft size={14} /> Voltar
                </button>
                <PillButton onClick={handlePreview} disabled={!selectedTab || loadingPreview}>
                  {loadingPreview ? (
                    <SpinnerGap size={16} className="animate-spin" />
                  ) : (
                    <>
                      Visualizar Dados
                      <CaretRight size={14} weight="bold" />
                    </>
                  )}
                </PillButton>
              </div>
            </motion.div>
          )}

          {/* ─── Step 3: Column Mapping ─── */}
          {step === 3 && preview && (
            <motion.div key="s3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
              <div className="flex items-center justify-between">
                <p className="text-[14px] font-semibold text-[var(--color-text)]">
                  {preview.totalRows} linha(s) encontrada(s) — Pré-visualização das primeiras {preview.rows.length}
                </p>
              </div>

              {/* Preview table */}
              <div className="border border-[var(--color-border)] rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="bg-[var(--color-bg-subtle)]">
                        {preview.headers.map((h, i) => (
                          <th key={i} className="px-3 py-2 text-left font-semibold text-[var(--color-text)] whitespace-nowrap border-b border-[var(--color-border)]">
                            {h || `Coluna ${i + 1}`}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.rows.map((row, ri) => (
                        <tr key={ri} className="border-b border-[var(--color-border)] last:border-b-0">
                          {preview.headers.map((_, ci) => (
                            <td key={ci} className="px-3 py-2 text-[var(--color-text-muted)] whitespace-nowrap max-w-[200px] truncate">
                              {row[ci] || "—"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Column mapping */}
              <div>
                <p className="text-[13px] font-semibold text-[var(--color-text)] mb-3">
                  Mapeamento de Colunas
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {preview.headers.map((header, idx) => {
                    const mapped = columnMapping[String(idx)] || "";
                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-3 rounded-xl border border-[var(--color-border)] bg-white"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] text-[var(--color-text-muted)]">Coluna da planilha</p>
                          <p className="text-[13px] font-medium truncate">{header || `Col ${idx + 1}`}</p>
                        </div>
                        <CaretRight size={14} className="text-[var(--color-text-muted)] shrink-0" />
                        <div className="flex-1 min-w-0">
                          <select
                            value={mapped}
                            onChange={(e) => {
                              setColumnMapping((prev) => {
                                const next = { ...prev };
                                if (e.target.value) {
                                  next[String(idx)] = e.target.value;
                                } else {
                                  delete next[String(idx)];
                                }
                                return next;
                              });
                            }}
                            className={`w-full h-8 px-2 rounded-lg border text-[13px] focus:outline-none transition-all ${
                              mapped
                                ? "border-[#34A853] bg-[#F0FFF4] text-[#1E3A2F]"
                                : "border-[var(--color-border)] bg-[var(--color-bg-subtle)] text-[var(--color-text-muted)]"
                            }`}
                          >
                            <option value="">— Ignorar —</option>
                            {crmFields.map((f) => (
                              <option key={f.key} value={f.key}>
                                {f.label} {f.required ? "*" : ""}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {importError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
                  <Warning size={16} className="text-red-500 shrink-0" />
                  <span className="text-[13px] text-red-700">{importError}</span>
                </div>
              )}

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(2)}
                  className="text-[13px] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors flex items-center gap-1"
                >
                  <ArrowLeft size={14} /> Voltar
                </button>
                <PillButton onClick={handleImport} disabled={importing}>
                  {importing ? (
                    <>
                      <SpinnerGap size={16} className="animate-spin" />
                      Importando...
                    </>
                  ) : (
                    <>
                      <DownloadSimple size={14} weight="bold" />
                      Importar {preview.totalRows} registro(s)
                    </>
                  )}
                </PillButton>
              </div>
            </motion.div>
          )}

          {/* ─── Step 4: Result ─── */}
          {step === 4 && importResult && (
            <motion.div key="s4" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="space-y-5">
              <div className="flex flex-col items-center py-8 gap-4">
                <div className="w-16 h-16 rounded-full bg-[#F0FFF4] flex items-center justify-center">
                  <CheckCircle size={36} weight="fill" className="text-[#34A853]" />
                </div>
                <div className="text-center">
                  <p className="text-[18px] font-semibold text-[var(--color-text)]">
                    Importação Concluída
                  </p>
                  <p className="text-[14px] text-[var(--color-text-muted)] mt-1">
                    <strong>{importResult.imported}</strong> de {importResult.total} registros importados com sucesso
                  </p>
                  {importResult.skipped > 0 && (
                    <p className="text-[13px] text-orange-600 mt-1">
                      {importResult.skipped} linha(s) ignorada(s) por campos obrigatórios faltando
                    </p>
                  )}
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 max-h-[200px] overflow-y-auto">
                  <p className="text-[13px] font-semibold text-orange-800 mb-2">
                    Avisos ({importResult.errors.length})
                  </p>
                  {importResult.errors.map((err, i) => (
                    <p key={i} className="text-[12px] text-orange-700 py-0.5">
                      {err}
                    </p>
                  ))}
                </div>
              )}

              <div className="flex justify-center gap-3">
                <button
                  onClick={reset}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-[500px] border border-[var(--color-border)] text-[13px] font-medium hover:bg-[var(--color-bg-subtle)] transition-colors"
                >
                  <ArrowsClockwise size={14} />
                  Nova Importação
                </button>
                <PillButton onClick={() => {
                  if (objectType === "leads") navigate("/crm/leads");
                  else if (objectType === "accounts") navigate("/crm/contas");
                  else if (objectType === "contacts") navigate("/crm/contatos");
                  else if (objectType === "opportunities") navigate("/crm/oportunidades");
                }}>
                  Ver Registros
                  <CaretRight size={14} weight="bold" />
                </PillButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  EXPORT WIZARD                                                      */
/* ================================================================== */

type ExportStep = 1 | 2 | 3;

function ExportWizard() {
  const [step, setStep] = useState<ExportStep>(1);

  // Step 1
  const [objectType, setObjectType] = useState<ObjectType | null>(null);
  const [crmFields, setCrmFields] = useState<SheetCrmField[]>([]);
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());
  const [loadingFields, setLoadingFields] = useState(false);

  // Step 2
  const [sheetUrl, setSheetUrl] = useState("");
  const [tabName, setTabName] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState<SheetExportResult | null>(null);
  const [exportError, setExportError] = useState("");

  const handleLoadFields = async (obj: ObjectType) => {
    setObjectType(obj);
    setLoadingFields(true);
    try {
      const fields = await sheetsGetFields(obj);
      setCrmFields(fields);
      // Select all fields by default
      setSelectedFields(new Set(fields.map((f) => f.key)));
    } catch (err: any) {
      console.error("Error loading fields:", err);
    } finally {
      setLoadingFields(false);
    }
  };

  const handleExport = async () => {
    if (!objectType || !sheetUrl.trim() || !tabName.trim() || selectedFields.size === 0) return;
    setExporting(true);
    setExportError("");
    try {
      const result = await sheetsExport(sheetUrl, tabName, objectType, Array.from(selectedFields));
      setExportResult(result);
      setStep(3);
    } catch (err: any) {
      setExportError(err.message || "Erro ao exportar");
    } finally {
      setExporting(false);
    }
  };

  const reset = () => {
    setStep(1);
    setObjectType(null);
    setCrmFields([]);
    setSelectedFields(new Set());
    setSheetUrl("");
    setTabName("");
    setExportResult(null);
    setExportError("");
  };

  const toggleAll = () => {
    if (selectedFields.size === crmFields.length) {
      setSelectedFields(new Set());
    } else {
      setSelectedFields(new Set(crmFields.map((f) => f.key)));
    }
  };

  return (
    <div className="max-w-[900px]">
      {/* Steps indicator */}
      <div className="flex items-center gap-2 mb-6">
        {[
          { n: 1, label: "Objeto & Campos" },
          { n: 2, label: "Planilha Destino" },
          { n: 3, label: "Resultado" },
        ].map((s, i) => (
          <div key={s.n} className="flex items-center gap-2">
            {i > 0 && <div className="w-6 h-px bg-[var(--color-border)]" />}
            <StepBadge step={s.n} active={step === s.n} done={step > s.n} />
            <span
              className={`text-[13px] ${
                step === s.n ? "font-semibold text-[var(--color-text)]" : "text-[var(--color-text-muted)]"
              }`}
            >
              {s.label}
            </span>
          </div>
        ))}
      </div>

      <ServiceAccountBanner />
      <KeyConfigBanner />

      <div className="mt-6">
        <AnimatePresence mode="wait">
          {/* ─── Step 1 ─── */}
          {step === 1 && (
            <motion.div key="e1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              <div>
                <label className="text-[13px] font-semibold text-[var(--color-text)] mb-3 block">
                  Objeto CRM para exportar
                </label>
                <ObjectSelector
                  value={objectType}
                  onChange={(v) => handleLoadFields(v)}
                />
              </div>

              {loadingFields && <LoadingSpinner text="Carregando campos..." />}

              {crmFields.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-[13px] font-semibold text-[var(--color-text)]">
                      Campos para exportar ({selectedFields.size}/{crmFields.length})
                    </label>
                    <button
                      onClick={toggleAll}
                      className="text-[12px] text-[var(--color-primary)] hover:underline"
                    >
                      {selectedFields.size === crmFields.length ? "Desmarcar todos" : "Selecionar todos"}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {crmFields.map((f) => {
                      const checked = selectedFields.has(f.key);
                      return (
                        <label
                          key={f.key}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all ${
                            checked
                              ? "bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/30"
                              : "bg-white border border-[var(--color-border)] hover:border-[var(--color-border-hover)]"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              setSelectedFields((prev) => {
                                const next = new Set(prev);
                                if (next.has(f.key)) next.delete(f.key);
                                else next.add(f.key);
                                return next;
                              });
                            }}
                            className="accent-[var(--color-primary)]"
                          />
                          <span className="text-[13px]">{f.label}</span>
                          {f.required && <span className="text-[10px] text-red-400">*</span>}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <PillButton
                  onClick={() => setStep(2)}
                  disabled={!objectType || selectedFields.size === 0}
                >
                  Continuar
                  <CaretRight size={14} weight="bold" />
                </PillButton>
              </div>
            </motion.div>
          )}

          {/* ─── Step 2 ─── */}
          {step === 2 && (
            <motion.div key="e2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
              <div>
                <label className="text-[13px] font-semibold text-[var(--color-text)] mb-2 block">
                  URL da Planilha de Destino
                </label>
                <input
                  type="text"
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="w-full h-10 px-4 rounded-xl border border-[var(--color-border)] bg-white text-[14px] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] transition-all placeholder:text-[var(--color-text-muted)]/50"
                />
              </div>

              <div>
                <label className="text-[13px] font-semibold text-[var(--color-text)] mb-2 block">
                  Nome da Aba
                </label>
                <input
                  type="text"
                  value={tabName}
                  onChange={(e) => setTabName(e.target.value)}
                  placeholder={`Ex: ${OBJECTS.find((o) => o.key === objectType)?.label || "Dados"} Export`}
                  className="w-full h-10 px-4 rounded-xl border border-[var(--color-border)] bg-white text-[14px] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] transition-all placeholder:text-[var(--color-text-muted)]/50"
                />
                <p className="text-[12px] text-[var(--color-text-muted)] mt-1.5">
                  Se a aba já existir, os dados serão substituídos. Se não, uma nova aba será criada.
                </p>
              </div>

              {exportError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
                  <Warning size={16} className="text-red-500 shrink-0" />
                  <span className="text-[13px] text-red-700">{exportError}</span>
                </div>
              )}

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="text-[13px] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors flex items-center gap-1"
                >
                  <ArrowLeft size={14} /> Voltar
                </button>
                <PillButton
                  onClick={handleExport}
                  disabled={!sheetUrl.trim() || !tabName.trim() || exporting}
                >
                  {exporting ? (
                    <>
                      <SpinnerGap size={16} className="animate-spin" />
                      Exportando...
                    </>
                  ) : (
                    <>
                      <UploadSimple size={14} weight="bold" />
                      Exportar para Sheets
                    </>
                  )}
                </PillButton>
              </div>
            </motion.div>
          )}

          {/* ─── Step 3: Result ─── */}
          {step === 3 && exportResult && (
            <motion.div key="e3" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="space-y-5">
              <div className="flex flex-col items-center py-8 gap-4">
                <div className="w-16 h-16 rounded-full bg-[#F0FFF4] flex items-center justify-center">
                  <CheckCircle size={36} weight="fill" className="text-[#34A853]" />
                </div>
                <div className="text-center">
                  <p className="text-[18px] font-semibold text-[var(--color-text)]">
                    Exportação Concluída
                  </p>
                  <p className="text-[14px] text-[var(--color-text-muted)] mt-1">
                    <strong>{exportResult.exported}</strong> registros exportados com <strong>{exportResult.totalFields}</strong> colunas
                  </p>
                  {exportResult.message && (
                    <p className="text-[13px] text-orange-600 mt-1">{exportResult.message}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-center gap-3">
                <button
                  onClick={reset}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-[500px] border border-[var(--color-border)] text-[13px] font-medium hover:bg-[var(--color-bg-subtle)] transition-colors"
                >
                  <ArrowsClockwise size={14} />
                  Nova Exportação
                </button>
                <a
                  href={sheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-[500px] bg-[var(--color-primary)] text-white text-[13px] font-medium hover:opacity-90 transition-opacity"
                >
                  <Table size={14} weight="bold" />
                  Abrir Planilha
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}