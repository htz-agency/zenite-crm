/**
 * OwnerCell — Resolves an owner UUID (or legacy name string) into
 * a visual cell with avatar + name for use in table/list views.
 *
 * Uses the same module-level team-member cache as EditableField,
 * so no extra API calls are made.
 */

import { User as UserIcon } from "@phosphor-icons/react";
import { useTeamMembers, resolveMember } from "./use-team-members";
import { useAuth } from "../auth-context";

const fontFeature = { fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" };

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (name[0] || "?").toUpperCase();
}

interface OwnerCellProps {
  ownerId: string;
  /** Extra classes for the root wrapper */
  className?: string;
  /** Text colour class — default "text-[#0483AB]" (link blue) */
  textClass?: string;
  /** Font size — default 12 */
  fontSize?: number;
  /** Avatar size — default 18 */
  avatarSize?: number;
  /** Show only name text (no avatar) */
  textOnly?: boolean;
}

export function OwnerCell({
  ownerId,
  className = "",
  textClass = "text-[#0483AB]",
  fontSize = 12,
  avatarSize = 18,
  textOnly = false,
}: OwnerCellProps) {
  const members = useTeamMembers(true);
  const member = resolveMember(members, ownerId);
  const { user: authUser } = useAuth();
  const isMe = !!(authUser?.id && member?.id === authUser.id);
  const displayName = isMe ? "Eu" : (member?.name ?? ownerId);

  if (!ownerId) {
    return (
      <span
        className="text-[#c8cfdb]"
        style={{ fontSize, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}
      >
        —
      </span>
    );
  }

  if (textOnly) {
    return (
      <span
        className={`truncate ${textClass}`}
        style={{ fontSize, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}
      >
        {displayName}
      </span>
    );
  }

  return (
    <div className={`flex items-center gap-[8px] truncate ${className}`}>
      {/* Avatar */}
      {member?.avatarUrl ? (
        <img
          alt=""
          className="shrink-0 rounded-full object-cover"
          style={{ width: avatarSize, height: avatarSize }}
          src={member.avatarUrl}
        />
      ) : (
        <span
          className="flex items-center justify-center rounded-full bg-[#0483AB] text-white shrink-0"
          style={{
            width: avatarSize,
            height: avatarSize,
            fontSize: Math.round(avatarSize * 0.45),
            fontWeight: 700,
            ...fontFeature,
          }}
        >
          {initials(member?.name ?? displayName)}
        </span>
      )}

      {/* Name */}
      <span
        className={`truncate ${textClass}`}
        style={{ fontSize, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}
      >
        {displayName}
      </span>
    </div>
  );
}