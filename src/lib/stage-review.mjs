function nullableString(value) {
  return value == null ? '' : String(value)
}

function formatDate(value) {
  if (!value) return 'No date logged'
  const date = new Date(value)
  const normalized = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 12)
  return normalized.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function getStageVideoStatus(youtubeUrl) {
  return youtubeUrl
    ? { label: 'Video attached', tone: 'ready' }
    : { label: 'No video yet', tone: 'empty' }
}

export function getStageReviewDetails(stage, match, { index = 0, totalStages = 0 } = {}) {
  const stageNumber = Number(stage.stageNum) || index + 1
  const matchName = nullableString(match.matchName).trim()
  const club = nullableString(match.club).trim()
  const contextParts = [matchName, club].filter(Boolean)
  const stageNotes = nullableString(stage.notes).trim()
  const matchNotes = nullableString(match.notes).trim()
  const powerFactor = match.powerFactor ? `PF ${match.powerFactor}${match.pfType ? ` (${match.pfType})` : ''}` : 'No PF logged'
  const roundsUsed = Number(match.roundsUsed)

  return {
    eyebrow: totalStages > 0 ? `Stage ${stageNumber} of ${totalStages}` : `Stage ${stageNumber}`,
    title: nullableString(stage.stageName).trim() || `Stage ${stageNumber}`,
    matchContext: contextParts.length ? contextParts.join(' · ') : 'Match context not logged',
    dateLabel: formatDate(match.date),
    roundsLabel: Number.isFinite(roundsUsed) && roundsUsed > 0 ? `${roundsUsed.toLocaleString()} match rounds` : 'No round count',
    powerFactorLabel: powerFactor,
    notesTitle: stageNotes ? 'Stage notes' : 'Match notes',
    notes: stageNotes || matchNotes || 'No review notes yet. Add stage notes to capture what happened and what to change next time.',
    videoStatus: getStageVideoStatus(stage.youtubeUrl),
  }
}
