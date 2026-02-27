/**
 * CRM Detail Shared Components
 *
 * Extracted from the 4 detail pages (lead, opportunity, account, contact)
 * to eliminate ~1100 lines of duplicated UI code.
 */

import { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  CaretDown,
  CaretRight,
  Phone,
  Envelope,
  ChatCircle,
  CalendarBlank,
  CheckCircle,
  NoteBlank,
  FunnelSimple,
  MagnifyingGlass,
  ListBullets,
  Plus,
  UserCircle,
  Clock,
  Lightning,
  ArrowsClockwise,
  Handshake,
  ClipboardText,
  PencilLine,
  Broadcast,
  Timer,
  TrendUp,
  TrendDown,
  ArrowsLeftRight,
  ThumbsUp,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneSlash,
  Notepad,
  X,
  SquaresFour,
  Backspace,
  ArrowSquareIn,
  ArrowSquareDownRight,
  Numpad,
  ArrowsInLineVertical,
  ArrowsOutLineVertical,
  DotsThreeVertical,
  VideoCamera,
  UsersThree,
  Star,
  Circle,
  Check,
  CaretUp,
  PushPin,
  PushPinSimple,
  Rows,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";
import { useMultitask } from "../multitask-context";
import imgAvatar from "figma:asset/d5fb6bc139a3da5bc43ab0601942a4cf33722fa1.png";
import {
  listActivitiesByEntity,
  listActivities,
  type DbActivity,
} from "./crm-api";

/* ------------------------------------------------------------------ */
/*  Constants — re-exported from single source of truth                */
/* ------------------------------------------------------------------ */

import { fontFeature, ACTIVITY_TYPE_CONFIG as _ACTIVITY_TYPE_CONFIG } from "./activity-config";
export { fontFeature, ACTIVITY_TYPE_CONFIG } from "./activity-config";

/* ------------------------------------------------------------------ */
/*  Shared Types                                                       */
/* ------------------------------------------------------------------ */

export interface Activity {
  id: string;
  type: "compromisso" | "tarefa" | "ligacao" | "nota" | "mensagem" | "email";
  label: string;
  date: string;
  group: string;
  /** Optional expanded detail fields */
  title?: string;
  meetingLink?: string;
  attendees?: string[];
  duration?: string;
  notes?: string;
  location?: string;
}

export interface CallRecord {
  id: string;
  phone: string;
  date: string;
  avatarUrl: string;
  direction: "feita" | "recebida" | "perdida";
  title?: string;
  duration?: string;
  notes?: string;
}

export interface TaskItem {
  id: string;
  title: string;
  dueDate?: string;
  dueTime?: string;
  completed: boolean;
  starred?: boolean;
  completedAt?: string;
}

export const activityConfig: Record<Activity["type"], { icon: React.ComponentType<any>; bg: string; color: string }> = {
  compromisso: { icon: CalendarBlank, ..._ACTIVITY_TYPE_CONFIG.compromisso },
  tarefa:      { icon: CheckCircle,   ..._ACTIVITY_TYPE_CONFIG.tarefa },
  ligacao:     { icon: Phone,         ..._ACTIVITY_TYPE_CONFIG.ligacao },
  nota:        { icon: NoteBlank,     ..._ACTIVITY_TYPE_CONFIG.nota },
  mensagem:    { icon: ChatCircle,    ..._ACTIVITY_TYPE_CONFIG.mensagem },
  email:       { icon: Envelope,      ..._ACTIVITY_TYPE_CONFIG.email },
};

/* ------------------------------------------------------------------ */
/*  DbActivity → Activity mapper                                      */
/* ------------------------------------------------------------------ */

const MONTH_NAMES = [
  "JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO",
  "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO",
];

const activityTypeLabelMap: Record<string, string> = {
  compromisso: "Compromisso",
  tarefa: "Tarefa",
  ligacao: "Ligação",
  nota: "Nota",
  mensagem: "Mensagem",
  email: "Email",
};

export function dbActivityToFeedItem(row: any): Activity {
  const type = (row.type || "nota") as Activity["type"];
  const label = row.label || row.subject || activityTypeLabelMap[type] || type;
  const rawDate = row.date || row.start_date || row.created_at || "";

  // Determine group — derive from date (row.group is used for JSON pack/unpack, not display)
  // Detect packed JSON in group field and ignore it for display purposes
  let group = "";
  const rawGroup = row.group || "";
  if (rawGroup && !rawGroup.startsWith("{") && !rawGroup.startsWith("[")) {
    group = rawGroup;
  }
  if (!group && rawDate) {
    try {
      const d = new Date(rawDate);
      if (!isNaN(d.getTime())) {
        const now = new Date();
        if (d > now) {
          group = "FUTURO";
        } else {
          group = d.getFullYear() === now.getFullYear()
            ? MONTH_NAMES[d.getMonth()]
            : String(d.getFullYear());
        }
      }
    } catch { /* noop */ }
  }

  // Format date for display (DD/MM/YYYY HH:mm)
  let displayDate = rawDate;
  if (rawDate && rawDate.includes("-")) {
    try {
      const d = new Date(rawDate);
      if (!isNaN(d.getTime())) {
        const dd = String(d.getDate()).padStart(2, "0");
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const yyyy = d.getFullYear();
        const hh = String(d.getHours()).padStart(2, "0");
        const mi = String(d.getMinutes()).padStart(2, "0");
        displayDate = `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
      }
    } catch { /* noop */ }
  }

  return {
    id: row.id,
    type,
    label,
    date: displayDate,
    group: group || "SEM DATA",
    title: row.subject || row.label || undefined,
    meetingLink: row.meet_link || undefined,
    attendees: row.attendees
      ? (row.attendees as any[]).map((a: any) =>
          typeof a === "string" ? a : a.email || a.name || ""
        )
      : undefined,
    duration: row.call_duration
      ? `${Math.floor(Number(row.call_duration) / 60)} minutos e ${Number(row.call_duration) % 60} segundos`
      : undefined,
    notes: row.description || row.body || undefined,
    location: row.location || undefined,
  };
}

/* ------------------------------------------------------------------ */
/*  useEntityActivities — fetches real activities for a given entity   */
/* ------------------------------------------------------------------ */

export function useEntityActivities(
  entityType: string,
  entityId: string | undefined,
  fallback?: Activity[],
) {
  const [activities, setActivities] = useState<Activity[]>(fallback ?? []);
  const [loading, setLoading] = useState(true);
  const [fromApi, setFromApi] = useState(false);

  useEffect(() => {
    if (!entityId) {
      setActivities(fallback ?? []);
      setLoading(false);
      return;
    }
    let cancelled = false;
    const timeout = setTimeout(() => {
      if (!cancelled) {
        setActivities(fallback ?? []);
        setLoading(false);
      }
    }, 6000);

    (async () => {
      try {
        // 1) Try entity-specific endpoint (queries by entity_type + entity_id)
        let rows: any[] = [];
        try {
          rows = await listActivitiesByEntity(entityType, entityId);
        } catch { /* ignore – endpoint may not match */ }

        // 2) If nothing found, fetch all activities and filter client-side
        if ((!rows || rows.length === 0) && !cancelled) {
          try {
            const allRows = await listActivities();
            if (!cancelled && allRows && allRows.length > 0) {
              rows = allRows.filter((r: any) =>
                (r.entity_type === entityType && r.entity_id === entityId) ||
                (r.related_to_type === entityType && r.related_to_id === entityId) ||
                (r.contact_id === entityId)
              );
            }
          } catch { /* ignore */ }
        }

        if (cancelled) return;

        if (rows && rows.length > 0) {
          setActivities(rows.map(dbActivityToFeedItem));
          setFromApi(true);
        } else {
          setActivities(fallback ?? []);
        }
      } catch (err) {
        console.error("Error loading entity activities:", err);
        if (!cancelled) setActivities(fallback ?? []);
      } finally {
        clearTimeout(timeout);
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [entityType, entityId]);

  const groupedActivities = useMemo(() => {
    const groups: { group: string; items: Activity[] }[] = [];
    // Sort: FUTURO first, then by date descending
    const sorted = [...activities].sort((a, b) => {
      if (a.group === "FUTURO" && b.group !== "FUTURO") return -1;
      if (b.group === "FUTURO" && a.group !== "FUTURO") return 1;
      return 0; // keep original order within same group
    });
    sorted.forEach((a) => {
      const existing = groups.find((g) => g.group === a.group);
      if (existing) existing.items.push(a);
      else groups.push({ group: a.group, items: [a] });
    });
    return groups;
  }, [activities]);

  return { activities, groupedActivities, loading, fromApi };
}

/* ------------------------------------------------------------------ */
/*  VerticalDivider                                                    */
/* ------------------------------------------------------------------ */

export function VerticalDivider() {
  return (
    <div className="flex h-[20px] items-center justify-center shrink-0 w-[1.5px]">
      
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  HorizontalDivider                                                  */
/* ------------------------------------------------------------------ */

export function HorizontalDivider() {
  return (
    <div className="h-0 relative w-full">
      <svg className="block w-full h-[1.5px]" fill="none" preserveAspectRatio="none" viewBox="0 0 725 1.5">
        <line stroke="#DDE3EC" strokeWidth="1.5" x2="725" y1="0.75" y2="0.75" />
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ActionButton                                                       */
/* ------------------------------------------------------------------ */

export function ActionButton({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center size-[32px] rounded-full bg-transparent text-[#0483AB] hover:bg-[#DCF0FF] hover:text-[#0483AB] transition-colors cursor-pointer"
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  ActionPill — reusable pill container for action buttons             */
/* ------------------------------------------------------------------ */

export function ActionPill({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex items-center gap-[10px] bg-[#f6f7f9] rounded-[100px] h-[44px] px-[5px] py-[0px] ${className}`}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ActivityItem                                                       */
/* ------------------------------------------------------------------ */

export function ActivityItem({
  activity,
  expanded,
  onToggle,
}: {
  activity: Activity;
  expanded: boolean;
  onToggle: () => void;
}) {
  const config = activityConfig[activity.type];
  const Icon = config.icon;
  const hasDetails = !!(activity.title || activity.meetingLink || activity.attendees?.length || activity.duration || activity.notes || activity.location);

  return (
    <div className={`rounded-[8px] transition-colors w-full ${expanded ? "bg-[#f6f7f9]" : "hover:bg-[#f6f7f9]"}`}>
      {/* Main row */}
      <div
        className="flex gap-[4px] items-center px-[12px] py-[6px] cursor-pointer"
        onClick={onToggle}
      >
        {/* Expand arrow */}
        <div className={`flex items-center justify-center size-[28px] shrink-0 text-[#4e6987] transition-transform ${expanded ? "rotate-90" : ""}`}>
          <CaretRight size={14} weight="bold" />
        </div>
        {/* Type icon */}
        <div
          className="flex items-center justify-center size-[28px] rounded-[8px] shrink-0"
          style={{ backgroundColor: config.bg }}
        >
          <Icon size={17} weight="duotone" style={{ color: config.color }} />
        </div>
        {/* Label + Date stacked */}
        <div className="flex flex-col flex-1 min-w-0">
          <span
            className="text-[#4e6987] truncate"
            style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}
          >
            {activity.label}
          </span>
          <span
            className="text-[#98989d]"
            style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "14px", textTransform: "uppercase", ...fontFeature }}
          >
            {activity.date}
          </span>
        </div>
        {/* Three-dot menu */}
        <button
          onClick={(e) => e.stopPropagation()}
          className="flex items-center justify-center size-[28px] shrink-0 text-[#98989d] hover:text-[#4e6987] hover:bg-[#dde3ec] rounded-full transition-colors cursor-pointer"
        >
          <DotsThreeVertical size={16} weight="bold" />
        </button>
      </div>

      {/* Expanded detail */}
      <AnimatePresence initial={false}>
        {expanded && hasDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="flex pl-[44px] pr-[12px] pb-[12px]">
              {/* Detail content */}
              <div className="flex flex-col gap-[8px] flex-1 min-w-0">
                {activity.title && (
                  <span
                    className="text-[#4e6987]"
                    style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}
                  >
                    {activity.title}
                  </span>
                )}
                {activity.meetingLink && (
                  <div className="flex items-center gap-[6px]">
                    <VideoCamera size={14} weight="duotone" className="text-[#07ABDE] shrink-0" />
                    <a
                      href={activity.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-[#07ABDE] truncate hover:underline"
                      style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, lineHeight: "17px", ...fontFeature }}
                    >
                      {activity.meetingLink}
                    </a>
                  </div>
                )}
                {activity.attendees && activity.attendees.length > 0 && (
                  <div className="flex items-center gap-[6px]">
                    <UsersThree size={14} weight="duotone" className="text-[#98989d] shrink-0" />
                    <span
                      className="text-[#98989d] truncate"
                      style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, lineHeight: "17px", ...fontFeature }}
                    >
                      {activity.attendees.join(", ")}
                    </span>
                  </div>
                )}
                {activity.location && (
                  <div className="flex items-center gap-[6px]">
                    <CalendarBlank size={14} weight="duotone" className="text-[#98989d] shrink-0" />
                    <span
                      className="text-[#98989d]"
                      style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, lineHeight: "17px", ...fontFeature }}
                    >
                      {activity.location}
                    </span>
                  </div>
                )}
                {activity.duration && (
                  <div className="flex items-center gap-[6px]">
                    <Timer size={14} weight="duotone" className="text-[#98989d] shrink-0" />
                    <span
                      className="text-[#98989d]"
                      style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, lineHeight: "17px", ...fontFeature }}
                    >
                      {activity.duration}
                    </span>
                  </div>
                )}
                {activity.notes && (
                  <div className="flex items-start gap-[6px]">
                    <Notepad size={14} weight="duotone" className="text-[#98989d] shrink-0 mt-[1px]" />
                    <span
                      className="text-[#98989d]"
                      style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, lineHeight: "17px", ...fontFeature }}
                    >
                      {activity.notes}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SectionToggle                                                      */
/* ------------------------------------------------------------------ */

export function SectionToggle({
  title,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="flex items-center gap-[15px] cursor-pointer py-[4px] group/section"
      >
        <div className="flex items-center justify-center size-[24px] text-[#28415c]">
          {expanded ? <CaretDown size={18} weight="bold" /> : <CaretRight size={18} weight="bold" />}
        </div>
        <span
          className="text-[#28415c]"
          style={{ fontSize: 18, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}
        >
          {title}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key={`section-content-${title}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  StageBar (generic pipeline / stage control)                        */
/* ------------------------------------------------------------------ */

export interface StageOption<T extends string = string> {
  key: T;
  label: string;
}

export function StageBar<T extends string>({
  stages,
  current,
  onChange,
  layoutId,
  activeColor = "#28415C",
}: {
  stages: StageOption<T>[];
  current: T;
  onChange: (s: T) => void;
  /** Unique layoutId for Framer Motion shared layout animation */
  layoutId: string;
  /** Background color of the active pill. Defaults to #28415C */
  activeColor?: string;
}) {
  const activeIdx = stages.findIndex((s) => s.key === current);

  return (
    <div className="flex items-center gap-[4px] h-[44px] p-[4px] bg-[#f6f7f9] rounded-[100px] overflow-clip relative">
      {stages.map((s, idx) => {
        const isActive = s.key === current;
        const isPast = idx < activeIdx;
        return (
          <button
            key={s.key}
            onClick={() => onChange(s.key)}
            className={`group/stage flex-1 h-[36px] rounded-[20px] flex items-center justify-center transition-all duration-200 relative cursor-pointer z-[1] ${
              isActive
                ? "cursor-default"
                : "text-[#98989d] hover:text-[#4E6987] hover:bg-[#e8eaee]"
            }`}
          >
            {/* Sliding active pill */}
            {isActive && (
              <motion.div
                layoutId={layoutId}
                className="absolute inset-0 rounded-[20px]"
                style={{
                  backgroundColor: activeColor,
                  border: "0.5px solid rgba(200,207,219,0.6)",
                  boxShadow: "0px 2px 4px 0px rgba(18,34,50,0.3)",
                }}
                transition={{ type: "spring", stiffness: 500, damping: 35, mass: 0.8 }}
              />
            )}
            {isPast ? (
              <div className="relative z-[1] flex items-center justify-center">
                <CheckCircle
                  size={16}
                  weight="bold"
                  className="text-[#3CCEA7] transition-opacity duration-200 opacity-100 group-hover/stage:opacity-0 absolute"
                />
                <span
                  className="opacity-0 group-hover/stage:opacity-100 transition-opacity duration-200 uppercase whitespace-nowrap"
                  style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}
                >
                  {s.label}
                </span>
              </div>
            ) : (
              <span
                className={`relative z-[1] uppercase whitespace-nowrap ${isActive ? "text-[#f6f7f9]" : ""}`}
                style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}
              >
                {s.label}
              </span>
            )}
          </button>
        );
      })}
      {/* Inner shadow */}
      <div
        className="absolute inset-0 pointer-events-none rounded-[inherit] z-[2]"
        style={{
          boxShadow:
            "inset 0px -0.5px 1px 0px rgba(255,255,255,0.3), inset 0px -0.5px 1px 0px rgba(255,255,255,0.25), inset 1px 1.5px 4px 0px rgba(0,0,0,0.08), inset 1px 1.5px 4px 0px rgba(0,0,0,0.1)",
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ScoreCard                                                          */
/* ------------------------------------------------------------------ */

export function ScoreCard({
  score,
  label,
  icon: Icon,
  iconColor,
  fillColor,
  textColor,
  gradientId,
}: {
  score: number;
  label: string;
  icon: React.ComponentType<any>;
  iconColor: string;
  /** Circle fill color, e.g. "#FEEDCA" */
  fillColor: string;
  /** Score number text color, e.g. "#917822" */
  textColor: string;
  /** Unique SVG gradient id to avoid clashes */
  gradientId: string;
}) {
  return (
    <div
      className="flex items-center gap-[16px] rounded-[10px] bg-[#f6f7f9] px-[20px] py-[10px]"
      style={{ border: "1px solid rgba(200,207,219,0.6)" }}
    >
      <div className="flex flex-col gap-[2px]">
        <div className="flex items-center gap-[10px]">
          <Icon size={24} weight="duotone" className={`text-[${iconColor}]`} style={{ color: iconColor }} />
          <span
            className="text-[#28415c]"
            style={{ fontSize: 18, fontWeight: 500, letterSpacing: -0.4, lineHeight: "normal", ...fontFeature }}
            dangerouslySetInnerHTML={{ __html: label.replace("\n", "<br />") }}
          />
        </div>
      </div>
      <div className="flex flex-col items-center">
        <div className="relative flex items-center justify-center size-[60px]">
          <svg className="absolute inset-0 size-full" fill="none" viewBox="0 0 60 60">
            <circle cx="30" cy="30" r="29.5" fill={fillColor} stroke={`url(#${gradientId})`} />
            <defs>
              <linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1="4.2" x2="32.8" y1="0" y2="65.8">
                <stop stopColor="#C8CFDB" stopOpacity="0.6" />
                <stop offset="0.333" stopColor="white" stopOpacity="0.01" />
                <stop offset="0.667" stopColor="white" stopOpacity="0.01" />
                <stop offset="1" stopColor="#C8CFDB" stopOpacity="0.1" />
              </linearGradient>
            </defs>
          </svg>
          <span
            className="relative text-center"
            style={{ fontSize: 28, fontWeight: 400, letterSpacing: 1, fontFamily: "'DM Serif Text', serif", color: textColor }}
          >
            {score}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  CallLogPanel                                                       */
/* ------------------------------------------------------------------ */

export function CallLogPanel({
  calls,
  layoutId,
  activeColor = "#28415C",
  ctaBg = "#DCF0FF",
  ctaText = "#28415c",
  ctaHover = "#c4e4fa",
}: {
  calls: CallRecord[];
  /** Unique layoutId for tab animation */
  layoutId: string;
  /** Active tab pill color */
  activeColor?: string;
  /** CTA button background */
  ctaBg?: string;
  /** CTA button text color */
  ctaText?: string;
  /** CTA button hover background */
  ctaHover?: string;
}) {
  const [callTab, setCallTab] = useState<"feitas" | "recebidas" | "perdidas">("feitas");
  const [expandedCallId, setExpandedCallId] = useState<string | null>(null);

  const filteredCalls = useMemo(() => {
    return calls.filter((c) =>
      (callTab === "feitas" && c.direction === "feita") ||
      (callTab === "recebidas" && c.direction === "recebida") ||
      (callTab === "perdidas" && c.direction === "perdida")
    );
  }, [calls, callTab]);

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="p-[12px] pb-0">
        <div
          className="flex gap-[4px] h-[44px] items-center justify-center overflow-hidden p-[4px] rounded-[100px] bg-[#f6f7f9] relative"
          style={{
            boxShadow:
              "inset 0px -0.5px 1px 0px rgba(255,255,255,0.3), inset 0px -0.5px 1px 0px rgba(255,255,255,0.25), inset 1px 1.5px 4px 0px rgba(0,0,0,0.08), inset 1px 1.5px 4px 0px rgba(0,0,0,0.1)",
          }}
        >
          {(["feitas", "recebidas", "perdidas"] as const).map((tab) => {
            const isActive = callTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setCallTab(tab)}
                className={`flex-1 h-[36px] flex items-center justify-center rounded-[20px] cursor-pointer transition-colors duration-200 relative z-[1] ${
                  isActive ? "" : "text-[#98989d] hover:text-[#4E6987] hover:bg-[#e8eaee]"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId={layoutId}
                    className="absolute inset-0 rounded-[20px]"
                    style={{
                      backgroundColor: activeColor,
                      border: "0.5px solid rgba(200,207,219,0.6)",
                      boxShadow: "0px 2px 4px 0px rgba(18,34,50,0.3)",
                    }}
                    transition={{ type: "spring", stiffness: 500, damping: 35, mass: 0.8 }}
                  />
                )}
                <span
                  className={`relative z-[1] uppercase ${isActive ? "text-[#f6f7f9]" : ""}`}
                  style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}
                >
                  {tab}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Call list header */}
      <div className="flex items-center gap-[6px] px-[20px] py-[12px]">
        <div className="flex items-center gap-[6px] flex-1 min-w-0 cursor-pointer">
          <div className="flex items-center justify-center size-[28px] rounded-[8px] bg-[#d9f8ef] shrink-0">
            <Phone size={17} weight="duotone" className="text-[#3ccea7]" />
          </div>
          <span
            className="text-[#4e6987]"
            style={{ fontSize: 18, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}
          >
            Ligações
          </span>
          <CaretDown size={14} weight="bold" className="text-[#4e6987] shrink-0" />
        </div>
        <button className="flex items-center justify-center size-[28px] rounded-full text-[#28415c] hover:bg-[#f6f7f9] transition-colors cursor-pointer">
          <MagnifyingGlass size={17} weight="duotone" />
        </button>
        <button className="flex items-center justify-center size-[28px] rounded-full text-[#28415c] hover:bg-[#f6f7f9] transition-colors cursor-pointer">
          <FunnelSimple size={17} weight="duotone" />
        </button>
      </div>

      {/* Call list */}
      <div className="flex-1 overflow-auto px-[4px]">
        <div className="flex flex-col">
          {filteredCalls.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-[32px] gap-[8px]">
              <Phone size={28} weight="duotone" className="text-[#C8CFDB]" />
              <span className="text-[#98989d]" style={{ fontSize: 12, fontWeight: 500, ...fontFeature }}>
                Nenhuma ligação encontrada
              </span>
            </div>
          ) : (
            filteredCalls.map((call) => (
              <CallItemRow
                key={call.id}
                call={call}
                expanded={expandedCallId === call.id}
                onToggle={() => setExpandedCallId(expandedCallId === call.id ? null : call.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="sticky bottom-0 p-[16px] flex justify-center pointer-events-none">
        <button
          className="flex items-center justify-center gap-[4px] h-[40px] px-[20px] rounded-[500px] cursor-pointer transition-colors pointer-events-auto shadow-[0_2px_8px_rgba(0,0,0,0.1)]"
          style={{ backgroundColor: ctaBg, color: ctaText }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = ctaHover)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = ctaBg)}
        >
          <Phone size={16} weight="bold" />
          <span style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}>
            Fazer uma ligação
          </span>
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ActivityFeedPanel — Reusable activity module for detail pages       */
/* ------------------------------------------------------------------ */

const ACTIVITY_TYPES = Object.keys(activityConfig) as Activity["type"][];

const activityTypeLabels: Record<Activity["type"], string> = {
  compromisso: "Compromisso",
  tarefa: "Tarefa",
  ligacao: "Ligação",
  nota: "Nota",
  mensagem: "Mensagem",
  email: "Email",
};

export function ActivityFeedPanel({
  activities,
  groupedActivities,
  layoutId,
  ctaBg = "#DCF0FF",
  ctaText = "#28415c",
  ctaHover = "#c4e4fa",
  onAddActivity,
  calls = [],
  tasks = [],
}: {
  activities: Activity[];
  groupedActivities: { group: string; items: Activity[] }[];
  /** Unique layoutId for segmented control animation */
  layoutId: string;
  /** CTA button background */
  ctaBg?: string;
  /** CTA button text color */
  ctaText?: string;
  /** CTA button hover background */
  ctaHover?: string;
  /** Callback when "Adicionar atividade" is clicked */
  onAddActivity?: () => void;
  /** Call records for the Ligações mini app */
  calls?: CallRecord[];
  /** Task items for the Tarefas mini app */
  tasks?: TaskItem[];
}) {
  const [activityTab, setActivityTab] = useState<"feed" | "engajamento">("feed");
  const [titleDropdownOpen, setTitleDropdownOpen] = useState(false);
  const [activeType, setActiveType] = useState<Activity["type"] | null>(null);
  const [expandedActivityIds, setExpandedActivityIds] = useState<Set<string>>(new Set());
  const { dialerOpen, setDialerOpen, minimize: minimizeWindow } = useMultitask();
  const titleRef = useRef<HTMLDivElement>(null);
  const [actionPillPortalNode, setActionPillPortalNode] = useState<HTMLDivElement | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (titleRef.current && !titleRef.current.contains(e.target as Node)) {
        setTitleDropdownOpen(false);
      }
    };
    if (titleDropdownOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [titleDropdownOpen]);

  // Reset to feed tab when switching to a specific activity type
  useEffect(() => {
    if (activeType !== null) {
      setActivityTab("feed");
    }
  }, [activeType]);

  // Filter activities for the active type
  const filteredGroups = useMemo(() => {
    if (!activeType) return groupedActivities;
    return groupedActivities
      .map((g) => ({
        ...g,
        items: g.items.filter((a) => a.type === activeType),
      }))
      .filter((g) => g.items.length > 0);
  }, [groupedActivities, activeType]);

  // Title text based on active type
  const titleText = useMemo(() => {
    if (!activeType) return "Atividades";
    const plurals: Record<Activity["type"], string> = {
      compromisso: "Compromissos",
      tarefa: "Tarefas",
      ligacao: "Ligações",
      nota: "Notas",
      mensagem: "Mensagens",
      email: "Emails",
    };
    return plurals[activeType];
  }, [activeType]);

  // Icon for title
  const titleIcon = useMemo(() => {
    if (activeType) return activityConfig[activeType];
    return { icon: Lightning, bg: "#DDE3EC", color: "#4E6987" };
  }, [activeType]);

  const TitleIcon = titleIcon.icon;

  // Engagement summary data
  const engagementData = useMemo(() => {
    const totalActivities = activities.length;
    const totalCalls = activities.filter((a) => a.type === "ligacao").length;
    const totalEmails = activities.filter((a) => a.type === "email").length;
    const totalMeetings = activities.filter((a) => a.type === "compromisso").length;
    const hasFutureTask = activities.some((a) => a.type === "tarefa");
    const hasNotes = activities.some((a) => a.type === "nota");
    return [
      { icon: Lightning, iconColor: "#EAC23D", label: "ÚLTIMA ATIVIDADE", value: "Há 20 dias", status: "ABAIXO DA MÉDIA" as const },
      { icon: Lightning, iconColor: "#EAC23D", label: "ATIVIDADES TOTAIS", value: `${totalActivities} atividades`, status: "ACIMA DA MÉDIA" as const },
      { icon: Envelope, iconColor: "#4E6987", label: "EMAILS TROCADOS", value: `${totalEmails} Emails`, status: "ABAIXO DA MÉDIA" as const },
      { icon: Phone, iconColor: "#3CCEA7", label: "TOTAL DE LIGAÇÕES", value: `${totalCalls} ligações`, status: "NA MÉDIA" as const },
      { icon: Broadcast, iconColor: "#07ABDE", label: "CANAL PRINCIPAL", value: "56% WhatsApp" },
      { icon: Timer, iconColor: "#F56233", label: "TEMPO DE RESPOSTA", value: "1h e 56 m", status: "ABAIXO DA MÉDIA" as const },
      { icon: ArrowsClockwise, iconColor: "#8C8CD4", label: "RENITÊNCIA", value: "7,3 pontos", status: "NA MÉDIA" as const },
      { icon: Handshake, iconColor: "#FF8C76", label: "TOTAL DE REUNIÕES", value: `${totalMeetings} reuniões`, status: "NA MÉDIA" as const },
      { icon: ClipboardText, iconColor: "#8C8CD4", label: "TAREFA FUTURA?", value: hasFutureTask ? "Sim" : "Não" },
      { icon: PencilLine, iconColor: "#917822", label: "TEM ANOTAÇÕES", value: hasNotes ? "Sim" : "Não" },
    ];
  }, [activities]);

  // CTA config based on active type
  const ctaConfig = useMemo(() => {
    if (!activeType) return { icon: Plus, label: "Adicionar atividade" };
    const configs: Record<Activity["type"], { icon: React.ComponentType<any>; label: string }> = {
      compromisso: { icon: CalendarBlank, label: "Agendar compromisso" },
      tarefa: { icon: Plus, label: "Adicionar tarefa" },
      ligacao: { icon: Phone, label: "Fazer uma ligação" },
      nota: { icon: NoteBlank, label: "Adicionar nota" },
      mensagem: { icon: ChatCircle, label: "Enviar mensagem" },
      email: { icon: Envelope, label: "Enviar email" },
    };
    return configs[activeType];
  }, [activeType]);

  const CtaIcon = ctaConfig.icon;

  // Handle CTA click — open dialer for calls, otherwise use callback
  const handleCtaClick = () => {
    if (activeType === "ligacao") {
      setDialerOpen(true);
    } else {
      onAddActivity?.();
    }
  };

  // If dialer is open, render it full-container
  if (dialerOpen) {
    return <DialerPanel onClose={() => setDialerOpen(false)} />;
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* ═══ Activity Header with Type Switcher + ActionPill (always visible) ═══ */}
      <div className="flex items-center gap-[6px] px-[20px] py-[12px]">
        <div className="relative flex-1 min-w-0" ref={titleRef}>
          <div
            onClick={() => setTitleDropdownOpen((v) => !v)}
            className={`flex items-center gap-[6px] cursor-pointer p-[6px] rounded-[8px] hover:bg-[#f6f7f9] transition-colors ${titleDropdownOpen ? "bg-[#f6f7f9]" : ""}`}
          >
            <div
              className="flex items-center justify-center size-[28px] rounded-[8px] shrink-0 transition-colors"
              style={{ backgroundColor: titleIcon.bg }}
            >
              <TitleIcon size={17} weight="duotone" style={{ color: titleIcon.color }} />
            </div>
            <span
              className="text-[#4e6987]"
              style={{ fontSize: 18, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}
            >
              {titleText}
            </span>
            <div className={`flex items-center justify-center size-[20px] transition-transform ${titleDropdownOpen ? "rotate-180" : ""}`}>
              <CaretDown size={14} weight="bold" className="text-[#4e6987]" />
            </div>
          </div>

          {/* Type switcher dropdown (single select) */}
          <AnimatePresence>
            {titleDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 top-[calc(100%+4px)] z-50 bg-white backdrop-blur-[50px] rounded-[20px] p-[8px] min-w-[200px]"
                style={{ boxShadow: "0px 2px 8px 0px rgba(18,34,50,0.25)" }}
              >
                <div
                  aria-hidden="true"
                  className="absolute border-[1.2px] border-[rgba(200,207,219,0.6)] border-solid inset-0 pointer-events-none rounded-[20px]"
                />
                {/* "Todas" option */}
                <button
                  onClick={() => { setActiveType(null); setTitleDropdownOpen(false); }}
                  className={`flex items-center gap-[8px] w-full px-[10px] py-[7px] rounded-[12px] hover:bg-[#f6f7f9] transition-colors cursor-pointer ${
                    activeType === null ? "bg-[#f6f7f9]" : ""
                  }`}
                >
                  <div className="flex items-center justify-center size-[24px] rounded-[6px] bg-[#DDE3EC] shrink-0">
                    <Lightning size={14} weight="duotone" style={{ color: "#4E6987" }} />
                  </div>
                  <span
                    className="text-[#28415c] flex-1 text-left"
                    style={{ fontSize: 13, fontWeight: activeType === null ? 600 : 500, letterSpacing: -0.3, ...fontFeature }}
                  >
                    Atividades
                  </span>
                  {activeType === null && (
                    <CheckCircle size={14} weight="fill" className="text-[#07ABDE] shrink-0" />
                  )}
                </button>

                <div className="h-[1px] bg-[#f0f2f5] my-[4px]" />

                {/* Individual types — single select */}
                {ACTIVITY_TYPES.map((type) => {
                  const conf = activityConfig[type];
                  const TypeIcon = conf.icon;
                  const isSelected = activeType === type;
                  return (
                    <button
                      key={type}
                      onClick={() => { setActiveType(type); setTitleDropdownOpen(false); }}
                      className={`flex items-center gap-[8px] w-full px-[10px] py-[7px] rounded-[12px] hover:bg-[#f6f7f9] transition-colors cursor-pointer ${
                        isSelected ? "bg-[#f6f7f9]" : ""
                      }`}
                    >
                      <div
                        className="flex items-center justify-center size-[24px] rounded-[6px] shrink-0"
                        style={{ backgroundColor: conf.bg }}
                      >
                        <TypeIcon size={14} weight="duotone" style={{ color: conf.color }} />
                      </div>
                      <span
                        className="text-[#28415c] flex-1 text-left"
                        style={{ fontSize: 13, fontWeight: isSelected ? 600 : 500, letterSpacing: -0.3, ...fontFeature }}
                      >
                        {activityTypeLabels[type]}
                      </span>
                      {isSelected && (
                        <CheckCircle size={14} weight="fill" className="text-[#07ABDE] shrink-0" />
                      )}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── ActionPill: portal target for mini-app content components ── */}
        {activeType !== null ? (
          /* Each content component portals its own ActionPill here */
          <div ref={setActionPillPortalNode} />
        ) : (
          /* Feed/Engajamento (no specific type) — inline ActionPill */
          <ActionPill>
            <ActionButton>
              <FunnelSimple size={18} weight="bold" />
            </ActionButton>
            <ActionButton onClick={() => {
              const allIds = filteredGroups.flatMap(g => g.items.map(a => a.id));
              if (expandedActivityIds.size >= allIds.length && allIds.length > 0) {
                setExpandedActivityIds(new Set());
              } else {
                setExpandedActivityIds(new Set(allIds));
              }
            }}>
              {expandedActivityIds.size > 0 ? (
                <ArrowsInLineVertical size={18} weight="bold" />
              ) : (
                <ArrowsOutLineVertical size={18} weight="bold" />
              )}
            </ActionButton>
          </ActionPill>
        )}
      </div>

      {/* ═══ FEED / ENGAJAMENTO Tabs (always visible when no specific type) ═══ */}
      <div className="px-[12px] pb-0">
        {activeType === null ? (
        <div
          className="flex gap-[4px] h-[44px] items-center justify-center overflow-hidden p-[4px] rounded-[100px] bg-[#f6f7f9]"
          style={{
            boxShadow:
              "inset 0px -0.5px 1px 0px rgba(255,255,255,0.3), inset 0px -0.5px 1px 0px rgba(255,255,255,0.25), inset 1px 1.5px 4px 0px rgba(0,0,0,0.08), inset 1px 1.5px 4px 0px rgba(0,0,0,0.1)",
          }}
        >
          {(["feed", "engajamento"] as const).map((tab) => {
            const isActive = activityTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActivityTab(tab)}
                className={`flex-1 h-[36px] flex items-center justify-center gap-[3px] rounded-[20px] cursor-pointer transition-all relative ${
                  isActive ? "bg-[#28415c] backdrop-blur-[50px]" : "hover:bg-white/20"
                }`}
                style={isActive ? { boxShadow: "0px 2px 4px 0px rgba(18,34,50,0.3)" } : undefined}
              >
                {isActive && (
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 rounded-[20px] pointer-events-none"
                    style={{ border: "0.5px solid rgba(200,207,219,0.6)" }}
                  />
                )}
                {tab === "feed" && (
                  <ListBullets size={15} weight={isActive ? "fill" : "duotone"} className={isActive ? "text-[#f6f7f9]" : "text-[#98989d]"} />
                )}
                {tab === "engajamento" && (
                  <ThumbsUp size={15} weight={isActive ? "fill" : "duotone"} className={isActive ? "text-[#f6f7f9]" : "text-[#98989d]"} />
                )}
                <span
                  className={`uppercase ${isActive ? "text-[#f6f7f9]" : "text-[#98989d]"}`}
                  style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}
                >
                  {tab}
                </span>
              </button>
            );
          })}
        </div>
        ) : null}
      </div>

      {/* ═══ Tab Content ═══ */}
      {activityTab === "feed" ? (
        <>
          {/* ═══ Mini App Content based on active type ═══ */}
          {activeType === "ligacao" ? (
            <CallLogContent calls={calls} layoutId={`${layoutId}-calls`} actionPillPortal={actionPillPortalNode} />
          ) : activeType === "tarefa" ? (
            <TasksContent tasks={tasks} actionPillPortal={actionPillPortalNode} />
          ) : activeType === "nota" ? (
            <NotesContent activities={activities} actionPillPortal={actionPillPortalNode} />
          ) : activeType === "compromisso" ? (
            <CompromissosContent activities={activities} actionPillPortal={actionPillPortalNode} />
          ) : (
            /* ═══ Activity Feed List (mensagem, email, or fallback) ═══ */
            <>
            {/* ActionPill for generic feed types (mensagem, email) — portaled to header */}
            {activeType && actionPillPortalNode && createPortal(
              <ActionPill>
                <ActionButton>
                  <FunnelSimple size={18} weight="bold" />
                </ActionButton>
                <ActionButton onClick={() => {
                  const allIds = filteredGroups.flatMap(g => g.items.map(a => a.id));
                  if (expandedActivityIds.size >= allIds.length && allIds.length > 0) {
                    setExpandedActivityIds(new Set());
                  } else {
                    setExpandedActivityIds(new Set(allIds));
                  }
                }}>
                  {expandedActivityIds.size > 0 ? (
                    <ArrowsInLineVertical size={18} weight="bold" />
                  ) : (
                    <ArrowsOutLineVertical size={18} weight="bold" />
                  )}
                </ActionButton>
              </ActionPill>,
              actionPillPortalNode
            )}
            <div className="flex-1 overflow-auto px-[4px] pt-[12px] pb-[72px]">
              <div className="flex flex-col gap-[4px] items-center">
                {filteredGroups.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-[32px] gap-[8px]">
                    {activeType ? (
                      <>
                        {(() => { const C = activityConfig[activeType].icon; return <C size={28} weight="duotone" className="text-[#C8CFDB]" />; })()}
                        <span className="text-[#98989d]" style={{ fontSize: 12, fontWeight: 500, ...fontFeature }}>
                          Nenhum(a) {activityTypeLabels[activeType].toLowerCase()} encontrado(a)
                        </span>
                      </>
                    ) : (
                      <>
                        <ListBullets size={28} weight="duotone" className="text-[#C8CFDB]" />
                        <span className="text-[#98989d]" style={{ fontSize: 12, fontWeight: 500, ...fontFeature }}>
                          Nenhuma atividade encontrada
                        </span>
                      </>
                    )}
                  </div>
                ) : (
                  filteredGroups.map((group) => (
                    <div key={group.group} className="w-full flex flex-col gap-[4px] items-center">
                      <span
                        className="text-[#64676c] uppercase text-center"
                        style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}
                      >
                        {group.group}
                      </span>
                      {group.items.map((a) => (
                        <ActivityItem
                          key={a.id}
                          activity={a}
                          expanded={expandedActivityIds.has(a.id)}
                          onToggle={() => setExpandedActivityIds(prev => {
                            const next = new Set(prev);
                            if (next.has(a.id)) next.delete(a.id);
                            else next.add(a.id);
                            return next;
                          })}
                        />
                      ))}
                    </div>
                  ))
                )}
              </div>
            </div>
            </>
          )}

          {/* ═══ CTA Button ═══ */}
          <div className="absolute bottom-0 left-0 right-0 p-[16px] flex justify-center pointer-events-none z-10">
            <button
              onClick={handleCtaClick}
              className="flex items-center justify-center gap-[4px] h-[40px] px-[20px] rounded-[500px] cursor-pointer transition-colors pointer-events-auto shadow-[0_2px_8px_rgba(0,0,0,0.1)]"
              style={{ backgroundColor: ctaBg, color: ctaText }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = ctaHover)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = ctaBg)}
            >
              <Plus size={16} weight="bold" />
              <span style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}>
                {ctaConfig.label}
              </span>
            </button>
          </div>
        </>
      ) : (
        /* ═══ ENGAJAMENTO TAB ═══ */
        <>
          {/* Subtitle */}
          <div className="flex items-center gap-[6px] px-[20px] pt-[12px] pb-[16px]">
            <span
              className="text-[#4e6987] flex-1"
              style={{ fontSize: 18, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}
            >
              Resumo de atividades
            </span>
          </div>

          <div className="flex-1 overflow-auto px-[16px] pb-[8px]">
            <div className="grid grid-cols-2 gap-[10px]">
              {engagementData.map((card, i) => (
                <EngagementCard key={i} {...card} />
              ))}
            </div>
          </div>

          {/* ═══ Add Activity Button ═══ */}
          <div className="sticky bottom-0 p-[16px] flex justify-center pointer-events-none">
            <button
              onClick={onAddActivity}
              className="flex items-center justify-center gap-[4px] h-[40px] px-[20px] rounded-[500px] cursor-pointer transition-colors pointer-events-auto shadow-[0_2px_8px_rgba(0,0,0,0.1)]"
              style={{ backgroundColor: ctaBg, color: ctaText }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = ctaHover)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = ctaBg)}
            >
              <Plus size={16} weight="bold" />
              <span style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}>
                Adicionar atividade
              </span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  CallLogContent — inline call log for the Ligações mini app          */
/* ------------------------------------------------------------------ */

function CallLogContent({ calls, layoutId, actionPillPortal }: { calls: CallRecord[]; layoutId: string; actionPillPortal: HTMLDivElement | null }) {
  const [callTab, setCallTab] = useState<"feitas" | "recebidas" | "perdidas">("feitas");
  const [expandedCallId, setExpandedCallId] = useState<string | null>(null);

  const filteredCalls = useMemo(() => {
    return calls.filter((c) =>
      (callTab === "feitas" && c.direction === "feita") ||
      (callTab === "recebidas" && c.direction === "recebida") ||
      (callTab === "perdidas" && c.direction === "perdida")
    );
  }, [calls, callTab]);

  return (
    <>
      {/* ── Ligação ActionPill (portaled to header) ── */}
      {actionPillPortal && createPortal(
        <ActionPill>
          <ActionButton>
            <FunnelSimple size={18} weight="bold" />
          </ActionButton>
        </ActionPill>,
        actionPillPortal
      )}
      {/* Call sub-tabs */}
      <div className="px-[12px] pb-[8px]">
        <div
          className="flex gap-[4px] h-[36px] items-center justify-center overflow-hidden p-[3px] rounded-[100px] bg-[#f6f7f9]"
          style={{
            boxShadow:
              "inset 0px -0.5px 1px 0px rgba(255,255,255,0.3), inset 0px -0.5px 1px 0px rgba(255,255,255,0.25), inset 1px 1.5px 4px 0px rgba(0,0,0,0.08), inset 1px 1.5px 4px 0px rgba(0,0,0,0.1)",
          }}
        >
          {(["feitas", "recebidas", "perdidas"] as const).map((tab) => {
            const isActive = callTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setCallTab(tab)}
                className={`flex-1 h-[30px] flex items-center justify-center rounded-[20px] cursor-pointer transition-colors duration-200 relative z-[1] ${
                  isActive ? "" : "text-[#98989d] hover:text-[#4E6987] hover:bg-[#e8eaee]"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId={layoutId}
                    className="absolute inset-0 rounded-[20px]"
                    style={{
                      backgroundColor: "#28415C",
                      border: "0.5px solid rgba(200,207,219,0.6)",
                      boxShadow: "0px 2px 4px 0px rgba(18,34,50,0.3)",
                    }}
                    transition={{ type: "spring", stiffness: 500, damping: 35, mass: 0.8 }}
                  />
                )}
                <span
                  className={`relative z-[1] uppercase ${isActive ? "text-[#f6f7f9]" : ""}`}
                  style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}
                >
                  {tab}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Call list */}
      <div className="flex-1 overflow-auto px-[4px]">
        <div className="flex flex-col">
          {filteredCalls.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-[32px] gap-[8px]">
              <Phone size={28} weight="duotone" className="text-[#C8CFDB]" />
              <span className="text-[#98989d]" style={{ fontSize: 12, fontWeight: 500, ...fontFeature }}>
                Nenhuma ligação encontrada
              </span>
            </div>
          ) : (
            filteredCalls.map((call) => (
              <CallItemRow
                key={call.id}
                call={call}
                expanded={expandedCallId === call.id}
                onToggle={() => setExpandedCallId(expandedCallId === call.id ? null : call.id)}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  CallItemRow — expandable call record row                            */
/* ------------------------------------------------------------------ */

const directionConfig: Record<CallRecord["direction"], { icon: React.ComponentType<any>; color: string; label: string }> = {
  feita: { icon: PhoneOutgoing, color: "#3CCEA7", label: "Feita" },
  recebida: { icon: PhoneIncoming, color: "#07ABDE", label: "Recebida" },
  perdida: { icon: PhoneSlash, color: "#F56233", label: "Perdida" },
};

function CallItemRow({ call, expanded, onToggle }: { call: CallRecord; expanded: boolean; onToggle: () => void }) {
  const dir = directionConfig[call.direction];
  const DirIcon = dir.icon;

  return (
    <div className={`rounded-[8px] transition-colors ${expanded ? "bg-[#f6f7f9]" : "hover:bg-[#f6f7f9]"}`}>
      {/* Main row */}
      <div
        className="flex items-center gap-[10px] px-[12px] py-[8px] cursor-pointer"
        onClick={onToggle}
      >
        <div className={`flex items-center justify-center size-[13px] shrink-0 text-[#4e6987] transition-transform ${expanded ? "rotate-90" : ""}`}>
          <CaretRight size={13} weight="bold" />
        </div>
        <div className="relative shrink-0 size-[35px]">
          <img alt="" className="block size-full rounded-full object-cover" src={call.avatarUrl || imgAvatar} />
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <span
            className="text-[#4e6987] truncate"
            style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, lineHeight: "17px", ...fontFeature }}
          >
            {call.phone}
          </span>
          <span
            className="text-[#4e6987] uppercase"
            style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}
          >
            {call.date}
          </span>
        </div>
        {/* Direction indicator (not a button) */}
        <div className="flex items-center justify-center size-[28px] shrink-0">
          <DirIcon size={17} weight="duotone" style={{ color: dir.color }} />
        </div>
      </div>

      {/* Expanded detail */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="flex pl-[41px] pr-[12px] pb-[12px]">
              {/* Vertical green line */}
              <div className="flex items-stretch mr-[14px]">
                <div className="w-[1px] bg-[#D9F8EF] self-stretch" />
              </div>
              {/* Detail content */}
              <div className="flex flex-col gap-[8px] flex-1 min-w-0">
                {call.title && (
                  <span
                    className="text-[#98989d]"
                    style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}
                  >
                    {call.title}
                  </span>
                )}
                {call.duration && (
                  <div className="flex items-center gap-[6px]">
                    <Timer size={14} weight="duotone" className="text-[#98989d] shrink-0" />
                    <span
                      className="text-[#98989d]"
                      style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, lineHeight: "17px", ...fontFeature }}
                    >
                      {call.duration}
                    </span>
                  </div>
                )}
                {call.notes && (
                  <div className="flex items-start gap-[6px]">
                    <Notepad size={14} weight="duotone" className="text-[#98989d] shrink-0 mt-[1px]" />
                    <span
                      className="text-[#98989d]"
                      style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, lineHeight: "17px", ...fontFeature }}
                    >
                      {call.notes}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  DialerPanel — full-container phone dialer                           */
/* ------------------------------------------------------------------ */

const DIALER_KEYS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["*", "0", "#"],
] as const;

function DialerPanel({ onClose }: { onClose: () => void }) {
  const [digits, setDigits] = useState("+55 ");
  const { minimize: minimizeWindow, setDialerOpen } = useMultitask();

  const handleKeyPress = (key: string) => {
    setDigits((prev) => prev + key);
  };

  const handleBackspace = () => {
    setDigits((prev) => (prev.length > 0 ? prev.slice(0, -1) : prev));
  };

  // Format phone display
  const displayNumber = digits || "+55";

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-[8px] px-[20px] py-[16px]">
        <div className="flex items-center justify-center size-[28px] rounded-[8px] bg-[#D9F8EF] shrink-0">
          <Numpad size={17} weight="regular" style={{ color: "#3CCEA7" }} />
        </div>
        <span
          className="text-[#28415c] flex-1"
          style={{ fontSize: 18, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}
        >
          Discador
        </span>
        <ActionPill>
          <ActionButton onClick={() => {
            // Minimize dialer to taskbar
            minimizeWindow({
              id: "__dialer__",
              title: "Discador",
              path: "",
              type: "dialer",
            });
            setDialerOpen(false);
          }}>
            <ArrowSquareDownRight size={18} weight="bold" />
          </ActionButton>
          <ActionButton onClick={onClose}>
            <X size={18} weight="bold" />
          </ActionButton>
        </ActionPill>
      </div>

      {/* Phone number display */}
      <div className="flex-1 flex flex-col items-center justify-center px-[20px]">
        <div className="flex items-center gap-[8px] mb-[32px] min-h-[40px]">
          <span
            className="text-[#28415c] text-center"
            style={{ fontSize: 24, fontWeight: 500, letterSpacing: -0.5, lineHeight: "32px", ...fontFeature }}
          >
            {displayNumber}
          </span>
          {digits.length > 0 && (
            <button
              onClick={handleBackspace}
              className="flex items-center justify-center size-[28px] rounded-full text-[#98989d] hover:text-[#28415c] hover:bg-[#f6f7f9] transition-colors cursor-pointer"
            >
              <Backspace size={20} weight="duotone" />
            </button>
          )}
        </div>

        {/* Keypad */}
        <div className="flex flex-col gap-[12px] items-center">
          {DIALER_KEYS.map((row, rowIdx) => (
            <div key={rowIdx} className="flex gap-[16px]">
              {row.map((key) => (
                <button
                  key={key}
                  onClick={() => handleKeyPress(key)}
                  className="flex items-center justify-center size-[60px] rounded-full bg-[#f6f7f9] hover:bg-[#e8eaee] active:bg-[#dde3ec] transition-colors cursor-pointer"
                  style={{
                    boxShadow: "0px 1px 2px 0px rgba(0,0,0,0.05)",
                  }}
                >
                  <span
                    className="text-[#4e6987]"
                    style={{ fontSize: 24, fontWeight: 500, lineHeight: "22px", ...fontFeature }}
                  >
                    {key}
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Call button */}
        <div className="mt-[24px]">
          <button
            className="flex items-center justify-center size-[56px] rounded-full cursor-pointer transition-all hover:scale-105 active:scale-95"
            style={{
              backgroundColor: "#3CCEA7",
              boxShadow: "0px 4px 12px 0px rgba(60,206,167,0.4)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#2BB594")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#3CCEA7")}
          >
            <Phone size={24} weight="duotone" className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  EngagementCard — metric card for the Engajamento tab                */
/* ------------------------------------------------------------------ */

function EngagementCard({
  icon: Icon,
  iconColor,
  label,
  value,
  status,
}: {
  icon: React.ComponentType<any>;
  iconColor: string;
  label: string;
  value: string;
  status?: "ACIMA DA MÉDIA" | "ABAIXO DA MÉDIA" | "NA MÉDIA";
}) {
  const statusColor = status === "ACIMA DA MÉDIA" ? "#3CCEA7" : status === "ABAIXO DA MÉDIA" ? "#F56233" : status === "NA MÉDIA" ? "#EAC23D" : undefined;
  const StatusIcon = status === "ACIMA DA MÉDIA" ? TrendUp : status === "ABAIXO DA MÉDIA" ? TrendDown : status === "NA MÉDIA" ? ArrowsLeftRight : null;

  return (
    <div
      className="flex flex-col gap-[6px] rounded-[12px] bg-[#f6f7f9] px-[14px] py-[12px]"
      style={{ border: "1px solid rgba(200,207,219,0.4)" }}
    >
      <div className="flex items-center gap-[4px]">
        <span
          className="text-[#4e6987] uppercase"
          style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.5, lineHeight: "16px", ...fontFeature }}
        >
          {label}
        </span>
      </div>
      <span
        className="text-[#28415c]"
        style={{ fontSize: 14, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}
      >
        {value}
      </span>
      {status && StatusIcon && (
        <div className="flex items-center gap-[3px]">
          <StatusIcon size={10} weight="bold" style={{ color: statusColor }} />
          <span
            style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.3, color: statusColor, ...fontFeature }}
          >
            {status}
          </span>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  NotesContent — post-it style notes for the Notas mini app           */
/* ------------------------------------------------------------------ */

const POST_IT_COLORS = [
  { bg: "#FEEDCA", border: "#F5DFA3", text: "#8B6914" },
  { bg: "#FFEDEB", border: "#FDD8D3", text: "#A04030" },
  { bg: "#E8E8FD", border: "#D4D4F5", text: "#5C5CA0" },
  { bg: "#DCF0FF", border: "#BDE0FA", text: "#1A6B96" },
  { bg: "#D9F8EF", border: "#B3EDDB", text: "#1E7A5C" },
  { bg: "#FDE8F5", border: "#F5CCE8", text: "#8B2E6B" },
];

function NotesContent({ activities, actionPillPortal }: { activities: Activity[]; actionPillPortal: HTMLDivElement | null }) {
  const notes = activities.filter((a) => a.type === "nota");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [pinnedMap, setPinnedMap] = useState<Record<string, boolean>>({});

  const togglePin = (id: string) => {
    setPinnedMap((prev) => {
      const copy = { ...prev };
      if (copy[id]) delete copy[id];
      else copy[id] = true;
      return copy;
    });
  };

  const sortedNotes = useMemo(() => {
    const pinned = notes.filter((n) => pinnedMap[n.id]);
    const unpinned = notes.filter((n) => !pinnedMap[n.id]);
    return [...pinned, ...unpinned];
  }, [notes, pinnedMap]);

  return (
    <>
      {/* ── Nota ActionPill (portaled to header) ── */}
      {actionPillPortal && createPortal(
        <ActionPill>
          <ActionButton>
            <FunnelSimple size={18} weight="bold" />
          </ActionButton>
          <ActionButton onClick={() => setViewMode((v) => (v === "grid" ? "list" : "grid"))}>
            {viewMode === "grid" ? (
              <SquaresFour size={18} weight="bold" />
            ) : (
              <Rows size={18} weight="bold" />
            )}
          </ActionButton>
        </ActionPill>,
        actionPillPortal
      )}
      <div className="flex-1 overflow-auto pt-[12px] px-[12px] pb-[72px]">
      {sortedNotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-[32px] gap-[8px]">
          <NoteBlank size={28} weight="duotone" className="text-[#C8CFDB]" />
          <span className="text-[#98989d]" style={{ fontSize: 12, fontWeight: 500, ...fontFeature }}>
            Nenhuma nota encontrada
          </span>
        </div>
      ) : viewMode === "grid" ? (
        <div style={{ columns: 2, columnGap: 10 }}>
          {sortedNotes.map((note, i) => {
            const isPinned = !!pinnedMap[note.id];
            const cardBg = isPinned ? "#FEEDCA" : "#F6F7F9";
            const cardText = isPinned ? "#6b5a2e" : "#4a4a4a";
            const PinIcon = isPinned ? PushPinSimple : PushPin;
            return (
              <div
                key={note.id}
                className="flex flex-col gap-[8px] rounded-[12px] p-[14px] transition-all hover:scale-[1.02] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] cursor-pointer group relative"
                style={{
                  backgroundColor: cardBg,
                  breakInside: "avoid",
                  marginBottom: 10,
                  maxHeight: 220,
                }}
              >
                {/* Pin button */}
                <button
                  onClick={(e) => { e.stopPropagation(); togglePin(note.id); }}
                  className={`absolute top-[10px] right-[10px] z-10 flex items-center justify-center size-[22px] shrink-0 rounded-full transition-all hover:bg-black/5 cursor-pointer ${isPinned ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                >
                  <PinIcon
                    size={13}
                    weight={isPinned ? "fill" : "duotone"}
                    style={{ color: cardText, opacity: isPinned ? 1 : 0.55 }}
                  />
                </button>

                {/* Note body */}
                {note.notes && (
                  <span
                    className="flex-1 pr-[18px] overflow-hidden"
                    style={{
                      fontSize: 12,
                      fontWeight: 400,
                      letterSpacing: -0.2,
                      lineHeight: "17px",
                      color: cardText,
                      opacity: 0.8,
                      display: "-webkit-box",
                      WebkitLineClamp: 9,
                      WebkitBoxOrient: "vertical",
                      ...fontFeature,
                    }}
                  >
                    {note.notes}
                  </span>
                )}

                {/* Date */}
                <span
                  className="uppercase mt-auto shrink-0"
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: 0.5,
                    lineHeight: "14px",
                    color: cardText,
                    opacity: 0.5,
                    ...fontFeature,
                  }}
                >
                  {note.date}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        /* ═══ List View ═══ */
        <div className="flex flex-col gap-[2px]">
          {sortedNotes.map((note) => {
            const isPinned = !!pinnedMap[note.id];
            const PinIcon = isPinned ? PushPinSimple : PushPin;
            return (
              <div
                key={note.id}
                className="flex items-center gap-[10px] rounded-[8px] px-[12px] py-[6px] hover:bg-[#f6f7f9] transition-colors cursor-pointer group"
                style={isPinned ? { backgroundColor: "#FFF9ED" } : undefined}
              >
                {/* Pin */}
                <button
                  onClick={(e) => { e.stopPropagation(); togglePin(note.id); }}
                  className={`flex items-center justify-center size-[22px] shrink-0 rounded-full transition-all hover:bg-black/5 cursor-pointer ${isPinned ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                >
                  <PinIcon
                    size={13}
                    weight={isPinned ? "fill" : "duotone"}
                    className={isPinned ? "text-[#917822]" : "text-[#98989d]"}
                  />
                </button>

                {/* Note icon */}
                <NoteBlank size={16} weight="duotone" className="text-[#98989d] shrink-0" />

                {/* Text */}
                <span
                  className="flex-1 truncate"
                  style={{
                    fontSize: 13,
                    fontWeight: 400,
                    letterSpacing: -0.2,
                    lineHeight: "20px",
                    color: "#28415c",
                    ...fontFeature,
                  }}
                >
                  {note.notes || "Sem conteúdo"}
                </span>

                {/* Date */}
                <span
                  className="uppercase shrink-0"
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: 0.3,
                    color: "#98989d",
                    ...fontFeature,
                  }}
                >
                  {note.date}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  CompromissosContent — calendar events for the Compromissos mini app */
/* ------------------------------------------------------------------ */

function CompromissosContent({ activities, actionPillPortal }: { activities: Activity[]; actionPillPortal: HTMLDivElement | null }) {
  const compromissos = activities.filter((a) => a.type === "compromisso");
  const [compTab, setCompTab] = useState<"proximos" | "passados">("proximos");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const proximos = compromissos.filter((c) => c.group === "FUTURO");
  const passados = compromissos.filter((c) => c.group !== "FUTURO");
  const visible = compTab === "proximos" ? proximos : passados;

  return (
    <>
      {/* ── Compromisso ActionPill (portaled to header) ── */}
      {actionPillPortal && createPortal(
        <ActionPill>
          <ActionButton>
            <FunnelSimple size={18} weight="bold" />
          </ActionButton>
        </ActionPill>,
        actionPillPortal
      )}
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Segmented control: Próximos / Passados */}
      <div className="px-[12px] pt-[4px] pb-0">
        <div
          className="flex gap-[4px] h-[36px] items-center justify-center overflow-hidden p-[3px] rounded-[100px] bg-[#f6f7f9]"
          style={{
            boxShadow:
              "inset 0px -0.5px 1px 0px rgba(255,255,255,0.3), inset 0px -0.5px 1px 0px rgba(255,255,255,0.25), inset 1px 1.5px 4px 0px rgba(0,0,0,0.08), inset 1px 1.5px 4px 0px rgba(0,0,0,0.1)",
          }}
        >
          {([
            { key: "proximos" as const, label: "Próximos", count: proximos.length },
            { key: "passados" as const, label: "Passados", count: passados.length },
          ]).map((tab) => {
            const isActive = compTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setCompTab(tab.key)}
                className={`flex-1 h-[30px] flex items-center justify-center gap-[4px] rounded-[20px] cursor-pointer transition-all relative ${
                  isActive ? "bg-[#28415c] backdrop-blur-[50px]" : "hover:bg-white/20"
                }`}
                style={isActive ? { boxShadow: "0px 2px 4px 0px rgba(18,34,50,0.3)" } : undefined}
              >
                {isActive && (
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 rounded-[20px] pointer-events-none"
                    style={{ border: "0.5px solid rgba(200,207,219,0.6)" }}
                  />
                )}
                <span
                  className={`uppercase ${isActive ? "text-[#f6f7f9]" : "text-[#98989d]"}`}
                  style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}
                >
                  {tab.label}
                </span>
                <span
                  className={`rounded-[6px] px-[5px] py-[0px] ${isActive ? "bg-white/15 text-[#f6f7f9]" : "bg-[#DDE3EC]/60 text-[#98989d]"}`}
                  style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.3, lineHeight: "16px", ...fontFeature }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Compromisso list */}
      <div className="flex-1 overflow-auto pt-[12px] px-[4px] pb-[72px]">
        <div className="flex flex-col">
          {visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-[32px] gap-[8px]">
              <CalendarBlank size={28} weight="duotone" className="text-[#C8CFDB]" />
              <span className="text-[#98989d]" style={{ fontSize: 12, fontWeight: 500, ...fontFeature }}>
                {compTab === "proximos" ? "Nenhum compromisso agendado" : "Nenhum compromisso passado"}
              </span>
            </div>
          ) : (
            visible.map((comp) => {
              const isExpanded = expandedId === comp.id;
              const hasDetails = !!(comp.meetingLink || comp.attendees?.length || comp.duration || comp.notes || comp.location);
              return (
                <div key={comp.id} className={`rounded-[8px] transition-colors ${isExpanded ? "bg-[#f6f7f9]" : "hover:bg-[#f6f7f9]"}`}>
                  {/* Main row */}
                  <div
                    className="flex items-center gap-[10px] px-[12px] py-[8px] cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : comp.id)}
                  >
                    <div className={`flex items-center justify-center size-[13px] shrink-0 text-[#4e6987] transition-transform ${isExpanded ? "rotate-90" : ""}`}>
                      <CaretRight size={13} weight="bold" />
                    </div>
                    <div className="flex items-center justify-center size-[28px] rounded-[8px] shrink-0" style={{ backgroundColor: "#FFEDEB" }}>
                      <CalendarBlank size={17} weight="duotone" style={{ color: "#FF8C76" }} />
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span
                        className="text-[#28415c] truncate"
                        style={{ fontSize: 13, fontWeight: 500, letterSpacing: -0.3, lineHeight: "20px", ...fontFeature }}
                      >
                        {comp.title || comp.label}
                      </span>
                      <span
                        className="text-[#98989d] uppercase"
                        style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, lineHeight: "14px", ...fontFeature }}
                      >
                        {comp.date}
                      </span>
                    </div>
                    {/* Three-dot menu */}
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center justify-center size-[28px] shrink-0 text-[#98989d] hover:text-[#4e6987] hover:bg-[#dde3ec] rounded-full transition-colors cursor-pointer"
                    >
                      <DotsThreeVertical size={16} weight="bold" />
                    </button>
                  </div>

                  {/* Expanded detail */}
                  <AnimatePresence initial={false}>
                    {isExpanded && hasDetails && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="flex pl-[41px] pr-[12px] pb-[12px]">
                          <div className="flex items-stretch mr-[14px]">
                            <div className="w-[1px] bg-[#FFEDEB] self-stretch" />
                          </div>
                          <div className="flex flex-col gap-[8px] flex-1 min-w-0">
                            {comp.meetingLink && (
                              <div className="flex items-center gap-[6px]">
                                <VideoCamera size={14} weight="duotone" className="text-[#07ABDE] shrink-0" />
                                <span
                                  className="text-[#07ABDE] truncate"
                                  style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, lineHeight: "17px", ...fontFeature }}
                                >
                                  {comp.meetingLink}
                                </span>
                              </div>
                            )}
                            {comp.attendees && comp.attendees.length > 0 && (
                              <div className="flex items-center gap-[6px]">
                                <UsersThree size={14} weight="duotone" className="text-[#98989d] shrink-0" />
                                <span
                                  className="text-[#98989d] truncate"
                                  style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, lineHeight: "17px", ...fontFeature }}
                                >
                                  {comp.attendees.join(", ")}
                                </span>
                              </div>
                            )}
                            {comp.location && (
                              <div className="flex items-center gap-[6px]">
                                <CalendarBlank size={14} weight="duotone" className="text-[#98989d] shrink-0" />
                                <span
                                  className="text-[#98989d]"
                                  style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, lineHeight: "17px", ...fontFeature }}
                                >
                                  {comp.location}
                                </span>
                              </div>
                            )}
                            {comp.duration && (
                              <div className="flex items-center gap-[6px]">
                                <Timer size={14} weight="duotone" className="text-[#98989d] shrink-0" />
                                <span
                                  className="text-[#98989d]"
                                  style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, lineHeight: "17px", ...fontFeature }}
                                >
                                  {comp.duration}
                                </span>
                              </div>
                            )}
                            {comp.notes && (
                              <div className="flex items-start gap-[6px]">
                                <Notepad size={14} weight="duotone" className="text-[#98989d] shrink-0 mt-[1px]" />
                                <span
                                  className="text-[#98989d]"
                                  style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, lineHeight: "17px", ...fontFeature }}
                                >
                                  {comp.notes}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  TasksContent — inline task list for the Tarefas mini app            */
/* ------------------------------------------------------------------ */

const SAMPLE_TASKS: TaskItem[] = [
  { id: "t1", title: "Deploy", dueDate: "Hoje", dueTime: "18:30", completed: false, starred: false },
  { id: "t2", title: "Commit", dueDate: "Hoje", dueTime: "18:00", completed: false, starred: false },
  { id: "t3", title: "Commit", completed: true, starred: false, completedAt: "qua., 25 de fev.", dueDate: "Amanhã", dueTime: "11:00" },
];

function TasksContent({ tasks, actionPillPortal }: { tasks: TaskItem[]; actionPillPortal: HTMLDivElement | null }) {
  const [localTasks, setLocalTasks] = useState<TaskItem[]>(() =>
    tasks.length > 0 ? tasks : SAMPLE_TASKS
  );
  const [taskTab, setTaskTab] = useState<"abertas" | "concluidas">("abertas");

  const pendingTasks = localTasks.filter((t) => !t.completed);
  const completedTasks = localTasks.filter((t) => t.completed);
  const visibleTasks = taskTab === "abertas" ? pendingTasks : completedTasks;

  const toggleComplete = (id: string) => {
    setLocalTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              completed: !t.completed,
              completedAt: !t.completed ? "hoje" : undefined,
            }
          : t
      )
    );
  };

  const toggleStar = (id: string) => {
    setLocalTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, starred: !t.starred } : t))
    );
  };

  return (
    <>
      {/* ── Tarefa ActionPill (portaled to header) ── */}
      {actionPillPortal && createPortal(
        <ActionPill>
          <ActionButton>
            <FunnelSimple size={18} weight="bold" />
          </ActionButton>
        </ActionPill>,
        actionPillPortal
      )}
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Segmented control: Abertas / Concluídas */}
      <div className="px-[12px] pt-[4px] pb-0">
        <div
          className="flex gap-[4px] h-[36px] items-center justify-center overflow-hidden p-[3px] rounded-[100px] bg-[#f6f7f9]"
          style={{
            boxShadow:
              "inset 0px -0.5px 1px 0px rgba(255,255,255,0.3), inset 0px -0.5px 1px 0px rgba(255,255,255,0.25), inset 1px 1.5px 4px 0px rgba(0,0,0,0.08), inset 1px 1.5px 4px 0px rgba(0,0,0,0.1)",
          }}
        >
          {([
            { key: "abertas" as const, label: "Abertas", count: pendingTasks.length },
            { key: "concluidas" as const, label: "Concluídas", count: completedTasks.length },
          ]).map((tab) => {
            const isActive = taskTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setTaskTab(tab.key)}
                className={`flex-1 h-[30px] flex items-center justify-center gap-[4px] rounded-[20px] cursor-pointer transition-all relative ${
                  isActive ? "bg-[#28415c] backdrop-blur-[50px]" : "hover:bg-white/20"
                }`}
                style={isActive ? { boxShadow: "0px 2px 4px 0px rgba(18,34,50,0.3)" } : undefined}
              >
                {isActive && (
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 rounded-[20px] pointer-events-none"
                    style={{ border: "0.5px solid rgba(200,207,219,0.6)" }}
                  />
                )}
                <span
                  className={`uppercase ${isActive ? "text-[#f6f7f9]" : "text-[#98989d]"}`}
                  style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}
                >
                  {tab.label}
                </span>
                <span
                  className={`rounded-[6px] px-[5px] py-[0px] ${isActive ? "bg-white/15 text-[#f6f7f9]" : "bg-[#DDE3EC]/60 text-[#98989d]"}`}
                  style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.3, lineHeight: "16px", ...fontFeature }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-auto pt-[12px] px-[4px]">
        <div className="flex flex-col gap-[4px]">
          {visibleTasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onToggleComplete={() => toggleComplete(task.id)}
              onToggleStar={() => toggleStar(task.id)}
            />
          ))}
        </div>

        {/* Empty state */}
        {visibleTasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-[32px] gap-[8px]">
            <CheckCircle size={28} weight="duotone" className="text-[#C8CFDB]" />
            <span className="text-[#98989d]" style={{ fontSize: 12, fontWeight: 500, ...fontFeature }}>
              {taskTab === "abertas" ? "Nenhuma tarefa pendente" : "Nenhuma tarefa concluída"}
            </span>
          </div>
        )}
      </div>
    </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  TaskRow — single task row                                           */
/* ------------------------------------------------------------------ */

function TaskRow({
  task,
  onToggleComplete,
  onToggleStar,
}: {
  task: TaskItem;
  onToggleComplete: () => void;
  onToggleStar: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="flex items-start gap-[4px] px-[12px] py-[6px] rounded-[8px] hover:bg-[#f6f7f9] transition-colors w-full group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Checkbox circle */}
      <button
        onClick={onToggleComplete}
        className="flex items-center justify-center size-[24px] shrink-0 mt-[1px] cursor-pointer"
      >
        {task.completed ? (
          <div className="flex items-center justify-center size-[22px] rounded-full bg-[#8C8CD4]">
            <Check size={14} weight="bold" className="text-white" />
          </div>
        ) : (
          <Circle
            size={22}
            weight="regular"
            className="text-[#C8CFDB] hover:text-[#8C8CD4] transition-colors"
          />
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col gap-[4px]">
        <span
          className={task.completed ? "text-[#98989d] line-through" : "text-[#28415c]"}
          style={{ fontSize: 14, fontWeight: 400, letterSpacing: -0.3, lineHeight: "20px", ...fontFeature }}
        >
          {task.title}
        </span>

        {/* Completed at info */}
        {task.completed && task.completedAt && (
          <span
            className="text-[#98989d]"
            style={{ fontSize: 11, fontWeight: 400, letterSpacing: -0.2, ...fontFeature }}
          >
            Concluída em: {task.completedAt}
          </span>
        )}

        {/* Due date badge */}
        {(task.dueDate || task.dueTime) && (
          <div className="flex items-center gap-[4px] mt-[1px]">
            <div
              className={`flex items-center gap-[4px] rounded-[6px] px-[8px] py-[3px] ${
                task.completed ? "bg-[#f0f2f5]" : "bg-[#E8E8FD]"
              }`}
            >
              <CalendarBlank
                size={12}
                weight="duotone"
                className={task.completed ? "text-[#98989d]" : "text-[#8C8CD4]"}
              />
              <span
                className={task.completed ? "text-[#98989d]" : "text-[#8C8CD4]"}
                style={{ fontSize: 11, fontWeight: 600, letterSpacing: -0.2, ...fontFeature }}
              >
                {task.completed && task.dueDate ? `Próxima: ${task.dueDate}` : task.dueDate}
                {task.dueTime ? `, ${task.dueTime}` : ""}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Star button */}
      <button
        onClick={onToggleStar}
        className={`flex items-center justify-center size-[24px] shrink-0 mt-[1px] cursor-pointer transition-opacity ${
          hovered || task.starred ? "opacity-100" : "opacity-0"
        }`}
      >
        <Star
          size={18}
          weight={task.starred ? "fill" : "regular"}
          className={task.starred ? "text-[#EAC23D]" : "text-[#C8CFDB] hover:text-[#EAC23D]"}
        />
      </button>
    </div>
  );
}