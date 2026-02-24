import { useState, useEffect, useRef } from "react";
import {
  X,
  CaretDown,
  Building,
  Heart,
  SketchLogo,
  IdentificationCard,
  MagnifyingGlass,
  CircleNotch,
  Warning,
  ArrowSquareRight,
  UserCircle,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";
import {
  listAccounts,
  listContacts,
  listOpportunities,
  convertLead,
  type ConvertLeadPayload,
  type DbAccount,
  type DbContact,
  type DbOpportunity,
} from "./crm-api";

/* ------------------------------------------------------------------ */
/*  Shared styles                                                      */
/* ------------------------------------------------------------------ */

const ff = { fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" };

/* ------------------------------------------------------------------ */
/*  Object palette — single source of truth                            */
/* ------------------------------------------------------------------ */

const OBJ = {
  lead:    { Icon: Heart,              bg: "#feedca", color: "#eac23d" },
  account: { Icon: Building,           bg: "#d9f8ef", color: "#3ccea7" },
  contact: { Icon: IdentificationCard, bg: "#ffedeb", color: "#ff8c76" },
  opp:     { Icon: SketchLogo,         bg: "#dcf0ff", color: "#07abde" },
} as const;

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ConvertLeadModalProps {
  open: boolean;
  onClose: () => void;
  onConverted: (result: {
    accountId: string;
    contactId: string;
    opportunityId?: string;
  }) => void;
  lead: {
    id: string;
    name: string;
    lastName?: string;
    company: string;
    email: string;
    owner: string;
    phone?: string;
    role?: string;
  };
}

type SectionMode = "create" | "existing";

/* ------------------------------------------------------------------ */
/*  Small helpers                                                      */
/* ------------------------------------------------------------------ */

function RadioOption({
  selected,
  onClick,
  label,
  accent,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  accent: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-[6px] cursor-pointer group/radio"
    >
      <div
        className="size-[16px] rounded-full border-[2px] flex items-center justify-center transition-colors"
        style={{
          borderColor: selected ? accent : "#C8CFDB",
          backgroundColor: selected ? accent : "white",
        }}
      >
        {selected && <div className="size-[5px] rounded-full bg-white" />}
      </div>
      <span
        className={selected ? "text-[#122232]" : "text-[#4e6987]"}
        style={{ fontSize: 12, fontWeight: selected ? 700 : 500, letterSpacing: -0.3, lineHeight: "16px", ...ff }}
      >
        {label}
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Picker for existing records                                        */
/* ------------------------------------------------------------------ */

function Picker<T extends { id: string; name: string }>({
  items,
  loading,
  selected,
  onSelect,
  placeholder,
  renderItem,
}: {
  items: T[];
  loading: boolean;
  selected: T | null;
  onSelect: (item: T | null) => void;
  placeholder: string;
  renderItem?: (item: T) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const filtered = items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative" ref={ref}>
      <div
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-[6px] h-[36px] px-[10px] rounded-[8px] border-[1.5px] cursor-pointer transition-colors ${
          open ? "border-[#07abde] bg-white" : "border-[#DDE3EC] bg-[#f6f7f9] hover:border-[#C8CFDB]"
        }`}
      >
        {selected ? (
          <div className="flex items-center gap-[4px] flex-1 min-w-0">
            <span className="text-[#122232] truncate" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...ff }}>
              {selected.name}
            </span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onSelect(null); }}
              className="shrink-0 text-[#98989d] hover:text-[#4e6987] transition-colors"
            >
              <X size={10} weight="bold" />
            </button>
          </div>
        ) : (
          <span className="text-[#98989d] flex-1 truncate" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...ff }}>
            {placeholder}
          </span>
        )}
        <CaretDown size={10} weight="bold" className={`text-[#4E6987] transition-transform shrink-0 ${open ? "rotate-180" : ""}`} />
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-[40px] left-0 right-0 z-50 bg-white rounded-[10px] overflow-hidden"
            style={{ border: "1.4px solid rgba(200,207,219,0.6)", boxShadow: "0px 4px 12px rgba(18,34,50,0.15)" }}
          >
            <div className="flex items-center gap-[6px] px-[10px] h-[32px] border-b border-[#DDE3EC]">
              <MagnifyingGlass size={12} className="text-[#98989d] shrink-0" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar..."
                className="flex-1 bg-transparent outline-none text-[#122232]"
                style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...ff }}
                autoFocus
              />
            </div>
            <div className="max-h-[130px] overflow-auto">
              {loading ? (
                <div className="flex items-center justify-center py-[12px]">
                  <CircleNotch size={16} weight="bold" className="text-[#07abde] animate-spin" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="px-[10px] py-[10px]">
                  <span className="text-[#98989d]" style={{ fontSize: 11, fontWeight: 500, ...ff }}>
                    {search ? "Nenhum resultado" : "0 registros"}
                  </span>
                </div>
              ) : (
                filtered.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => { onSelect(item); setOpen(false); setSearch(""); }}
                    className={`flex items-center gap-[6px] w-full px-[10px] py-[6px] hover:bg-[#f6f7f9] transition-colors text-left cursor-pointer ${
                      selected?.id === item.id ? "bg-[#DCF0FF]" : ""
                    }`}
                  >
                    {renderItem ? renderItem(item) : (
                      <span className="text-[#122232] truncate" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...ff }}>
                        {item.name}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Object Column (one per entity)                                     */
/* ------------------------------------------------------------------ */

function ObjColumn({
  palette,
  title,
  mode,
  setMode,
  createLabel,
  existLabel,
  newName,
  setNewName,
  inputPh,
  items,
  loading,
  selected,
  onSelect,
  pickerPh,
  renderItem,
  disabled,
  topSlot,
}: {
  palette: (typeof OBJ)[keyof typeof OBJ];
  title: string;
  mode: SectionMode;
  setMode: (m: SectionMode) => void;
  createLabel: string;
  existLabel: string;
  newName: string;
  setNewName: (v: string) => void;
  inputPh: string;
  items: any[];
  loading: boolean;
  selected: any;
  onSelect: (i: any) => void;
  pickerPh: string;
  renderItem?: (i: any) => React.ReactNode;
  disabled?: boolean;
  topSlot?: React.ReactNode;
}) {
  const { Icon, bg, color } = palette;

  return (
    <div
      className={`flex-1 flex flex-col rounded-[14px] overflow-hidden transition-opacity ${
        disabled ? "opacity-40 pointer-events-none" : ""
      }`}
      style={{ minWidth: 0, backgroundColor: "#F6F7F9" }}
    >
      {/* header strip */}
      <div className="flex items-center gap-[8px] px-[14px] py-[10px]" style={{ backgroundColor: bg + "60" }}>
        <div className="flex items-center justify-center size-[28px] rounded-[8px] shrink-0" style={{ backgroundColor: bg }}>
          <Icon size={16} weight="duotone" style={{ color }} />
        </div>
        <span className="text-[#122232]" style={{ fontSize: 14, fontWeight: 700, letterSpacing: -0.4, lineHeight: "20px", ...ff }}>
          {title}
        </span>
      </div>

      {/* body */}
      <div className="flex flex-col gap-[10px] px-[14px] py-[12px] flex-1">
        {topSlot}

        {/* radios */}
        <div className="flex flex-col gap-[6px]">
          <RadioOption selected={mode === "create"} onClick={() => setMode("create")} label={createLabel} accent={color} />
          <RadioOption selected={mode === "existing"} onClick={() => setMode("existing")} label={existLabel} accent={color} />
        </div>

        {/* create input */}
        {mode === "create" && (
          <div className="flex flex-col gap-[3px]">
            <label className="text-[#98989d] uppercase" style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, lineHeight: "16px", ...ff }}>
              Nome *
            </label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="h-[36px] px-[10px] rounded-[8px] border-[1.5px] border-[#DDE3EC] bg-[#f6f7f9] text-[#122232] outline-none focus:border-[#07abde] focus:bg-white transition-colors"
              style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...ff }}
              placeholder={inputPh}
            />
          </div>
        )}

        {/* existing picker */}
        {mode === "existing" && (
          <Picker items={items} loading={loading} selected={selected} onSelect={onSelect} placeholder={pickerPh} renderItem={renderItem} />
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Modal                                                         */
/* ------------------------------------------------------------------ */

export function ConvertLeadModal({ open, onClose, onConverted, lead }: ConvertLeadModalProps) {
  /* ---- state ---- */
  const [accountMode, setAccountMode] = useState<SectionMode>("create");
  const [newAccountName, setNewAccountName] = useState(lead.company || "");
  const [existingAccount, setExistingAccount] = useState<DbAccount | null>(null);

  const [contactMode, setContactMode] = useState<SectionMode>("create");
  const [newContactName, setNewContactName] = useState(lead.name || "");
  const [existingContact, setExistingContact] = useState<DbContact | null>(null);

  const [createOpp, setCreateOpp] = useState(true);
  const [oppName, setOppName] = useState(`${lead.company || lead.name} — Oportunidade`);
  const [existingOpp, setExistingOpp] = useState<DbOpportunity | null>(null);
  const [oppMode, setOppMode] = useState<SectionMode>("create");

  const [owner, setOwner] = useState(lead.owner || "");

  const [accounts, setAccounts] = useState<DbAccount[]>([]);
  const [contacts, setContacts] = useState<DbContact[]>([]);
  const [opportunities, setOpportunities] = useState<DbOpportunity[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [loadingOpps, setLoadingOpps] = useState(false);

  const [converting, setConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ---- reset on open ---- */
  useEffect(() => {
    if (!open) return;
    setNewAccountName(lead.company || "");
    setNewContactName(lead.name || "");
    setOppName(`${lead.company || lead.name} — Oportunidade`);
    setOwner(lead.owner || "");
    setAccountMode("create");
    setContactMode("create");
    setOppMode("create");
    setCreateOpp(true);
    setExistingAccount(null);
    setExistingContact(null);
    setExistingOpp(null);
    setError(null);
    setConverting(false);

    setLoadingAccounts(true);
    listAccounts().then(setAccounts).catch(console.error).finally(() => setLoadingAccounts(false));
    setLoadingContacts(true);
    listContacts().then(setContacts).catch(console.error).finally(() => setLoadingContacts(false));
    setLoadingOpps(true);
    listOpportunities().then(setOpportunities).catch(console.error).finally(() => setLoadingOpps(false));
  }, [open, lead]);

  /* ---- convert handler ---- */
  const handleConvert = async () => {
    setError(null);
    setConverting(true);
    try {
      const payload: ConvertLeadPayload = {
        account:
          accountMode === "existing" && existingAccount
            ? { mode: "existing", id: existingAccount.id }
            : { mode: "create", name: newAccountName },
        contact:
          contactMode === "existing" && existingContact
            ? { mode: "existing", id: existingContact.id }
            : { mode: "create", name: newContactName, lastName: lead.lastName },
        opportunity:
          !createOpp
            ? { mode: "skip" }
            : oppMode === "create"
            ? { mode: "create", name: oppName }
            : { mode: "skip" },
        owner,
      };
      const result = await convertLead(lead.id, payload);
      onConverted({ accountId: result.accountId, contactId: result.contactId, opportunityId: result.opportunityId });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      console.error("Lead conversion error:", err);
    } finally {
      setConverting(false);
    }
  };

  if (!open) return null;

  /* ---- render helpers for pickers ---- */
  const renderAccItem = (item: DbAccount) => (
    <div className="flex items-center gap-[6px]">
      <Building size={12} weight="duotone" style={{ color: OBJ.account.color }} className="shrink-0" />
      <span className="text-[#122232] truncate" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...ff }}>{item.name}</span>
      <span className="text-[#98989d] shrink-0 ml-auto" style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, ...ff }}>{item.id}</span>
    </div>
  );

  const renderCtItem = (item: DbContact & { name: string }) => (
    <div className="flex items-center gap-[6px]">
      <IdentificationCard size={12} weight="duotone" style={{ color: OBJ.contact.color }} className="shrink-0" />
      <span className="text-[#122232] truncate" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...ff }}>{item.name}</span>
      <span className="text-[#98989d] shrink-0 ml-auto" style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, ...ff }}>{item.id}</span>
    </div>
  );

  const renderOpItem = (item: DbOpportunity) => (
    <div className="flex items-center gap-[6px]">
      <SketchLogo size={12} weight="duotone" style={{ color: OBJ.opp.color }} className="shrink-0" />
      <span className="text-[#122232] truncate" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...ff }}>{item.name}</span>
      <span className="text-[#98989d] shrink-0 ml-auto" style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, ...ff }}>{item.id}</span>
    </div>
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-[2px]"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-[16px]"
          >
            <div
              className="bg-white rounded-[20px] w-full max-w-[940px] flex flex-col overflow-hidden"
              style={{ boxShadow: "0px 8px 32px rgba(18,34,50,0.2), 0px 2px 8px rgba(18,34,50,0.1)" }}
            >
              {/* ═══ Header ═══ */}
              <div className="flex items-center justify-between px-[28px] py-[20px] border-b border-[#DDE3EC]">
                <div className="flex items-center gap-[12px]">
                  {/* Lead icon */}
                  <div className="flex items-center justify-center size-[40px] rounded-[10px] shrink-0" style={{ backgroundColor: OBJ.lead.bg }}>
                    <Heart size={20} weight="duotone" style={{ color: OBJ.lead.color }} />
                  </div>
                  <div className="flex flex-col gap-[2px]">
                    <span className="text-[#64676c] uppercase" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "14px", ...ff }}>
                      CONVERTER LEAD
                    </span>
                    <span className="text-[#122232]" style={{ fontSize: 19, fontWeight: 700, letterSpacing: -0.5, lineHeight: "24px", ...ff }}>
                      {lead.name}
                    </span>
                  </div>
                  {/* Meta pills */}
                  <div className="flex items-center gap-[8px] ml-[8px]">
                    {lead.company && (
                      <span className="flex items-center gap-[5px] h-[26px] px-[10px] rounded-[500px] bg-[#f6f7f9] text-[#4e6987]" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...ff }}>
                        <Building size={13} weight="duotone" className="text-[#98989d]" />
                        {lead.company}
                      </span>
                    )}
                    {lead.email && (
                      <span className="flex items-center h-[26px] px-[10px] rounded-[500px] bg-[#f6f7f9] text-[#4e6987]" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...ff }}>
                        {lead.email}
                      </span>
                    )}
                    <span className="text-[#98989d]" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, ...ff }}>{lead.id}</span>
                  </div>
                </div>
                <button onClick={onClose} className="flex items-center justify-center size-[36px] rounded-full hover:bg-[#f6f7f9] text-[#28415c] transition-colors cursor-pointer">
                  <X size={18} weight="bold" />
                </button>
              </div>

              {/* ═══ Error ═══ */}
              {error && (
                <div className="flex items-center gap-[8px] bg-[#FFEDEB] px-[24px] py-[10px]">
                  <Warning size={16} weight="fill" className="text-[#ED5200] shrink-0" />
                  <span className="text-[#B13B00]" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...ff }}>{error}</span>
                </div>
              )}

              {/* ═══ Body — 3 columns ═══ */}
              <div className="flex gap-[12px] px-[20px] py-[16px]">
                {/* Conta */}
                <ObjColumn
                  palette={OBJ.account}
                  title="Conta"
                  mode={accountMode}
                  setMode={setAccountMode}
                  createLabel="Criar nova conta"
                  existLabel="Vincular existente"
                  newName={newAccountName}
                  setNewName={setNewAccountName}
                  inputPh="Nome da empresa"
                  items={accounts}
                  loading={loadingAccounts}
                  selected={existingAccount}
                  onSelect={setExistingAccount}
                  pickerPh="Buscar conta..."
                  renderItem={renderAccItem}
                />

                {/* Contato */}
                <ObjColumn
                  palette={OBJ.contact}
                  title="Contato"
                  mode={contactMode}
                  setMode={setContactMode}
                  createLabel="Criar novo contato"
                  existLabel="Vincular existente"
                  newName={newContactName}
                  setNewName={setNewContactName}
                  inputPh="Nome completo"
                  items={contacts.map((c) => ({ ...c, name: `${c.name} ${c.last_name || ""}`.trim() }))}
                  loading={loadingContacts}
                  selected={existingContact ? { ...existingContact, name: `${existingContact.name} ${existingContact.last_name || ""}`.trim() } : null}
                  onSelect={(item: any) => {
                    if (!item) { setExistingContact(null); return; }
                    const orig = contacts.find((c) => c.id === item.id) ?? null;
                    setExistingContact(orig);
                  }}
                  pickerPh="Buscar contato..."
                  renderItem={renderCtItem}
                />

                {/* Oportunidade */}
                <ObjColumn
                  palette={OBJ.opp}
                  title="Oportunidade"
                  mode={oppMode}
                  setMode={setOppMode}
                  createLabel="Criar nova oportunidade"
                  existLabel="Vincular existente"
                  newName={oppName}
                  setNewName={setOppName}
                  inputPh="Nome da oportunidade"
                  items={opportunities}
                  loading={loadingOpps}
                  selected={existingOpp}
                  onSelect={setExistingOpp}
                  pickerPh="Buscar oportunidade..."
                  renderItem={renderOpItem}
                  disabled={!createOpp}
                  topSlot={
                    <label className="flex items-center gap-[6px] cursor-pointer group/check mb-[2px]">
                      <div
                        className={`size-[16px] rounded-[4px] border-[1.5px] flex items-center justify-center transition-colors ${
                          !createOpp
                            ? "border-[#07abde] bg-[#07abde]"
                            : "border-[#C8CFDB] bg-white group-hover/check:border-[#4E6987]"
                        }`}
                      >
                        {!createOpp && (
                          <svg viewBox="0 0 16 16" fill="none" className="size-[10px]">
                            <path d="M4 8L7 11L12 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      <span className="text-[#4e6987]" style={{ fontSize: 11, fontWeight: 500, letterSpacing: -0.3, lineHeight: "16px", ...ff }}>
                        Pular oportunidade
                      </span>
                    </label>
                  }
                />
              </div>

              {/* ═══ Footer ═══ */}
              <div className="flex items-center justify-between px-[20px] py-[12px] border-t border-[#DDE3EC]">
                {/* Owner pill */}
                <div className="flex items-center gap-[6px] h-[36px] px-[12px] rounded-[500px] bg-[#f6f7f9]">
                  <UserCircle size={16} weight="duotone" className="text-[#07ABDE] shrink-0" />
                  <input
                    value={owner}
                    onChange={(e) => setOwner(e.target.value)}
                    className="bg-transparent outline-none text-[#122232] w-[150px]"
                    style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...ff }}
                    placeholder="Proprietario *"
                  />
                  {owner && (
                    <button type="button" onClick={() => setOwner("")} className="shrink-0 text-[#98989d] hover:text-[#4e6987] transition-colors cursor-pointer">
                      <X size={10} weight="bold" />
                    </button>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-[8px]">
                  <button
                    onClick={onClose}
                    disabled={converting}
                    className="flex items-center justify-center h-[36px] px-[18px] rounded-[500px] border-[1.5px] border-[#DDE3EC] text-[#4e6987] hover:bg-[#f6f7f9] transition-colors cursor-pointer disabled:opacity-50"
                    style={{ fontSize: 13, fontWeight: 500, letterSpacing: -0.5, ...ff }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConvert}
                    disabled={converting || !owner.trim()}
                    className="flex items-center justify-center gap-[6px] h-[36px] px-[20px] rounded-[500px] bg-[#07ABDE] text-white hover:bg-[#0483AB] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ fontSize: 13, fontWeight: 700, letterSpacing: -0.5, ...ff }}
                  >
                    {converting ? (
                      <>
                        <CircleNotch size={14} weight="bold" className="animate-spin" />
                        Convertendo...
                      </>
                    ) : (
                      <>
                        <ArrowSquareRight size={14} weight="bold" />
                        Converter
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}