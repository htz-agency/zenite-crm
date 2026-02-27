/**
 * useTeams — Shared hook with module-level cache for CRM teams.
 *
 * Multiple components can call useTeams() without triggering
 * redundant API calls. The cache has a 5-minute TTL.
 *
 * Also re-exports getTeamIconComponent and TEAM_ICONS from team-icons.tsx
 * so consumers only need one import for team-related utilities.
 */

import { useState, useEffect } from "react";
import { listTeams, type CrmTeam } from "./crm-api";

// Re-export icon utilities for convenience
export { TEAM_ICONS, getTeamIconComponent, type TeamIconEntry } from "./team-icons";

/* ── Module-level cache ── */

let _teamsCache: CrmTeam[] | null = null;
let _teamsFetchPromise: Promise<CrmTeam[]> | null = null;
let _teamsFetchTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function useTeams(enabled: boolean = true): CrmTeam[] {
  const [teams, setTeams] = useState<CrmTeam[]>(_teamsCache ?? []);

  useEffect(() => {
    if (!enabled) return;

    const now = Date.now();
    if (_teamsCache && now - _teamsFetchTime < CACHE_TTL) {
      setTeams(_teamsCache);
      return;
    }

    if (!_teamsFetchPromise || now - _teamsFetchTime >= CACHE_TTL) {
      _teamsFetchPromise = listTeams()
        .then((t) => {
          const list = Array.isArray(t) ? t : [];
          _teamsCache = list;
          _teamsFetchTime = Date.now();
          return list;
        })
        .catch((err) => {
          console.error("[useTeams] Error loading teams:", err);
          return _teamsCache ?? [];
        });
    }

    _teamsFetchPromise.then((t) => setTeams(t));
  }, [enabled]);

  return teams;
}

/**
 * Resolve a team by ID.
 * Returns null if teams haven't loaded or ID not found.
 */
export function resolveTeam(
  teams: CrmTeam[],
  teamId: string,
): CrmTeam | null {
  if (!teamId || teams.length === 0) return null;
  return teams.find((t) => t.id === teamId) ?? null;
}

/**
 * Find which team(s) a user belongs to.
 */
export function getTeamsForMember(
  teams: CrmTeam[],
  memberId: string,
): CrmTeam[] {
  if (!memberId || teams.length === 0) return [];
  return teams.filter((t) => t.members.includes(memberId));
}

/** Invalidate cache (e.g. after creating/editing/deleting a team) */
export function invalidateTeamsCache(): void {
  _teamsCache = null;
  _teamsFetchPromise = null;
  _teamsFetchTime = 0;
}
