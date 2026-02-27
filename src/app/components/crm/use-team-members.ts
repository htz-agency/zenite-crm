/**
 * useTeamMembers — Shared hook with module-level cache for team members.
 *
 * Multiple components can call useTeamMembers(true) without triggering
 * redundant API calls. The cache has a 5-minute TTL.
 */

import { useState, useEffect } from "react";
import { listTeamMembers, type TeamMember } from "./crm-api";

/* ── Module-level cache ── */

let _membersCache: TeamMember[] | null = null;
let _membersFetchPromise: Promise<TeamMember[]> | null = null;
let _membersFetchTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function useTeamMembers(enabled: boolean = true): TeamMember[] {
  const [members, setMembers] = useState<TeamMember[]>(_membersCache ?? []);

  useEffect(() => {
    if (!enabled) return;

    const now = Date.now();
    if (_membersCache && now - _membersFetchTime < CACHE_TTL) {
      setMembers(_membersCache);
      return;
    }

    if (!_membersFetchPromise || now - _membersFetchTime >= CACHE_TTL) {
      _membersFetchPromise = listTeamMembers()
        .then((m) => {
          _membersCache = m;
          _membersFetchTime = Date.now();
          return m;
        })
        .catch((err) => {
          console.error("[useTeamMembers] Error loading team members:", err);
          return _membersCache ?? [];
        });
    }

    _membersFetchPromise.then((m) => setMembers(m));
  }, [enabled]);

  return members;
}

/**
 * Resolve a value to a team member by UUID.
 * Returns null if the value is empty, members haven't loaded, or UUID not found.
 */
export function resolveMember(
  members: TeamMember[],
  val: string,
): TeamMember | null {
  if (!val || members.length === 0) return null;
  return members.find((m) => m.id === val) ?? null;
}

/** Invalidate cache (e.g. after adding a new team member) */
export function invalidateTeamMembersCache(): void {
  _membersCache = null;
  _membersFetchPromise = null;
  _membersFetchTime = 0;
}
