/**
 * CRM Detail Shared Components
 *
 * Extracted from the 4 detail pages (lead, opportunity, account, contact)
 * to eliminate ~1100 lines of duplicated UI code.
 */

import { useState } from "react";
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
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";
import imgAvatar from "figma:asset/d5fb6bc139a3da5bc43ab0601942a4cf33722fa1.png";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

export const fontFeature = { fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" };

/* ------------------------------------------------------------------ */
/*  Shared Types                                                       */
/* ------------------------------------------------------------------ */

export interface Activity {
  id: string;
  type: "compromisso" | "tarefa" | "ligacao" | "nota" | "mensagem" | "email";
  label: string;
  date: string;
  group: string;
}

export interface CallRecord {
  id: string;
  phone: string;
  date: string;
  avatarUrl: string;
}

export const activityConfig: Record<Activity["type"], { icon: React.ComponentType<any>; bg: string; color: string }> = {
  compromisso: { icon: CalendarBlank, bg: "#FFEDEB", color: "#FF8C76" },
  tarefa: { icon: CheckCircle, bg: "#E8E8FD", color: "#8C8CD4" },
  ligacao: { icon: Phone, bg: "#D9F8EF", color: "#3CCEA7" },
  nota: { icon: NoteBlank, bg: "#FEEDCA", color: "#EAC23D" },
  mensagem: { icon: ChatCircle, bg: "#DCF0FF", color: "#07ABDE" },
  email: { icon: Envelope, bg: "#DDE3EC", color: "#4E6987" },
};

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
      className="flex items-center justify-center size-[32px] rounded-full hover:bg-[#DCF0FF] active:bg-[#07abde] active:text-[#f6f7f9] transition-colors text-[#28415c] cursor-pointer"
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  ActivityItem                                                       */
/* ------------------------------------------------------------------ */

export function ActivityItem({ activity }: { activity: Activity }) {
  const config = activityConfig[activity.type];
  const Icon = config.icon;

  return (
    <div className="flex gap-[4px] items-center px-[12px] py-[6px] rounded-[8px] hover:bg-[#f6f7f9] transition-colors w-full">
      {/* Expand arrow */}
      <button className="flex items-center justify-center size-[28px] shrink-0 text-[#4e6987] cursor-pointer rounded-full hover:bg-[#dde3ec] transition-colors">
        <CaretRight size={14} weight="bold" />
      </button>
      {/* Type icon */}
      <div
        className="flex items-center justify-center size-[28px] rounded-[8px] shrink-0"
        style={{ backgroundColor: config.bg }}
      >
        <Icon size={17} weight="duotone" style={{ color: config.color }} />
      </div>
      {/* Label */}
      <span
        className="text-[#4e6987] flex-1"
        style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}
      >
        {activity.label}
      </span>
      {/* Date */}
      <span
        className="text-[#4e6987] text-right shrink-0"
        style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", textTransform: "uppercase", ...fontFeature }}
      >
        {activity.date}
      </span>
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
          {calls.map((call) => (
            <div key={call.id} className="flex items-center gap-[10px] px-[12px] py-[8px] rounded-[8px] hover:bg-[#f6f7f9] transition-colors cursor-pointer">
              <button className="flex items-center justify-center size-[28px] shrink-0 text-[#4e6987] cursor-pointer rounded-full hover:bg-[#dde3ec] transition-colors">
                <CaretRight size={14} weight="bold" />
              </button>
              <div className="relative shrink-0 size-[35px]">
                <img alt="" className="block size-full rounded-full object-cover" src={imgAvatar} />
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
              <button className="flex items-center justify-center size-[28px] shrink-0 text-[#28415c] cursor-pointer rounded-full hover:bg-[#dde3ec] transition-colors">
                <Phone size={17} weight="duotone" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="p-[16px] flex justify-center">
        <button
          className="flex items-center justify-center gap-[4px] h-[40px] px-[20px] rounded-[500px] cursor-pointer transition-colors"
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