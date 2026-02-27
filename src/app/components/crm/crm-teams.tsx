/**
 * CRM Teams — CRUD for teams, with member picker from auth.users.
 *
 * Visual style matches CrmUsers page. Data stored in kv_store via /teams API.
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  UsersThree,
  MagnifyingGlass,
  SpinnerGap,
  Plus,
  Trash,
  PencilSimple,
  X,
  Check,
  Crown,
  CaretDown,
  WarningCircle,
  Palette,
  CalendarBlank,
  Clock,
  Cube,
  Sticker,
} from "@phosphor-icons/react";
import { TEAM_ICONS, getTeamIconComponent } from "./team-icons";
import { motion, AnimatePresence } from "motion/react";
import {
  listTeams,
  createTeam,
  updateTeam,
  deleteTeam,
  listTeamMembers,
  type CrmTeam,
  type TeamMember,
} from "./crm-api";
import { toast } from "sonner";
import { PillButton } from "../pill-button";

/* ================================================================== */
/*  Style tokens                                                       */
/* ================================================================== */

const ff = { fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" };

/* ================================================================== */
/*  Color palette for teams                                            */
/* ================================================================== */

const TEAM_COLORS = [
  { value: "#4E6987", label: "Azul Cinza" },
  { value: "#0483AB", label: "Azul" },
  { value: "#07ABDE", label: "Ciano" },
  { value: "#3CCEA7", label: "Verde" },
  { value: "#135543", label: "Verde Escuro" },
  { value: "#EAC23D", label: "Amarelo" },
  { value: "#ED5200", label: "Laranja" },
  { value: "#F56233", label: "Vermelho" },
  { value: "#FF8C76", label: "Coral" },
  { value: "#8C8CD4", label: "Roxo" },
  { value: "#431100", label: "Marrom" },
  { value: "#28415C", label: "Azul Marinho" },
];

/* Full system color palette from theme.css */
const SYSTEM_PALETTE = [
  {
    name: "Blue Berry",
    tag: "Brand / Info",
    colors: [
      { value: "#DCF0FF", label: "bg" },
      { value: "#73D0FF", label: "100" },
      { value: "#07ABDE", label: "200" },
      { value: "#0483AB", label: "300" },
      { value: "#025E7B", label: "400" },
      { value: "#013B4F", label: "500" },
      { value: "#001B26", label: "600" },
    ],
  },
  {
    name: "Green Mint",
    tag: "Success",
    colors: [
      { value: "#D9F8EF", label: "bg" },
      { value: "#4BFACB", label: "100" },
      { value: "#23E6B2", label: "200" },
      { value: "#3CCEA7", label: "300" },
      { value: "#135543", label: "400" },
      { value: "#083226", label: "500" },
      { value: "#02140E", label: "600" },
    ],
  },
  {
    name: "Red Cherry",
    tag: "Danger",
    colors: [
      { value: "#FFEDEB", label: "bg" },
      { value: "#FFC6BE", label: "100" },
      { value: "#FF8C76", label: "200" },
      { value: "#ED5200", label: "300" },
      { value: "#B13B00", label: "400" },
      { value: "#782500", label: "500" },
      { value: "#431100", label: "600" },
    ],
  },
  {
    name: "Yellow Mustard",
    tag: "Warning",
    colors: [
      { value: "#FEEDCA", label: "bg" },
      { value: "#F5DA82", label: "100" },
      { value: "#EAC23D", label: "200" },
      { value: "#917822", label: "300" },
      { value: "#685516", label: "400" },
      { value: "#42350A", label: "500" },
      { value: "#1F1803", label: "600" },
    ],
  },
  {
    name: "Purple Pie",
    tag: "Accent",
    colors: [
      { value: "#E8E8FD", label: "bg" },
      { value: "#B0B0D6", label: "100" },
      { value: "#8C8CD4", label: "200" },
      { value: "#6868B1", label: "300" },
      { value: "#4E4E91", label: "400" },
      { value: "#31315C", label: "500" },
      { value: "#14142C", label: "600" },
    ],
  },
  {
    name: "Cloud & Navy",
    tag: "Neutrals",
    colors: [
      { value: "#FFFFFF", label: "white" },
      { value: "#F6F7F9", label: "bg" },
      { value: "#C8CFDB", label: "100" },
      { value: "#D9D9D9", label: "200" },
      { value: "#4E6987", label: "300" },
      { value: "#28415C", label: "400" },
      { value: "#122232", label: "500" },
    ],
  },
];

/* Helper: find color label across both TEAM_COLORS and SYSTEM_PALETTE */
function resolveColorLabel(hex: string): string {
  const tc = TEAM_COLORS.find((c) => c.value === hex);
  if (tc) return tc.label;
  for (const group of SYSTEM_PALETTE) {
    const match = group.colors.find((c) => c.value.toLowerCase() === hex.toLowerCase());
    if (match) return `${group.name} ${match.label}`;
  }
  return hex;
}

/* ================================================================== */
/*  Date helpers                                                       */
/* ================================================================== */

function formatDate(iso: string | null): string {
  if (!iso) return "--";
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

/* ================================================================== */
/*  Member Avatar                                                      */
/* ================================================================== */

function MemberAvatar({ member, size = 28 }: { member: TeamMember; size?: number }) {
  const initials = (member.name || "U").charAt(0).toUpperCase();
  if (member.avatarUrl) {
    return (
      <img
        src={member.avatarUrl}
        alt=""
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="flex items-center justify-center rounded-full bg-[#0483AB] text-white shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.45, fontWeight: 700 }}
    >
      {initials}
    </div>
  );
}

/* ================================================================== */
/*  Member Picker                                                      */
/* ================================================================== */

function MemberPicker({
  allMembers,
  selectedIds,
  onChange,
  leaderId,
  onLeaderChange,
}: {
  allMembers: TeamMember[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  leaderId: string | null;
  onLeaderChange: (id: string | null) => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return allMembers;
    const q = search.toLowerCase();
    return allMembers.filter(
      (m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
    );
  }, [allMembers, search]);

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((sid) => sid !== id));
      if (leaderId === id) onLeaderChange(null);
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Search */}
      <div className="relative flex items-center gap-[8px] h-[34px] px-[10px] bg-[#DDE3EC] rounded-full">
        <div className="flex items-center justify-center shrink-0 size-[22px]">
          <MagnifyingGlass size={14} weight="bold" className="text-[#4E6987]" />
        </div>
        <input
          type="text"
          placeholder="Buscar membros..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none text-[#122232] placeholder-[#4E6987] w-full"
          style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...ff }}
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="flex items-center justify-center shrink-0 size-[22px] rounded-full hover:bg-[#C8CFDB] transition-colors cursor-pointer"
          >
            <X size={10} weight="bold" className="text-[#4E6987]" />
          </button>
        )}
        {/* Inner shadow overlay */}
        <div
          className="absolute inset-0 pointer-events-none rounded-[inherit]"
          style={{ boxShadow: "inset 0px -0.5px 1px 0px rgba(255,255,255,0.3), inset 0px -0.5px 1px 0px rgba(255,255,255,0.25), inset 0px 1.5px 4px 0px rgba(0,0,0,0.08), inset 0px 1.5px 4px 0px rgba(0,0,0,0.1)" }}
        />
      </div>

      {/* Member list */}
      <div className="max-h-[240px] overflow-y-auto flex flex-col gap-1">
        {filtered.map((m) => {
          const selected = selectedIds.includes(m.id);
          const isLeader = leaderId === m.id;
          return (
            <div
              key={m.id}
              className={`flex items-center gap-3 px-3 py-2 rounded-[10px] cursor-pointer transition-colors ${
                selected ? "bg-[#EBF1FA]" : "hover:bg-[#F6F7F9]"
              }`}
              onClick={() => toggle(m.id)}
            >
              <div className="relative">
                <MemberAvatar member={m} size={30} />
                {selected && (
                  <div className="absolute -bottom-0.5 -right-0.5 size-[14px] rounded-full bg-[#0483AB] flex items-center justify-center">
                    <Check size={9} weight="bold" className="text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span
                  className="text-[#28415C] block truncate"
                  style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.3, ...ff }}
                >
                  {m.name}
                </span>
                <span
                  className="text-[#98989d] block truncate"
                  style={{ fontSize: 11, fontWeight: 500, letterSpacing: -0.2, ...ff }}
                >
                  {m.email}
                </span>
              </div>
              {selected && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onLeaderChange(isLeader ? null : m.id);
                  }}
                  className={`flex items-center gap-1 h-[24px] px-2 rounded-full transition-all text-[11px] font-bold tracking-tight ${
                    isLeader
                      ? "bg-[#FEEDCA] text-[#917822]"
                      : "bg-[#F6F7F9] text-[#98989d] hover:bg-[#EBF1FA] hover:text-[#4E6987]"
                  }`}
                  style={ff}
                  title={isLeader ? "Remover como lider" : "Definir como lider"}
                >
                  <Crown size={11} weight={isLeader ? "fill" : "duotone"} />
                  <span style={{ fontSize: 10, letterSpacing: 0.3 }}>
                    {isLeader ? "LIDER" : "LIDER?"}
                  </span>
                </button>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="flex items-center justify-center py-6">
            <span className="text-[#98989d]" style={{ fontSize: 12, fontWeight: 500, ...ff }}>
              Nenhum membro encontrado
            </span>
          </div>
        )}
      </div>

      {/* Summary */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-2 pt-1 border-t border-[#EBF1FA]">
          <span className="text-[#98989d]" style={{ fontSize: 11, fontWeight: 600, ...ff }}>
            {selectedIds.length} selecionado{selectedIds.length > 1 ? "s" : ""}
          </span>
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  Create/Edit Modal                                                  */
/* ================================================================== */

function TeamModal({
  team,
  allMembers,
  onSave,
  onClose,
}: {
  team: CrmTeam | null; // null = create mode
  allMembers: TeamMember[];
  onSave: (data: {
    name: string;
    description: string;
    color: string;
    icon?: string;
    members: string[];
    leaderId: string | null;
  }) => void;
  onClose: () => void;
}) {
  const isEdit = !!team;
  const [name, setName] = useState(team?.name ?? "");
  const [description, setDescription] = useState(team?.description ?? "");
  const [color, setColor] = useState(team?.color ?? "#4E6987");
  const [icon, setIcon] = useState<string>(team?.icon ?? "UsersThree");
  const [members, setMembers] = useState<string[]>(team?.members ?? []);
  const [leaderId, setLeaderId] = useState<string | null>(team?.leaderId ?? null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [iconSearch, setIconSearch] = useState("");

  const valid = name.trim().length > 0;
  const SelectedIcon = getTeamIconComponent(icon);

  const filteredIcons = useMemo(() => {
    if (!iconSearch.trim()) return TEAM_ICONS;
    const q = iconSearch.toLowerCase();
    return TEAM_ICONS.filter(
      (i) => i.label.toLowerCase().includes(q) || i.value.toLowerCase().includes(q)
    );
  }, [iconSearch]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="relative bg-white rounded-[20px] w-[520px] max-h-[90vh] overflow-y-auto z-10"
        style={{
          boxShadow: "0px 24px 48px rgba(18,34,50,0.18), 0px 4px 12px rgba(18,34,50,0.08)",
          border: "0.7px solid rgba(200,207,219,0.4)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center size-[36px] rounded-[10px]"
              style={{ backgroundColor: color + "20" }}
            >
              <SelectedIcon size={20} weight="duotone" style={{ color }} />
            </div>
            <span
              className="text-[#28415c]"
              style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.5, ...ff }}
            >
              {isEdit ? "Editar equipe" : "Nova equipe"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center size-[32px] rounded-[10px] hover:bg-[#F6F7F9] transition-colors cursor-pointer"
          >
            <X size={16} weight="bold" className="text-[#98989d]" />
          </button>
        </div>

        <div className="px-6 pb-6 flex flex-col gap-5">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[#98989d] uppercase" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, ...ff }}>
              NOME DA EQUIPE *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Marketing, Vendas, CS..."
              className="h-[40px] px-3 rounded-[10px] bg-[#F6F7F9] outline-none text-[#28415C] placeholder:text-[#C8CFDB] focus:ring-2 focus:ring-[#0483AB]/30 transition-all"
              style={{ fontSize: 14, fontWeight: 500, letterSpacing: -0.3, border: "0.7px solid rgba(200,207,219,0.5)", ...ff }}
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[#98989d] uppercase" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, ...ff }}>DESCRIÇÃO</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descricao breve da equipe..."
              rows={2}
              className="px-3 py-2 rounded-[10px] bg-[#F6F7F9] outline-none text-[#28415C] placeholder:text-[#C8CFDB] resize-none focus:ring-2 focus:ring-[#0483AB]/30 transition-all"
              style={{ fontSize: 13, fontWeight: 500, letterSpacing: -0.3, border: "0.7px solid rgba(200,207,219,0.5)", ...ff }}
            />
          </div>

          {/* Icon & Color row */}
          <div className="grid grid-cols-2 gap-3">
            {/* Icon */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[#98989d] uppercase" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, ...ff }}>
                ICONE
              </label>
              <div className="relative">
                <button
                  onClick={() => { setShowIconPicker(!showIconPicker); setShowColorPicker(false); }}
                  className="flex items-center gap-2 h-[36px] px-3 rounded-[10px] bg-[#F6F7F9] hover:bg-[#EBF1FA] transition-colors cursor-pointer w-full"
                  style={{ border: "0.7px solid rgba(200,207,219,0.5)" }}
                >
                  <div
                    className="flex items-center justify-center size-[22px] rounded-[6px] shrink-0"
                    style={{ backgroundColor: color + "20" }}
                  >
                    <SelectedIcon size={14} weight="duotone" style={{ color }} />
                  </div>
                  <span className="text-[#28415C] truncate" style={{ fontSize: 13, fontWeight: 500, letterSpacing: -0.3, ...ff }}>
                    {TEAM_ICONS.find((i) => i.value === icon)?.label ?? "Equipe"}
                  </span>
                  <CaretDown size={12} className="text-[#98989d] ml-auto shrink-0" />
                </button>
                {showIconPicker && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowIconPicker(false)} />
                    <div
                      className="absolute top-[calc(100%+4px)] left-0 bg-white rounded-[14px] z-50 w-[320px] flex flex-col"
                      style={{
                        boxShadow: "0px 12px 32px rgba(18,34,50,0.16), 0px 2px 8px rgba(18,34,50,0.06)",
                        border: "0.7px solid rgba(200,207,219,0.5)",
                      }}
                    >
                      {/* Search */}
                      <div className="px-3 pt-3 pb-2">
                        <div className="relative flex items-center gap-[8px] h-[32px] px-[10px] bg-[#DDE3EC] rounded-full">
                          <div className="flex items-center justify-center shrink-0 size-[20px]">
                            <MagnifyingGlass size={13} weight="bold" className="text-[#4E6987]" />
                          </div>
                          <input
                            type="text"
                            placeholder="Buscar icone..."
                            value={iconSearch}
                            onChange={(e) => setIconSearch(e.target.value)}
                            className="flex-1 bg-transparent border-none outline-none text-[#122232] placeholder-[#4E6987] w-full"
                            style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...ff }}
                            autoFocus
                          />
                          {iconSearch && (
                            <button
                              onClick={() => setIconSearch("")}
                              className="flex items-center justify-center shrink-0 size-[20px] rounded-full hover:bg-[#C8CFDB] transition-colors cursor-pointer"
                            >
                              <X size={10} weight="bold" className="text-[#4E6987]" />
                            </button>
                          )}
                          {/* Inner shadow overlay */}
                          <div
                            className="absolute inset-0 pointer-events-none rounded-[inherit]"
                            style={{ boxShadow: "inset 0px -0.5px 1px 0px rgba(255,255,255,0.3), inset 0px -0.5px 1px 0px rgba(255,255,255,0.25), inset 0px 1.5px 4px 0px rgba(0,0,0,0.08), inset 0px 1.5px 4px 0px rgba(0,0,0,0.1)" }}
                          />
                        </div>
                      </div>
                      {/* Grid */}
                      <div className="px-3 pb-3 max-h-[240px] overflow-y-auto">
                        <div className="grid grid-cols-7 gap-1">
                          {filteredIcons.map((item) => {
                            const isSelected = icon === item.value;
                            return (
                              <button
                                key={item.value}
                                onClick={() => { setIcon(item.value); setShowIconPicker(false); setIconSearch(""); }}
                                className={`flex items-center justify-center size-[38px] rounded-[8px] cursor-pointer transition-all hover:bg-[#EBF1FA] ${
                                  isSelected ? "bg-[#EBF1FA] ring-2 ring-[#0483AB]/40" : ""
                                }`}
                                title={item.label}
                              >
                                <item.Icon
                                  size={20}
                                  weight={isSelected ? "fill" : "duotone"}
                                  style={{ color: isSelected ? color : "#4E6987" }}
                                />
                              </button>
                            );
                          })}
                        </div>
                        {filteredIcons.length === 0 && (
                          <div className="flex items-center justify-center py-4">
                            <span className="text-[#98989d]" style={{ fontSize: 12, fontWeight: 500, ...ff }}>
                              Nenhum icone encontrado
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Color */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[#98989d] uppercase" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, ...ff }}>
                COR
              </label>
              <div className="relative">
                <button
                  onClick={() => { setShowColorPicker(!showColorPicker); setShowIconPicker(false); }}
                  className="flex items-center gap-2 h-[36px] px-3 rounded-[10px] bg-[#F6F7F9] hover:bg-[#EBF1FA] transition-colors cursor-pointer w-full"
                  style={{ border: "0.7px solid rgba(200,207,219,0.5)" }}
                >
                  <div className="size-[18px] rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-[#28415C] truncate" style={{ fontSize: 13, fontWeight: 500, letterSpacing: -0.3, ...ff }}>
                    {resolveColorLabel(color)}
                  </span>
                  <CaretDown size={12} className="text-[#98989d] ml-auto shrink-0" />
                </button>
                {showColorPicker && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowColorPicker(false)} />
                    <div
                      className="absolute top-[calc(100%+4px)] right-0 bg-white rounded-[14px] z-50 flex flex-col"
                      style={{
                        boxShadow: "0px 12px 32px rgba(18,34,50,0.16), 0px 2px 8px rgba(18,34,50,0.06)",
                        border: "0.7px solid rgba(200,207,219,0.5)",
                      }}
                    >
                      <div className="p-2.5 flex flex-col gap-[5px]">
                        {SYSTEM_PALETTE.map((group) => (
                          <div key={group.name} className="flex gap-[5px]">
                              {group.colors.map((c) => {
                                const isSelected = color.toLowerCase() === c.value.toLowerCase();
                                const isLight = ["#DCF0FF", "#D9F8EF", "#FFEDEB", "#FEEDCA", "#E8E8FD", "#FFFFFF", "#F6F7F9", "#D9D9D9", "#C8CFDB", "#FFC6BE", "#F5DA82", "#B0B0D6", "#4BFACB", "#73D0FF"].includes(c.value);
                                return (
                                  <button
                                    key={c.value}
                                    onClick={() => { setColor(c.value); setShowColorPicker(false); }}
                                    className={`relative flex items-center justify-center size-[32px] rounded-[8px] cursor-pointer transition-all hover:scale-110 ${
                                      isSelected ? "ring-2 ring-offset-1 ring-[#0483AB]" : ""
                                    }`}
                                    style={{ backgroundColor: c.value, border: isLight ? "0.7px solid rgba(200,207,219,0.4)" : "none" }}
                                    title={`${group.name} ${c.label} — ${c.value}`}
                                  >
                                    {isSelected && (
                                      <Check size={13} weight="bold" className={isLight ? "text-[#28415C]" : "text-white"} />
                                    )}
                                  </button>
                                );
                              })}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Members */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[#98989d] uppercase" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, ...ff }}>
              MEMBROS
            </label>
            <MemberPicker
              allMembers={allMembers}
              selectedIds={members}
              onChange={setMembers}
              leaderId={leaderId}
              onLeaderChange={setLeaderId}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EBF1FA]">
            <button
              onClick={onClose}
              className="h-[36px] px-4 rounded-full bg-[#F6F7F9] text-[#F56233] hover:bg-[#FFEDEB] hover:text-[#F56233] transition-colors cursor-pointer"
              style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.3, ...ff }}
            >
              Cancelar
            </button>
            <button
              onClick={() => valid && onSave({ name: name.trim(), description, color, icon, members, leaderId })}
              disabled={!valid}
              className={`h-[36px] px-5 rounded-full text-white transition-all cursor-pointer ${
                valid ? "bg-[#3CCEA7] hover:bg-[#23E6B2]" : "bg-[#C8CFDB] cursor-not-allowed"
              }`}
              style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.3, ...ff }}
            >
              {isEdit ? "Salvar" : "Criar equipe"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ================================================================== */
/*  Delete confirm modal                                               */
/* ================================================================== */

function DeleteConfirmModal({
  teamName,
  onConfirm,
  onClose,
}: {
  teamName: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white rounded-[16px] w-[380px] p-6 z-10"
        style={{
          boxShadow: "0px 24px 48px rgba(18,34,50,0.18)",
          border: "0.7px solid rgba(200,207,219,0.4)",
        }}
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex items-center justify-center size-[48px] rounded-[12px] bg-[#FFEDEB]">
            <Trash size={24} weight="duotone" className="text-[#F56233]" />
          </div>
          <div>
            <h3
              className="text-[#28415C]"
              style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.5, ...ff }}
            >
              Excluir equipe?
            </h3>
            <p
              className="text-[#98989d] mt-1"
              style={{ fontSize: 13, fontWeight: 500, letterSpacing: -0.3, ...ff }}
            >
              A equipe <strong className="text-[#28415C]">{teamName}</strong> sera excluida permanentemente.
            </p>
          </div>
          <div className="flex items-center gap-2 w-full">
            <button
              onClick={onClose}
              className="flex-1 h-[36px] rounded-[10px] text-[#4E6987] hover:bg-[#F6F7F9] transition-colors cursor-pointer"
              style={{ fontSize: 13, fontWeight: 600, ...ff }}
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 h-[36px] rounded-[10px] bg-[#F56233] text-white hover:bg-[#E04E25] transition-colors cursor-pointer"
              style={{ fontSize: 13, fontWeight: 600, ...ff }}
            >
              Excluir
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ================================================================== */
/*  Team Detail Panel                                                  */
/* ================================================================== */

function TeamDetailPanel({
  team,
  allMembers,
  onEdit,
  onDelete,
  onClose,
}: {
  team: CrmTeam;
  allMembers: TeamMember[];
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const teamMembers = allMembers.filter((m) => team.members.includes(m.id));
  const leader = allMembers.find((m) => m.id === team.leaderId);
  const TeamIcon = getTeamIconComponent(team.icon);

  return (
    <div className="w-[320px] shrink-0 rounded-[16px] flex flex-col overflow-hidden bg-white h-full">
      {/* Header */}
      <div className="relative flex flex-col items-center pt-8 pb-5 px-5 shrink-0">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 flex items-center justify-center size-[28px] rounded-[8px] hover:bg-black/5 transition-colors cursor-pointer"
        >
          <X size={14} weight="bold" className="text-[#98989d]" />
        </button>

        <div
          className="flex items-center justify-center size-[56px] rounded-[16px] mb-3"
          style={{ backgroundColor: team.color + "20" }}
        >
          <TeamIcon size={28} weight="duotone" style={{ color: team.color }} />
        </div>

        <h2
          className="text-[#122232] text-center"
          style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.5, lineHeight: "20px", ...ff }}
        >
          {team.name}
        </h2>
        {team.description && (
          <span
            className="text-[#4E6987] mt-1 text-center"
            style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...ff }}
          >
            {team.description}
          </span>
        )}

        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 h-[28px] px-3 rounded-full bg-[#F6F7F9] text-[#0483AB] hover:bg-[#DCF0FF] hover:text-[#0483AB] transition-colors cursor-pointer"
            style={{ fontSize: 11, fontWeight: 700, letterSpacing: -0.3, ...ff }}
          >
            <PencilSimple size={12} weight="bold" />
            Editar
          </button>
          <button
            onClick={onDelete}
            className="flex items-center gap-1.5 h-[28px] px-3 rounded-full bg-[#F6F7F9] text-[#F56233] hover:bg-[#FFEDEB] hover:text-[#F56233] transition-colors cursor-pointer"
            style={{ fontSize: 11, fontWeight: 700, letterSpacing: -0.3, ...ff }}
          >
            <Trash size={12} weight="bold" />
            Excluir
          </button>
        </div>
      </div>

      <div className="h-px bg-[#EBF1FA] mx-5" />

      {/* Details */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="flex flex-col gap-3.5">
          <DetailRow icon={<Sticker size={15} weight="duotone" />} label="Icone">
            <div className="flex items-center gap-2">
              <div
                className="flex items-center justify-center size-[20px] rounded-[5px]"
                style={{ backgroundColor: team.color + "20" }}
              >
                <TeamIcon size={12} weight="duotone" style={{ color: team.color }} />
              </div>
              <span className="text-[#28415C]" style={{ fontSize: 13, fontWeight: 500, letterSpacing: -0.3, ...ff }}>
                {TEAM_ICONS.find((i) => i.value === team.icon)?.value ?? "UsersThree"}
              </span>
            </div>
          </DetailRow>

          <DetailRow icon={<Palette size={15} weight="duotone" />} label="Cor">
            <div className="flex items-center gap-2">
              <div className="size-[14px] rounded-full" style={{ backgroundColor: team.color }} />
              <span className="text-[#28415C]" style={{ fontSize: 13, fontWeight: 500, letterSpacing: -0.3, ...ff }}>
                {resolveColorLabel(team.color)}
              </span>
            </div>
          </DetailRow>

          {leader && (
            <DetailRow icon={<Crown size={15} weight="duotone" />} label="Lider">
              <div className="flex items-center gap-2">
                <MemberAvatar member={leader} size={20} />
                <span className="text-[#28415C] truncate" style={{ fontSize: 13, fontWeight: 500, letterSpacing: -0.3, ...ff }}>
                  {leader.name}
                </span>
              </div>
            </DetailRow>
          )}

          <DetailRow icon={<CalendarBlank size={15} weight="duotone" />} label="Criado em">
            <span className="text-[#28415C]" style={{ fontSize: 13, fontWeight: 500, letterSpacing: -0.3, ...ff }}>
              {formatDate(team.createdAt)}
            </span>
          </DetailRow>

          <DetailRow icon={<Clock size={15} weight="duotone" />} label="Atualizado em">
            <span className="text-[#28415C]" style={{ fontSize: 13, fontWeight: 500, letterSpacing: -0.3, ...ff }}>
              {formatDate(team.updatedAt)}
            </span>
          </DetailRow>
        </div>

        {/* Member list */}
        <div className="mt-5">
          <span className="text-[#98989d] uppercase" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, ...ff }}>
            MEMBROS ({teamMembers.length})
          </span>
          <div className="flex flex-col gap-1 mt-2">
            {teamMembers.length === 0 ? (
              <span className="text-[#C8CFDB]" style={{ fontSize: 12, fontWeight: 500, ...ff }}>
                Nenhum membro adicionado
              </span>
            ) : (
              teamMembers.map((m) => (
                <div key={m.id} className="flex items-center gap-2.5 py-1.5 px-1">
                  <MemberAvatar member={m} size={26} />
                  <div className="flex-1 min-w-0">
                    <span
                      className="text-[#28415C] block truncate"
                      style={{ fontSize: 12, fontWeight: 600, letterSpacing: -0.3, lineHeight: "16px", ...ff }}
                    >
                      {m.name}
                    </span>
                    <span
                      className="text-[#98989d] block truncate"
                      style={{ fontSize: 10, fontWeight: 500, letterSpacing: -0.2, lineHeight: "14px", ...ff }}
                    >
                      {m.email}
                    </span>
                  </div>
                  {m.id === team.leaderId && (
                    <Crown size={13} weight="fill" className="text-[#EAC23D] shrink-0" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex items-center justify-center size-[28px] rounded-[8px] bg-[#F6F7F9] text-[#4E6987] shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <span
          className="text-[#98989d] uppercase block"
          style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.4, lineHeight: "16px", ...ff }}
        >
          {label}
        </span>
        {children}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Team Card (grid view)                                              */
/* ================================================================== */

function TeamCard({
  team,
  allMembers,
  selected,
  onClick,
}: {
  team: CrmTeam;
  allMembers: TeamMember[];
  selected: boolean;
  onClick: () => void;
}) {
  const teamMembers = allMembers.filter((m) => team.members.includes(m.id));
  const leader = allMembers.find((m) => m.id === team.leaderId);
  const TeamIcon = getTeamIconComponent(team.icon);

  return (
    <button
      onClick={onClick}
      className={`flex flex-col p-4 rounded-[14px] text-left transition-all cursor-pointer w-full ${
        selected
          ? "bg-[#EBF1FA] ring-2 ring-[#0483AB]/30"
          : "bg-[#F6F7F9] hover:bg-[#EBF1FA]"
      }`}
      style={{ border: "0.7px solid rgba(200,207,219,0.3)" }}
    >
      <div className="flex items-start gap-3 w-full">
        <div
          className="flex items-center justify-center size-[40px] rounded-[12px] shrink-0"
          style={{ backgroundColor: team.color + "20" }}
        >
          <TeamIcon size={22} weight="duotone" style={{ color: team.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <span
            className="text-[#28415C] block truncate"
            style={{ fontSize: 15, fontWeight: 700, letterSpacing: -0.5, lineHeight: "20px", ...ff }}
          >
            {team.name}
          </span>
          {team.description && (
            <span
              className="text-[#98989d] block truncate mt-0.5"
              style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, lineHeight: "16px", ...ff }}
            >
              {team.description}
            </span>
          )}
        </div>
      </div>

      {/* Members avatars */}
      <div className="flex items-center gap-2 mt-3 w-full">
        <div className="flex -space-x-2">
          {teamMembers.slice(0, 5).map((m) => (
            <div key={m.id} className="ring-2 ring-white rounded-full">
              <MemberAvatar member={m} size={24} />
            </div>
          ))}
          {teamMembers.length > 5 && (
            <div
              className="flex items-center justify-center size-[24px] rounded-full bg-[#DDE3EC] text-[#4E6987] ring-2 ring-white"
              style={{ fontSize: 9, fontWeight: 700 }}
            >
              +{teamMembers.length - 5}
            </div>
          )}
        </div>
        <span className="text-[#98989d] ml-auto" style={{ fontSize: 11, fontWeight: 600, letterSpacing: -0.3, ...ff }}>
          {teamMembers.length} {teamMembers.length === 1 ? "membro" : "membros"}
        </span>
      </div>

      {/* Leader */}
      {leader && (
        <div className="flex items-center gap-1.5 mt-2">
          <Crown size={11} weight="fill" className="text-[#EAC23D]" />
          <span className="text-[#4E6987] truncate" style={{ fontSize: 11, fontWeight: 600, letterSpacing: -0.3, ...ff }}>
            {leader.name}
          </span>
        </div>
      )}
    </button>
  );
}

/* ================================================================== */
/*  Main Page Component                                                */
/* ================================================================== */

export function CrmTeams() {
  const [teams, setTeams] = useState<CrmTeam[]>([]);
  const [allMembers, setAllMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<CrmTeam | null>(null);
  const [modalTeam, setModalTeam] = useState<CrmTeam | null | "create">(null); // null=closed, "create"=new, CrmTeam=edit
  const [deleteTarget, setDeleteTarget] = useState<CrmTeam | null>(null);

  /* ── Load ── */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        // Load teams and members independently so one failure doesn't block the other
        let teamsData: CrmTeam[] = [];
        let membersData: TeamMember[] = [];
        const errors: string[] = [];

        try {
          teamsData = await listTeams();
          if (!Array.isArray(teamsData)) teamsData = [];
        } catch (e: any) {
          console.error("Error loading teams:", e);
          errors.push(`Equipes: ${e.message || e}`);
        }

        try {
          membersData = await listTeamMembers();
          if (!Array.isArray(membersData)) membersData = [];
        } catch (e: any) {
          console.error("Error loading team members:", e);
          errors.push(`Membros: ${e.message || e}`);
        }

        if (cancelled) return;
        setTeams(teamsData);
        setAllMembers(membersData);
        if (errors.length > 0) {
          setError(errors.join(" | "));
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message || "Erro ao carregar equipes");
        console.error("Error loading teams page:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  /* ── Filtered teams ── */
  const filtered = useMemo(() => {
    if (!Array.isArray(teams)) return [];
    if (!search.trim()) return teams;
    const q = search.toLowerCase();
    return teams.filter(
      (t) =>
        (t.name || "").toLowerCase().includes(q) ||
        (t.description || "").toLowerCase().includes(q)
    );
  }, [teams, search]);

  /* ── Handlers ── */
  const handleSave = useCallback(
    async (data: { name: string; description: string; color: string; icon?: string; members: string[]; leaderId: string | null }) => {
      try {
        if (modalTeam === "create") {
          const created = await createTeam(data);
          setTeams((prev) => [...prev, created]);
          toast.success(`Equipe "${created.name}" criada com sucesso!`);
        } else if (modalTeam && typeof modalTeam === "object") {
          const updated = await updateTeam(modalTeam.id, data);
          setTeams((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
          setSelectedTeam((prev) => (prev?.id === updated.id ? updated : prev));
          toast.success(`Equipe "${updated.name}" atualizada!`);
        }
        setModalTeam(null);
      } catch (err: any) {
        console.error("Error saving team:", err);
        toast.error(`Erro ao salvar equipe: ${err.message}`);
      }
    },
    [modalTeam]
  );

  const handleDelete = useCallback(
    async () => {
      if (!deleteTarget) return;
      try {
        await deleteTeam(deleteTarget.id);
        setTeams((prev) => prev.filter((t) => t.id !== deleteTarget.id));
        if (selectedTeam?.id === deleteTarget.id) setSelectedTeam(null);
        toast.success(`Equipe "${deleteTarget.name}" excluida.`);
        setDeleteTarget(null);
      } catch (err: any) {
        console.error("Error deleting team:", err);
        toast.error(`Erro ao excluir equipe: ${err.message}`);
      }
    },
    [deleteTarget, selectedTeam]
  );

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden">
      {/* ═══════ TOP HEADER ═══════ */}
      <div className="bg-white rounded-[16px] p-[20px] mb-[12px] shrink-0">
        <div className="flex items-center gap-[12px]">
          <div
            className="flex items-center justify-center size-[36px] rounded-[8px] shrink-0"
            style={{ backgroundColor: "#DDE3EC" }}
          >
            <UsersThree size={20} weight="duotone" style={{ color: "#4E6987" }} />
          </div>
          <div className="flex-1">
            <span
              className="text-[#28415c] block"
              style={{ fontSize: 19, fontWeight: 700, letterSpacing: -0.5, lineHeight: "24px", ...ff }}
            >
              Equipes
            </span>
            <span
              className="text-[#98989d] block"
              style={{ fontSize: 13, fontWeight: 500, letterSpacing: -0.3, ...ff }}
            >
              Organize membros em equipes para distribuicao de leads e oportunidades
            </span>
          </div>
          <div className="flex items-center gap-2">
            
            <PillButton
              onClick={() => setModalTeam("create")}
              icon={<Plus size={16} weight="bold" />}
            >
              Nova equipe
            </PillButton>
          </div>
        </div>
      </div>

      {/* ═══════ CONTENT ═══════ */}
      <div className="flex-1 flex flex-row gap-[12px] overflow-hidden min-h-0">
        {/* Left: grid */}
        <div className="flex-1 bg-white rounded-[16px] overflow-hidden flex flex-col min-w-0 min-h-0">
          {/* Search bar */}
          <div className="px-5 pt-4 pb-3 shrink-0">
            <div className="relative flex items-center gap-[10px] h-[40px] px-[10px] bg-[#DDE3EC] rounded-full">
              <div className="flex items-center justify-center shrink-0 size-[28px]">
                <MagnifyingGlass size={16} weight="bold" className="text-[#4E6987]" />
              </div>
              <input
                type="text"
                placeholder="Buscar equipes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-body text-[#122232] placeholder-[#4E6987] w-full"
                style={ff}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="flex items-center justify-center shrink-0 size-[28px] rounded-full hover:bg-[#C8CFDB] transition-colors cursor-pointer"
                >
                  <X size={12} weight="bold" className="text-[#4E6987]" />
                </button>
              )}
              {/* Inner shadow overlay */}
              <div
                className="absolute inset-0 pointer-events-none rounded-[inherit]"
                style={{ boxShadow: "inset 0px -0.5px 1px 0px rgba(255,255,255,0.3), inset 0px -0.5px 1px 0px rgba(255,255,255,0.25), inset 0px 1.5px 4px 0px rgba(0,0,0,0.08), inset 0px 1.5px 4px 0px rgba(0,0,0,0.1)" }}
              />
            </div>
          </div>

          {/* Grid */}
          <div className="flex-1 overflow-auto px-5 pt-1 pb-4">
            {loading ? (
              <div className="flex items-center justify-center h-[200px] gap-2">
                <SpinnerGap size={20} className="text-[#0483AB] animate-spin" />
                <span className="text-[#4E6987]" style={{ fontSize: 13, fontWeight: 500, ...ff }}>
                  Carregando equipes...
                </span>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-[200px] gap-2">
                <WarningCircle size={20} className="text-[#ED5200]" />
                <span className="text-[#ED5200]" style={{ fontSize: 13, fontWeight: 500, ...ff }}>
                  {error}
                </span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[300px] gap-3">
                <div className="flex items-center justify-center size-[56px] rounded-[16px] bg-[#EBF1FA]">
                  <UsersThree size={28} weight="duotone" className="text-[#C8CFDB]" />
                </div>
                <span className="text-[#98989d] text-center" style={{ fontSize: 14, fontWeight: 500, ...ff }}>
                  {search ? "Nenhuma equipe encontrada" : "Nenhuma equipe criada ainda"}
                </span>
                {!search && (
                  <PillButton
                    onClick={() => setModalTeam("create")}
                    icon={<Plus size={16} weight="bold" />}
                    className="mt-1"
                  >
                    Criar primeira equipe
                  </PillButton>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {filtered.map((team) => (
                  <TeamCard
                    key={team.id}
                    team={team}
                    allMembers={allMembers}
                    selected={selectedTeam?.id === team.id}
                    onClick={() => setSelectedTeam(selectedTeam?.id === team.id ? null : team)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: detail panel */}
        <AnimatePresence mode="wait">
          {selectedTeam && (
            <motion.div
              key={selectedTeam.id}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="h-full"
            >
              <TeamDetailPanel
                team={selectedTeam}
                allMembers={allMembers}
                onEdit={() => setModalTeam(selectedTeam)}
                onDelete={() => setDeleteTarget(selectedTeam)}
                onClose={() => setSelectedTeam(null)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═══════ MODALS ═══════ */}
      <AnimatePresence>
        {modalTeam !== null && (
          <TeamModal
            team={modalTeam === "create" ? null : modalTeam}
            allMembers={allMembers}
            onSave={handleSave}
            onClose={() => setModalTeam(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteTarget && (
          <DeleteConfirmModal
            teamName={deleteTarget.name}
            onConfirm={handleDelete}
            onClose={() => setDeleteTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}