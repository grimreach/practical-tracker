/**
 * @param {{ matchName?: string | null, club?: string | null } | null | undefined} match
 */
export function matchRelationshipName(match) {
  if (!match) return null
  return match.matchName || match.club || 'Untitled match'
}

/**
 * @param {{ name?: string | null } | null | undefined} gun
 */
export function gunRelationshipName(gun) {
  if (!gun) return null
  return gun.name || null
}

/**
 * @param {{ gun?: { name?: string | null } | null, match?: { matchName?: string | null, club?: string | null } | null }} relationships
 * @returns {Array<{ label: string, value: string }>}
 */
export function dashboardRelationshipLabels({ gun = null, match = null } = {}) {
  const labels = []
  const gunName = gunRelationshipName(gun)
  const matchName = matchRelationshipName(match)

  if (gunName) labels.push({ label: 'Firearm', value: gunName })
  if (matchName) labels.push({ label: 'Match', value: matchName })

  return labels
}
