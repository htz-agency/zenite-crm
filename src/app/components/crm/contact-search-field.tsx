import { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  IdentificationCard,
  PencilSimple,
  MagnifyingGlass,
  X,
  ArrowSquareOut,
  LinkBreak,
  CircleNotch,
  Check,
} from "@phosphor-icons/react";
import { listContacts, getContact, type DbContact } from "./crm-api";

/* ================================================================== */
/*  Types                                                              */
/* ================================================================== */

interface ContactSearchFieldProps {
  /** Label shown above the value */
  label?: string;
  /** Display name of the currently linked contact */
  value: string;
  /** Raw contact ID (CO-XXXX) — used for navigation link */
  contactId: string | null;
  /** Called when the user selects a different contact */
  onSelect?: (contactId: string, contactName: string) => void;
  /** Called when the user unlinks the contact */
  onUnlink?: () => void;
  /** Navigate to contact detail */
  onNavigate?: (contactId: string) => void;
  className?: string;
}

/* ================================================================== */
/*  Styles (matching EditableField palette)                            */
/* ================================================================== */

const fontFeature = { fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" };

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  lineHeight: "14px",
  fontWeight: 500,
  letterSpacing: 0.8,
  ...fontFeature,
};

const valueStyle: React.CSSProperties = {
  fontSize: 15,
  lineHeight: "20px",
  fontWeight: 500,
  ...fontFeature,
};

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */

export function ContactSearchField({
  label = "DECISOR",
  value,
  contactId,
  onSelect,
  onUnlink,
  onNavigate,
  className = "",
}: ContactSearchFieldProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [contacts, setContacts] = useState<DbContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  /* ── Auto-resolve: if value looks like an ID (CO-XXXX), fetch the real name ── */
  const [resolvedName, setResolvedName] = useState<string | null>(null);
  useEffect(() => {
    // If value is already a human name (doesn't look like an ID), use it directly
    if (!value || !value.startsWith("CT-")) {
      setResolvedName(null);
      return;
    }
    // value looks like an ID — resolve from contactId
    const target = contactId || value;
    let cancelled = false;
    (async () => {
      try {
        const ct = await getContact(target);
        if (ct && !cancelled) {
          const name = [ct.name, ct.last_name].filter(Boolean).join(" ");
          setResolvedName(name || null);
        }
      } catch {
        // keep value as-is
      }
    })();
    return () => { cancelled = true; };
  }, [value, contactId]);

  /** The display name: resolved name takes priority over raw value */
  const displayName = resolvedName || value;

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /* ── Portal dropdown position ── */
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null);

  const updateDropdownPos = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setDropdownPos({
      top: rect.bottom + 2,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  /* ── Fetch contacts once when dropdown opens ── */
  const fetchContacts = useCallback(async () => {
    if (fetched) return;
    setLoading(true);
    try {
      const data = await listContacts();
      setContacts(data);
      setFetched(true);
    } catch (err) {
      console.error("ContactSearchField: error fetching contacts:", err);
    } finally {
      setLoading(false);
    }
  }, [fetched]);

  const openDropdown = useCallback(() => {
    setOpen(true);
    setQuery("");
    updateDropdownPos();
    fetchContacts();
  }, [fetchContacts, updateDropdownPos]);

  const closeDropdown = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  /* ── Click outside ── */
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current && !containerRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        closeDropdown();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, closeDropdown]);

  /* ── Reposition on scroll / resize while open ── */
  useEffect(() => {
    if (!open) return;
    const reposition = () => updateDropdownPos();
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open, updateDropdownPos]);

  /* ── Auto-focus search input ── */
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  /* ── Filtered results ── */
  const q = query.toLowerCase().trim();
  const filtered = q
    ? contacts.filter(
        (c) => {
          const fullName = `${c.name} ${c.last_name ?? ""}`.toLowerCase();
          return (
            fullName.includes(q) ||
            c.id.toLowerCase().includes(q) ||
            (c.email ?? "").toLowerCase().includes(q) ||
            (c.role ?? "").toLowerCase().includes(q) ||
            (c.company ?? "").toLowerCase().includes(q)
          );
        },
      )
    : contacts;

  const getDisplayName = (c: DbContact) => {
    const parts = [c.name, c.last_name].filter(Boolean);
    return parts.join(" ") || c.id;
  };

  const handleSelect = (contact: DbContact) => {
    onSelect?.(contact.id, getDisplayName(contact));
    closeDropdown();
  };

  const handleUnlink = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUnlink?.();
    closeDropdown();
  };

  /* ── Derived styles ── */
  const isIdle = !open;
  const border = open ? "border-[#07abde]" : "border-transparent";
  const pad = open ? "p-[5px]" : "p-[6px]";
  const hoverBg = isIdle ? "hover:bg-[#f6f7f9]" : "";
  const labelColor = open ? "text-[#07abde]" : "text-[#98989d]";
  const valueColor = "text-[#4e6987]";

  return (
    <div
      ref={containerRef}
      onClick={() => { if (isIdle) openDropdown(); }}
      className={`group/field relative flex flex-col gap-0 rounded-[8px] transition-all duration-150 border ${border} ${pad} ${hoverBg} ${isIdle ? "cursor-pointer" : ""} ${className}`}
    >
      {/* ── Label ── */}
      <div className="flex items-center gap-[2px]">
        <span className={`${labelColor} uppercase block`} style={labelStyle}>
          {label}
        </span>
      </div>

      {/* ── Value row ── */}
      <div className="flex items-center gap-[6px] min-w-0 overflow-hidden min-h-[22px]">
        <IdentificationCard size={14} weight="duotone" className={isIdle ? "text-[#98989d]" : "text-[#4e6987]"} />

        {open ? (
          /* Search input */
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={displayName || "Buscar contato…"}
            className="text-[#4e6987] bg-transparent outline-none flex-1 min-w-0"
            style={valueStyle}
            onKeyDown={(e) => {
              if (e.key === "Escape") closeDropdown();
            }}
          />
        ) : (
          /* Display value */
          <span className={`${valueColor} truncate text-[#07abde]`} style={valueStyle}>
            {displayName || "—"}
          </span>
        )}
      </div>

      {/* ── Dropdown ── */}
      {open && dropdownPos && (
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-[9999] bg-white rounded-[8px] border border-[#dde3ec] shadow-lg max-h-[220px] overflow-y-auto"
            style={{ top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width }}
          >
            {/* Search hint */}
            <div className="flex items-center gap-[6px] px-[10px] py-[6px] border-b border-[#f0f2f5]">
              <MagnifyingGlass size={12} weight="bold" className="text-[#98989d] shrink-0" />
              <span className="text-[#98989d] text-[11px]" style={fontFeature}>
                {loading ? "Carregando contatos…" : `${filtered.length} contato${filtered.length !== 1 ? "s" : ""} encontrado${filtered.length !== 1 ? "s" : ""}`}
              </span>
              {loading && <CircleNotch size={12} weight="bold" className="text-[#07abde] animate-spin" />}
            </div>

            {/* Unlink option (if currently linked) */}
            {contactId && (
              <button
                onClick={handleUnlink}
                className="w-full flex items-center gap-[8px] px-[10px] py-[7px] hover:bg-[#fff5f5] transition-colors cursor-pointer text-left"
              >
                <LinkBreak size={14} weight="duotone" className="text-[#f56233] shrink-0" />
                <span className="text-[#f56233] text-[12px] font-medium" style={fontFeature}>
                  Remover vínculo
                </span>
              </button>
            )}

            {/* Contact list */}
            {!loading && filtered.length === 0 && (
              <div className="px-[10px] py-[12px] text-center">
                <span className="text-[#98989d] text-[12px]" style={fontFeature}>
                  Nenhum contato encontrado
                </span>
              </div>
            )}

            {filtered.map((contact) => {
              const isCurrent = contact.id === contactId;
              const displayName = getDisplayName(contact);
              return (
                <button
                  key={contact.id}
                  onClick={() => handleSelect(contact)}
                  className={`w-full flex items-center gap-[8px] px-[10px] py-[7px] transition-colors cursor-pointer text-left ${
                    isCurrent ? "bg-[#d9f8ef]" : "hover:bg-[#f6f7f9]"
                  }`}
                >
                  <IdentificationCard size={14} weight="duotone" className={isCurrent ? "text-[#3ccea7] shrink-0" : "text-[#98989d] shrink-0"} />
                  <span className={`text-[10px] shrink-0 ${isCurrent ? "text-[#083226]" : "text-[#98989d]"}`} style={{ ...fontFeature, fontFamily: "'DM Mono', monospace" }}>
                    {contact.id}
                  </span>
                  <span className={`text-[12px] font-medium truncate ${isCurrent ? "text-[#083226]" : "text-[#4e6987]"}`} style={fontFeature}>
                    {displayName}
                  </span>
                  {contact.role && (
                    <span
                      className={`text-[10px] truncate ${isCurrent ? "text-[#083226]/60" : "text-[#98989d]"}`}
                      style={fontFeature}
                    >
                      {contact.role}
                    </span>
                  )}
                </button>
              );
            })}
          </div>,
          document.body,
        )
      )}

      {/* ── Action buttons (right) ── */}
      <div className="absolute right-[5px] top-[10px] flex items-center gap-[2px]">
        {/* Open — navigate to linked contact */}
        {isIdle && contactId && onNavigate && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(contactId);
            }}
            className="hidden group-hover/field:flex items-center justify-center size-[16px] rounded-full bg-[#dcf0ff] text-[#07abde] hover:bg-[#c4e4fa] cursor-pointer transition-colors"
            title="Abrir contato"
          >
            <ArrowSquareOut size={9} weight="bold" />
          </button>
        )}

        {/* Idle → pencil on hover */}
        {isIdle && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              openDropdown();
            }}
            className="hidden group-hover/field:flex items-center justify-center size-[16px] rounded-full bg-[#dde3ec] text-[#4e6987] hover:bg-[#c8cfdb] cursor-pointer transition-colors"
            title="Alterar decisor"
          >
            <PencilSimple size={9} weight="bold" />
          </button>
        )}

        {/* Open → X (close) */}
        {open && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              closeDropdown();
            }}
            className="flex items-center justify-center size-[16px] rounded-full bg-[#dcf0ff] text-[#07abde] hover:bg-[#c4e4fa] cursor-pointer transition-colors"
          >
            <X size={9} weight="bold" />
          </button>
        )}
      </div>
    </div>
  );
}