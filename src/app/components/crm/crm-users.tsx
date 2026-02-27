import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  UsersThree,
  MagnifyingGlass,
  SpinnerGap,
  Crown,
  ShieldCheck,
  User,
  Eye,
  CaretDown,
  Check,
  Envelope,
  Phone,
  CalendarBlank,
  Clock,
  SealCheck,
  WarningCircle,
  X,
  Camera,
} from "@phosphor-icons/react";
import { listTeamMembers, getUserRole, setUserRole, uploadUserAvatar, type TeamMember } from "./crm-api";
import { useAuth } from "../auth-context";

/* ================================================================== */
/*  Style tokens                                                       */
/* ================================================================== */

const ff = { fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" };

/* ================================================================== */
/*  Role config                                                        */
/* ================================================================== */

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
  { key: "viewer", label: "Visualizador", color: "#917822", bg: "#FEEDCA", icon: Eye },
];

function getRoleDef(key: string): RoleDef {
  return ROLES.find((r) => r.key === key) ?? ROLES[2]; // default to "membro"
}

/* ================================================================== */
/*  Date helpers                                                       */
/* ================================================================== */

function formatDate(iso: string | null): string {
  if (!iso) return "--";
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function timeAgo(iso: string | null): string {
  if (!iso) return "Nunca";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Agora";
  if (mins < 60) return `${mins}min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d`;
  const months = Math.floor(days / 30);
  return `${months}m`;
}

/* ================================================================== */
/*  Role dropdown                                                      */
/* ================================================================== */

function RoleDropdown({
  currentRole,
  onChange,
  disabled,
}: {
  currentRole: string;
  onChange: (role: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const roleDef = getRoleDef(currentRole);
  const Icon = roleDef.icon;

  return (
    <div className="relative">
      <button
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className="flex items-center gap-[6px] h-[28px] px-[10px] rounded-full transition-all cursor-pointer hover:ring-1 hover:ring-[#DDE3EC]"
        style={{ backgroundColor: roleDef.bg, ...ff }}
      >
        <Icon size={13} weight="fill" style={{ color: roleDef.color }} />
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: -0.3, color: roleDef.color }}>
          {roleDef.label}
        </span>
        {!disabled && <CaretDown size={10} style={{ color: roleDef.color }} />}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute top-[calc(100%+4px)] right-0 bg-white rounded-[12px] p-1 z-50 min-w-[160px]"
            style={{
              boxShadow: "0px 8px 24px rgba(18,34,50,0.12), 0px 2px 6px rgba(18,34,50,0.06)",
              border: "0.7px solid rgba(200,207,219,0.5)",
            }}
          >
            {ROLES.map((r) => {
              const RIcon = r.icon;
              const selected = r.key === currentRole;
              return (
                <button
                  key={r.key}
                  onClick={() => {
                    onChange(r.key);
                    setOpen(false);
                  }}
                  className="flex items-center gap-[8px] w-full px-[10px] py-[8px] rounded-[8px] hover:bg-[#F6F7F9] transition-colors cursor-pointer"
                >
                  <RIcon size={14} weight="fill" style={{ color: r.color }} />
                  <span
                    className="flex-1 text-left text-[#28415C]"
                    style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...ff }}
                  >
                    {r.label}
                  </span>
                  {selected && <Check size={13} weight="bold" className="text-[#0483AB]" />}
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
/*  User detail card                                                   */
/* ================================================================== */

function UserDetailPanel({
  member,
  role,
  onRoleChange,
  onClose,
  isCurrentUser,
  onAvatarChange,
}: {
  member: TeamMember;
  role: string;
  onRoleChange: (role: string) => void;
  onClose: () => void;
  isCurrentUser: boolean;
  onAvatarChange: (userId: string, newUrl: string) => void;
}) {
  const roleDef = getRoleDef(role);
  const isOnline = member.lastSignInAt
    ? Date.now() - new Date(member.lastSignInAt).getTime() < 15 * 60 * 1000
    : false;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleAvatarUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const newUrl = await uploadUserAvatar(member.id, file);
      onAvatarChange(member.id, newUrl);
    } catch (err: any) {
      console.error("Error uploading avatar:", err);
    } finally {
      setUploading(false);
      // Reset input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [member.id, onAvatarChange]);

  return (
    <div
      className="w-[320px] shrink-0 rounded-[16px] flex flex-col overflow-hidden bg-white"
    >
      {/* Header */}
      <div
        className="relative flex flex-col items-center pt-10 pb-5 px-5 shrink-0 rounded-t-[16px] bg-white"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 flex items-center justify-center size-[28px] rounded-[8px] hover:bg-black/5 transition-colors cursor-pointer"
        >
          <X size={14} weight="bold" className="text-[#98989d]" />
        </button>

        <div className="relative mb-3 group/avatar">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleAvatarUpload}
          />

          {member.avatarUrl ? (
            <img
              src={member.avatarUrl}
              alt=""
              className="size-[56px] rounded-full object-cover ring-2 ring-white"
              style={{ boxShadow: "0px 4px 12px rgba(18,34,50,0.12)" }}
            />
          ) : (
            <div
              className="flex items-center justify-center size-[56px] rounded-full bg-[#0483AB] text-white ring-2 ring-white"
              style={{ fontSize: 22, fontWeight: 700, boxShadow: "0px 4px 12px rgba(18,34,50,0.12)" }}
            >
              {(member.name || "U").charAt(0).toUpperCase()}
            </div>
          )}

          {/* Camera overlay — visible on hover */}
          <button
            onClick={() => !uploading && fileInputRef.current?.click()}
            className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 group-hover/avatar:bg-black/40 transition-all cursor-pointer"
            title="Alterar foto"
          >
            {uploading ? (
              <SpinnerGap size={20} className="text-white animate-spin" />
            ) : (
              <Camera size={20} weight="fill" className="text-white opacity-0 group-hover/avatar:opacity-100 transition-opacity" />
            )}
          </button>

          {/* Online indicator */}
          <div
            className={`absolute bottom-0 right-0 size-[14px] rounded-full border-[2px] border-white z-10 ${
              isOnline ? "bg-[#3CCEA7]" : "bg-[#C8CFDB]"
            }`}
          />
        </div>

        <h2
          className="text-[#122232] text-center"
          style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.5, lineHeight: "20px", ...ff }}
        >
          {member.name}
        </h2>
        <span
          className="text-[#4E6987] mt-0.5"
          style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...ff }}
        >
          {member.email}
        </span>

        <div className="mt-2.5">
          <RoleDropdown currentRole={role} onChange={onRoleChange} disabled={isCurrentUser} />
        </div>
        {isCurrentUser && (
          <span
            className="text-[#98989d] mt-1"
            style={{ fontSize: 10, fontWeight: 500, letterSpacing: -0.2, ...ff }}
          >
            Voce nao pode alterar seu proprio perfil
          </span>
        )}
      </div>

      {/* Divider */}
      <div className="h-px bg-[#EBF1FA] mx-5" />

      {/* Details */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="flex flex-col gap-3.5">
          <DetailRow
            icon={<Envelope size={15} weight="duotone" />}
            label="Email"
            value={member.email}
          />
          <DetailRow
            icon={<Phone size={15} weight="duotone" />}
            label="Telefone"
            value={member.phone || "--"}
          />
          <DetailRow
            icon={<CalendarBlank size={15} weight="duotone" />}
            label="Criado em"
            value={formatDate(member.createdAt)}
          />
          <DetailRow
            icon={<Clock size={15} weight="duotone" />}
            label="Ultimo login"
            value={member.lastSignInAt ? formatDate(member.lastSignInAt) : "Nunca"}
          />
          <DetailRow
            icon={
              member.emailConfirmedAt ? (
                <SealCheck size={15} weight="fill" className="text-[#3CCEA7]" />
              ) : (
                <WarningCircle size={15} weight="fill" className="text-[#EAC23D]" />
              )
            }
            label="Email confirmado"
            value={member.emailConfirmedAt ? "Sim" : "Pendente"}
          />
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
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
        <span
          className="text-[#28415C] block truncate"
          style={{ fontSize: 13, fontWeight: 500, letterSpacing: -0.3, lineHeight: "20px", ...ff }}
        >
          {value}
        </span>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Main page component                                                */
/* ================================================================== */

export function CrmUsers() {
  const { user: currentUser } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [roles, setRoles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  /* ── Load members ── */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await listTeamMembers();
        if (cancelled) return;
        setMembers(data);

        // Load roles from kv_store in parallel
        const roleResults = await Promise.allSettled(
          data.map(async (m) => {
            try {
              const role = await getUserRole(m.id);
              return { id: m.id, role };
            } catch {
              return { id: m.id, role: "membro" };
            }
          })
        );

        if (cancelled) return;
        const rolesMap: Record<string, string> = {};
        roleResults.forEach((r) => {
          if (r.status === "fulfilled") {
            rolesMap[r.value.id] = r.value.role;
          }
        });
        setRoles(rolesMap);
      } catch (err: any) {
        if (!cancelled) setError(err.message || "Erro ao carregar membros");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  /* ── Filter ── */
  const filtered = useMemo(() => {
    if (!search.trim()) return members;
    const q = search.toLowerCase();
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q)
    );
  }, [members, search]);

  /* ── Role change handler ── */
  const handleRoleChange = async (userId: string, newRole: string) => {
    const prev = roles[userId];
    setRoles((r) => ({ ...r, [userId]: newRole }));
    try {
      await setUserRole(userId, newRole);
    } catch (err) {
      console.error("Error setting user role:", err);
      setRoles((r) => ({ ...r, [userId]: prev }));
    }
  };

  /* ── Status helpers ── */
  const getStatusInfo = (m: TeamMember) => {
    if (!m.lastSignInAt) return { label: "Nunca acessou", color: "#98989d", bg: "#F6F7F9" };
    const diff = Date.now() - new Date(m.lastSignInAt).getTime();
    if (diff < 15 * 60 * 1000) return { label: "Online", color: "#3CCEA7", bg: "#D9F8EF" };
    if (diff < 24 * 60 * 60 * 1000) return { label: "Hoje", color: "#0483AB", bg: "#DCF0FF" };
    if (diff < 7 * 24 * 60 * 60 * 1000) return { label: "Esta semana", color: "#4E6987", bg: "#EBF1FA" };
    return { label: "Inativo", color: "#98989d", bg: "#F6F7F9" };
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
            <UsersThree size={20} weight="duotone" style={{ color: "#4E6987" }} />
          </div>
          <div className="flex-1">
            <span
              className="text-[#28415c] block"
              style={{ fontSize: 19, fontWeight: 700, letterSpacing: -0.5, lineHeight: "24px", ...ff }}
            >
              Usuarios
            </span>
            <span
              className="text-[#98989d] block"
              style={{ fontSize: 13, fontWeight: 500, letterSpacing: -0.3, ...ff }}
            >
              Membros do time com acesso ao Zenite CRM via @htz.agency
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-[6px] h-[28px] px-[10px] rounded-full"
              style={{ backgroundColor: "#EBF1FA", ...ff }}
            >
              <span style={{ fontSize: 11, fontWeight: 700, color: "#4E6987", letterSpacing: -0.3 }}>
                {members.length} {members.length === 1 ? "membro" : "membros"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════ CONTENT ═══════ */}
      <div className="flex-1 flex flex-row gap-[10px] overflow-hidden min-h-0">
        {/* Left: table card */}
        <div className="flex-1 bg-white rounded-[16px] overflow-hidden flex flex-col min-w-0 min-h-0">
          {/* Search bar */}
          <div className="px-5 pt-4 pb-3 shrink-0">
            <div className="relative flex items-center justify-between w-full h-[40px] px-[10px] bg-[#DDE3EC] rounded-full">
              <div className="flex items-center gap-[10px]">
                <div className="flex items-center justify-center shrink-0 size-[28px]">
                  <MagnifyingGlass size={16} weight="bold" className="text-[#4E6987]" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar por nome ou email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-transparent border-none outline-none text-[#122232] placeholder-[#4E6987] w-full"
                  style={{ fontSize: 13, fontWeight: 500, letterSpacing: -0.3, ...ff }}
                />
              </div>
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

          {/* Table */}
          <div className="flex-1 overflow-auto px-5 pb-4">
            {loading ? (
              <div className="flex items-center justify-center h-[200px] gap-2">
                <SpinnerGap size={20} className="text-[#0483AB] animate-spin" />
                <span className="text-[#4E6987]" style={{ fontSize: 13, fontWeight: 500, ...ff }}>
                  Carregando membros...
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
              <div className="flex flex-col items-center justify-center h-[200px] gap-2">
                <UsersThree size={32} weight="duotone" className="text-[#C8CFDB]" />
                <span className="text-[#98989d]" style={{ fontSize: 13, fontWeight: 500, ...ff }}>
                  {search ? "Nenhum membro encontrado" : "Nenhum membro registrado"}
                </span>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#EBF1FA]">
                    {["Membro", "Email", "Perfil", "Status", "Ultimo login"].map((h) => (
                      <th
                        key={h}
                        className="text-left text-[#98989d] uppercase pb-2 pt-1 px-1"
                        style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, ...ff }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((m) => {
                    const role = roles[m.id] || "membro";
                    const status = getStatusInfo(m);
                    const isSelf = currentUser?.id === m.id;

                    return (
                      <tr
                        key={m.id}
                        onClick={() => setSelectedMember(m)}
                        className="border-b border-[#F6F7F9] hover:bg-[#FAFBFC] transition-colors cursor-pointer group"
                      >
                        {/* Name + Avatar */}
                        <td className="py-3 px-1">
                          <div className="flex items-center gap-3">
                            {m.avatarUrl ? (
                              <img
                                src={m.avatarUrl}
                                alt=""
                                className="size-[32px] rounded-full object-cover shrink-0"
                              />
                            ) : (
                              <div
                                className="flex items-center justify-center size-[32px] rounded-full bg-[#0483AB] text-white shrink-0"
                                style={{ fontSize: 12, fontWeight: 700 }}
                              >
                                {(m.name || "U").charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <span
                                className="text-[#122232] block truncate"
                                style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.3, lineHeight: "18px", ...ff }}
                              >
                                {m.name}
                                {isSelf && (
                                  <span
                                    className="text-[#0483AB] ml-1"
                                    style={{ fontSize: 10, fontWeight: 700 }}
                                  >
                                    (voce)
                                  </span>
                                )}
                              </span>
                              <span
                                className="text-[#98989d] block truncate"
                                style={{ fontSize: 11, fontWeight: 500, letterSpacing: -0.2, lineHeight: "16px", ...ff }}
                              >
                                Criado {formatDate(m.createdAt)}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="py-3 px-1">
                          <span
                            className="text-[#4E6987]"
                            style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...ff }}
                          >
                            {m.email}
                          </span>
                        </td>

                        {/* Role */}
                        <td className="py-3 px-1" onClick={(e) => e.stopPropagation()}>
                          <RoleDropdown
                            currentRole={role}
                            onChange={(r) => handleRoleChange(m.id, r)}
                            disabled={isSelf}
                          />
                        </td>

                        {/* Status */}
                        <td className="py-3 px-1">
                          <div className="flex items-center gap-[6px]">
                            <div
                              className="size-[6px] rounded-full shrink-0"
                              style={{ backgroundColor: status.color }}
                            />
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                letterSpacing: -0.2,
                                color: status.color,
                                ...ff,
                              }}
                            >
                              {status.label}
                            </span>
                          </div>
                        </td>

                        {/* Last login */}
                        <td className="py-3 px-1">
                          <span
                            className="text-[#4E6987]"
                            style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...ff }}
                          >
                            {timeAgo(m.lastSignInAt)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right: detail panel */}
        {selectedMember && (
          <UserDetailPanel
            member={selectedMember}
            role={roles[selectedMember.id] || "membro"}
            onRoleChange={(r) => handleRoleChange(selectedMember.id, r)}
            onClose={() => setSelectedMember(null)}
            isCurrentUser={currentUser?.id === selectedMember.id}
            onAvatarChange={(userId, newUrl) => {
              const newMembers = members.map(m => m.id === userId ? { ...m, avatarUrl: newUrl } : m);
              setMembers(newMembers);
              // Also update the selectedMember so the panel reflects the change immediately
              setSelectedMember(prev => prev?.id === userId ? { ...prev, avatarUrl: newUrl } : prev);
            }}
          />
        )}
      </div>
    </div>
  );
}