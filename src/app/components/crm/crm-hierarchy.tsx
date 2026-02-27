import { useState, useEffect, useCallback } from "react";
import {
  TreeStructure,
  Network,
  SpinnerGap,
  WarningCircle,
  Check,
  FloppyDisk,
  CaretDown,
  CaretRight,
  Eye,
  PencilSimple,
  Trash,
  Plus,
  ShieldCheck,
  Crown,
  User,
  EyeSlash,
  Lock,
  Info,
} from "@phosphor-icons/react";
import {
  getPermissions,
  savePermissions,
  type PermissionsMatrix,
  type ObjectPermissions,
  type PermissionLevel,
} from "./crm-api";
import { ZeniteToggle } from "../zenite-toggle";

/* ================================================================== */
/*  Design tokens                                                      */
/* ================================================================== */

const ff = { fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" };

/* ================================================================== */
/*  Data config                                                        */
/* ================================================================== */

interface CrmObject {
  key: string;
  label: string;
  description: string;
}

const CRM_OBJECTS: CrmObject[] = [
  { key: "leads", label: "Leads", description: "Controle de acesso para registros de leads no CRM" },
  { key: "oportunidades", label: "Oportunidades", description: "Gerenciamento de oportunidades e pipeline de vendas" },
  { key: "contas", label: "Contas", description: "Registros de empresas e contas ativas" },
  { key: "contatos", label: "Contatos", description: "Pessoas vinculadas a contas e oportunidades" },
  { key: "atividades", label: "Atividades", description: "Historico de atividades, tarefas e ligacoes" },
  { key: "propostas", label: "Propostas", description: "Propostas comerciais vinculadas a oportunidades" },
];

interface RoleDef {
  key: string;
  label: string;
  color: string;
  bg: string;
  icon: React.ComponentType<any>;
}

const ROLES: RoleDef[] = [
  { key: "admin", label: "Admin", color: "#ED5200", bg: "#FFEDEB", icon: Crown },
  { key: "gerente", label: "Gerente", color: "#0483AB", bg: "#DCF0FF", icon: ShieldCheck },
  { key: "membro", label: "Membro", color: "#4E6987", bg: "#EBF1FA", icon: User },
  { key: "viewer", label: "Visualizador", color: "#917822", bg: "#FEEDCA", icon: EyeSlash },
];

interface ActionDef {
  key: string;
  label: string;
  icon: React.ComponentType<any>;
  type: "level" | "toggle";
  critical?: boolean;
}

const ACTIONS: ActionDef[] = [
  { key: "exibir", label: "Exibir", icon: Eye, type: "level" },
  { key: "criar", label: "Criar", icon: Plus, type: "toggle" },
  { key: "editar", label: "Editar", icon: PencilSimple, type: "level" },
  { key: "excluir", label: "Excluir", icon: Trash, type: "level", critical: true },
];

const LEVELS: { value: PermissionLevel; label: string; short: string }[] = [
  { value: "todos", label: "Todos os registros", short: "Todos" },
  { value: "proprios", label: "Somente proprios", short: "Proprios" },
  { value: "nenhum", label: "Nenhum acesso", short: "Nenhum" },
];

/* ================================================================== */
/*  Default permissions                                                */
/* ================================================================== */

function defaultPermissions(): PermissionsMatrix {
  const matrix: PermissionsMatrix = {};
  for (const role of ROLES) {
    matrix[role.key] = {};
    for (const obj of CRM_OBJECTS) {
      if (role.key === "admin") {
        matrix[role.key][obj.key] = { exibir: "todos", criar: true, editar: "todos", excluir: "todos" };
      } else if (role.key === "gerente") {
        matrix[role.key][obj.key] = { exibir: "todos", criar: true, editar: "todos", excluir: "proprios" };
      } else if (role.key === "membro") {
        matrix[role.key][obj.key] = { exibir: "todos", criar: true, editar: "proprios", excluir: "nenhum" };
      } else {
        matrix[role.key][obj.key] = { exibir: "todos", criar: false, editar: "nenhum", excluir: "nenhum" };
      }
    }
  }
  return matrix;
}

/* ================================================================== */
/*  Permission level dropdown                                          */
/* ================================================================== */

function LevelDropdown({
  value,
  onChange,
  disabled,
}: {
  value: PermissionLevel;
  onChange: (v: PermissionLevel) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const current = LEVELS.find((l) => l.value === value)!;

  const colorMap: Record<PermissionLevel, { text: string; bg: string }> = {
    todos: { text: "#0483AB", bg: "#DCF0FF" },
    proprios: { text: "#4E6987", bg: "#EBF1FA" },
    nenhum: { text: "#98989d", bg: "#F6F7F9" },
  };

  const c = colorMap[value];

  return (
    <div className="relative">
      <button
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className="flex items-center gap-[5px] h-[26px] px-[8px] rounded-[6px] transition-all cursor-pointer hover:ring-1 hover:ring-[#DDE3EC]"
        style={{ backgroundColor: c.bg, opacity: disabled ? 0.5 : 1, ...ff }}
      >
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: -0.3, color: c.text }}>
          {current.short}
        </span>
        {!disabled && <CaretDown size={9} style={{ color: c.text }} />}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute top-[calc(100%+4px)] right-0 bg-white rounded-[10px] p-1 z-50 min-w-[170px]"
            style={{
              boxShadow: "0px 8px 24px rgba(18,34,50,0.12), 0px 2px 6px rgba(18,34,50,0.06)",
              border: "0.7px solid rgba(200,207,219,0.5)",
            }}
          >
            {LEVELS.map((l) => {
              const selected = l.value === value;
              return (
                <button
                  key={l.value}
                  onClick={() => {
                    onChange(l.value);
                    setOpen(false);
                  }}
                  className="flex items-center gap-[8px] w-full px-[10px] py-[7px] rounded-[7px] hover:bg-[#F6F7F9] transition-colors cursor-pointer"
                >
                  <span
                    className="flex-1 text-left text-[#28415C]"
                    style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...ff }}
                  >
                    {l.label}
                  </span>
                  {selected && <Check size={12} weight="bold" className="text-[#0483AB]" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/* ================================================================== */
/*  Toggle switch for boolean permissions (criar)                      */
/* ================================================================== */

function PermToggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className="relative flex items-center h-[22px] w-[38px] rounded-full transition-colors cursor-pointer"
      style={{
        backgroundColor: checked ? "#07ABDE" : "#DDE3EC",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <div
        className="size-[16px] rounded-full bg-white shadow-sm transition-transform"
        style={{ transform: checked ? "translateX(19px)" : "translateX(3px)" }}
      />
    </button>
  );
}

/* ================================================================== */
/*  Object permissions section (expandable)                            */
/* ================================================================== */

function ObjectSection({
  obj,
  matrix,
  onChange,
}: {
  obj: CrmObject;
  matrix: PermissionsMatrix;
  onChange: (role: string, objKey: string, action: string, value: any) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="bg-white rounded-[16px] overflow-hidden">
      {/* Section header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-3 w-full px-5 py-3.5 hover:bg-[#F6F7F9] transition-colors cursor-pointer rounded-t-[16px]"
      >
        <div className="text-[#4E6987]">
          {expanded ? <CaretDown size={14} weight="bold" /> : <CaretRight size={14} weight="bold" />}
        </div>
        <div className="flex-1 text-left">
          <span
            className="text-[#122232] block"
            style={{ fontSize: 14, fontWeight: 700, letterSpacing: -0.3, ...ff }}
          >
            {obj.label}
          </span>
          <span
            className="text-[#98989d] block"
            style={{ fontSize: 11, fontWeight: 500, letterSpacing: -0.2, ...ff }}
          >
            {obj.description}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="px-5 py-3">
          {/* Column headers (roles) */}
          <div className="flex items-center border-b border-[#EBF1FA] pb-2 pt-2">
            <div className="w-[160px] shrink-0">
              <span
                className="text-[#98989d] uppercase"
                style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, ...ff }}
              >
                Quem pode
              </span>
            </div>
            <div className="flex-1 grid grid-cols-4 gap-2">
              {ROLES.map((r) => {
                const Icon = r.icon;
                return (
                  <div key={r.key} className="flex items-center justify-center gap-[5px]">
                    <Icon size={12} weight="fill" style={{ color: r.color }} />
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: -0.2, color: r.color, ...ff }}>
                      {r.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action rows */}
          {ACTIONS.map((action, idx) => {
            const ActionIcon = action.icon;
            const isLast = idx === ACTIONS.length - 1;
            return (
              <div
                key={action.key}
                className={`flex items-center py-3 ${!isLast ? "border-b border-[#F6F7F9]" : ""}`}
              >
                {/* Action label */}
                <div className="w-[160px] shrink-0 flex items-center gap-2.5">
                  <div
                    className="flex items-center justify-center size-[24px] rounded-[6px] shrink-0"
                    style={{ backgroundColor: action.critical ? "#FFEDEB" : "#F6F7F9" }}
                  >
                    <ActionIcon
                      size={13}
                      weight="duotone"
                      style={{ color: action.critical ? "#ED5200" : "#4E6987" }}
                    />
                  </div>
                  <div>
                    <span
                      className="text-[#28415C] block"
                      style={{ fontSize: 12, fontWeight: 600, letterSpacing: -0.3, lineHeight: "16px", ...ff }}
                    >
                      {action.label}
                    </span>
                    {action.critical && (
                      <span
                        className="text-[#ED5200] uppercase"
                        style={{ fontSize: 8, fontWeight: 800, letterSpacing: 0.5, lineHeight: "12px", ...ff }}
                      >
                        critico
                      </span>
                    )}
                  </div>
                </div>

                {/* Role cells */}
                <div className="flex-1 grid grid-cols-4 gap-2">
                  {ROLES.map((role) => {
                    const perms = matrix[role.key]?.[obj.key];
                    if (!perms) return <div key={role.key} />;

                    const isAdmin = role.key === "admin";

                    if (action.type === "toggle") {
                      return (
                        <div key={role.key} className="flex items-center justify-center">
                          {isAdmin ? (
                            <div className="flex items-center gap-1">
                              <Lock size={11} className="text-[#98989d]" />
                              <span style={{ fontSize: 10, fontWeight: 600, color: "#98989d", ...ff }}>
                                Sempre
                              </span>
                            </div>
                          ) : (
                            <ZeniteToggle
                              active={perms[action.key as "criar"]}
                              onChange={() => onChange(role.key, obj.key, action.key, !perms[action.key as "criar"])}
                            />
                          )}
                        </div>
                      );
                    }

                    return (
                      <div key={role.key} className="flex items-center justify-center">
                        {isAdmin ? (
                          <div className="flex items-center gap-1">
                            <Lock size={11} className="text-[#98989d]" />
                            <span style={{ fontSize: 10, fontWeight: 600, color: "#98989d", ...ff }}>
                              Todos
                            </span>
                          </div>
                        ) : (
                          <LevelDropdown
                            value={perms[action.key as keyof ObjectPermissions] as PermissionLevel}
                            onChange={(v) => onChange(role.key, obj.key, action.key, v)}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  Main page                                                          */
/* ================================================================== */

export function CrmHierarchy() {
  const [matrix, setMatrix] = useState<PermissionsMatrix>(defaultPermissions);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ── Load ── */
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await getPermissions();
        if (data && typeof data === "object" && Object.keys(data).length > 0) {
          // Merge with defaults to ensure all objects/roles exist
          const merged = defaultPermissions();
          for (const role of ROLES) {
            if (data[role.key]) {
              for (const obj of CRM_OBJECTS) {
                if (data[role.key][obj.key]) {
                  merged[role.key][obj.key] = { ...merged[role.key][obj.key], ...data[role.key][obj.key] };
                }
              }
            }
          }
          setMatrix(merged);
        }
      } catch (err: any) {
        console.error("Error loading permissions:", err);
        setError(err.message || "Erro ao carregar permissoes");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ── Change handler ── */
  const handleChange = useCallback((role: string, objKey: string, action: string, value: any) => {
    setMatrix((prev) => {
      const next = { ...prev };
      next[role] = { ...next[role] };
      next[role][objKey] = { ...next[role][objKey], [action]: value };
      return next;
    });
    setDirty(true);
    setSaved(false);
  }, []);

  /* ── Save ── */
  const handleSave = async () => {
    try {
      setSaving(true);
      await savePermissions(matrix);
      setDirty(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      console.error("Error saving permissions:", err);
      setError(err.message || "Erro ao salvar permissoes");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden">
      {/* ═══════ TOP HEADER ═══════ */}
      <div className="bg-white rounded-[16px] p-[20px] mb-[12px] shrink-0">
        <div className="flex items-center gap-[12px]">
          <div
            className="flex items-center justify-center size-[36px] rounded-[8px] shrink-0"
            style={{ backgroundColor: "#DDE3EC" }}
          >
            <Network size={20} weight="duotone" style={{ color: "#4E6987" }} />
          </div>
          <div className="flex-1">
            <span
              className="text-[#28415c] block"
              style={{ fontSize: 19, fontWeight: 700, letterSpacing: -0.5, lineHeight: "24px", ...ff }}
            >
              Hierarquia & Permissoes
            </span>
            <span
              className="text-[#98989d] block"
              style={{ fontSize: 13, fontWeight: 500, letterSpacing: -0.3, ...ff }}
            >
              Defina permissoes de acesso, visualizacao, edicao e exclusao por perfil
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <Info size={12} weight="fill" className="text-[#0483AB] shrink-0" />
              <span
                className="text-[#98989d]"
                style={{ fontSize: 11, fontWeight: 500, letterSpacing: -0.2, lineHeight: "16px", ...ff }}
              >
                Admins tem acesso total e nao podem ser restritos. Altere o perfil na pagina de Usuarios.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {saved && (
              <div
                className="flex items-center gap-[5px] h-[28px] px-[10px] rounded-full"
                style={{ backgroundColor: "#D9F8EF", ...ff }}
              >
                <Check size={12} weight="bold" className="text-[#3CCEA7]" />
                <span style={{ fontSize: 11, fontWeight: 700, color: "#3CCEA7", letterSpacing: -0.3 }}>
                  Salvo
                </span>
              </div>
            )}
            <button
              onClick={handleSave}
              disabled={!dirty || saving}
              className="flex items-center gap-[6px] h-[32px] px-[14px] rounded-full transition-all cursor-pointer"
              style={{
                backgroundColor: dirty ? "#3CCEA7" : "#DDE3EC",
                color: dirty ? "#fff" : "#98989d",
                opacity: saving ? 0.7 : 1,
                ...ff,
              }}
            >
              {saving ? (
                <SpinnerGap size={14} weight="bold" className="animate-spin" />
              ) : (
                <FloppyDisk size={14} weight="bold" />
              )}
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: -0.3 }}>
                {saving ? "Salvando..." : "Salvar"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ═══════ CONTENT ═══════ */}
      <div className="flex-1 rounded-[16px] overflow-hidden flex flex-col min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-[200px] gap-2">
            <SpinnerGap size={20} className="text-[#0483AB] animate-spin" />
            <span className="text-[#4E6987]" style={{ fontSize: 13, fontWeight: 500, ...ff }}>
              Carregando permissoes...
            </span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-[200px] gap-2">
            <WarningCircle size={20} className="text-[#ED5200]" />
            <span className="text-[#ED5200]" style={{ fontSize: 13, fontWeight: 500, ...ff }}>
              {error}
            </span>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto bg-[#f0f2f500]">
            {/* Permission sections */}
            <div className="flex flex-col gap-3">
              {CRM_OBJECTS.map((obj) => (
                <ObjectSection
                  key={obj.key}
                  obj={obj}
                  matrix={matrix}
                  onChange={handleChange}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}