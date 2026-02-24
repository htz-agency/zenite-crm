import type { ReactNode, ButtonHTMLAttributes } from "react";

interface PillButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode;
  children: ReactNode;
}

/**
 * Pill-shaped action button following Figma spec:
 *   Normal  — bg #dcf0ff, no shadow
 *   Hover   — bg #bcdaf1, shadow 0 2 4 rgba(18,34,50,.3), backdrop-blur 50
 *   Active  — radial-gradient overlay on #dcf0ff, same shadow
 */
export function PillButton({ icon, children, className = "", ...rest }: PillButtonProps) {
  return (
    <button
      {...rest}
      className={`group/pill relative flex items-center gap-[3px] h-[40px] pl-[16px] pr-[20px] rounded-[100px] text-[#28415c] cursor-pointer
        bg-[#dcf0ff] transition-all duration-150
        hover:bg-[#bcdaf1] hover:shadow-[0px_2px_4px_0px_rgba(18,34,50,0.3)] hover:backdrop-blur-[50px]
        active:bg-[#dcf0ff] active:shadow-[0px_2px_4px_0px_rgba(18,34,50,0.3)] active:backdrop-blur-[50px]
        ${className}`}
    >
      {/* Active-state radial-gradient overlay (matches Figma click frame) */}
      <span
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 group-active/pill:opacity-100 transition-opacity duration-100"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 50% 100%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.215) 100%)",
        }}
      />
      {icon && <span className="relative flex items-center">{icon}</span>}
      <span
        className="relative font-semibold"
        style={{ fontSize: 15, letterSpacing: -0.5, lineHeight: "22px" }}
      >
        {children}
      </span>
    </button>
  );
}
