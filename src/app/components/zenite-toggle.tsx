/**
 * ZeniteToggle — Global toggle switch component (Figma design system)
 *
 * ON:  #3ccea7 track with color-burn overlay
 * OFF: gray track with luminosity + color-burn blend
 * Knob: white, spring-animated, subtle shadow
 * Inner shadow overlay on track for depth
 *
 * Usage:
 *   import { ZeniteToggle } from "./components/zenite-toggle";
 *   <ZeniteToggle active={value} onChange={() => setValue(!value)} />
 */
import { motion, AnimatePresence } from "motion/react";

const TRACK_W = 36;
const TRACK_H = 20;
const KNOB = 16;
const PAD = 2;
const X_OFF = PAD;
const X_ON = TRACK_W - KNOB - PAD;

const SHADOW_ON =
  "inset 0px -0.5px 1px 0px rgba(94,94,94,0.3), inset 0px -0.5px 1px 0px rgba(255,255,255,0.2), inset 0px 3px 3px 0px rgba(128,128,128,0.18), inset 0px 3px 3px 0px rgba(0,0,0,0.15)";
const SHADOW_OFF =
  "inset 0px -0.5px 1px 0px rgba(255,255,255,0.3), inset 0px -0.5px 1px 0px rgba(255,255,255,0.25), inset 1px 1.5px 4px 0px rgba(0,0,0,0.08), inset 1px 1.5px 4px 0px rgba(0,0,0,0.1)";

interface ZeniteToggleProps {
  active: boolean;
  onChange: () => void;
  disabled?: boolean;
  title?: string;
  className?: string;
}

export function ZeniteToggle({ active, onChange, disabled, title, className = "" }: ZeniteToggleProps) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onChange(); }}
      disabled={disabled}
      className={`relative flex items-center overflow-clip rounded-[100px] shrink-0 isolate ${disabled ? "opacity-50 cursor-default" : "cursor-pointer"} ${className}`}
      style={{ width: TRACK_W, height: TRACK_H }}
      title={title}
    >
      {/* Track background layers */}
      <div aria-hidden className="absolute inset-0 pointer-events-none rounded-[100px]">
        <AnimatePresence initial={false}>
          {active ? (
            <motion.div
              key="on-bg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 rounded-[100px]"
            >
              <div className="absolute bg-[#3ccea7] inset-0 rounded-[100px]" />
              <div className="absolute bg-[rgba(208,208,208,0.5)] inset-0 mix-blend-color-burn rounded-[100px]" />
            </motion.div>
          ) : (
            <motion.div
              key="off-bg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 rounded-[100px]"
            >
              <div className="absolute bg-[rgba(0,0,0,0.1)] inset-0 mix-blend-luminosity rounded-[100px]" />
              <div className="absolute bg-[rgba(208,208,208,0.5)] inset-0 mix-blend-color-burn rounded-[100px]" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Knob */}
      <motion.div
        className="relative bg-white rounded-[100px] shrink-0"
        style={{
          width: KNOB,
          height: KNOB,
          boxShadow: "0px 1px 1px 0px rgba(0,0,0,0.22)",
        }}
        animate={{ x: active ? X_ON : X_OFF }}
        transition={{ type: "spring", stiffness: 500, damping: 35, mass: 0.8 }}
      />

      {/* Inner shadow overlay */}
      <div
        className="absolute inset-0 pointer-events-none rounded-[inherit]"
        style={{ boxShadow: active ? SHADOW_ON : SHADOW_OFF }}
      />
    </button>
  );
}