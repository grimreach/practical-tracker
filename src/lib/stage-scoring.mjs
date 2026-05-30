function toNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function toOptionalInt(value) {
  const number = toNumber(value)
  return number == null ? undefined : Math.trunc(number)
}

function toOptionalNumber(value) {
  const number = toNumber(value)
  return number == null ? undefined : number
}

export function calculateHitFactor(points, time) {
  const pointValue = toNumber(points)
  const timeValue = toNumber(time)
  if (pointValue == null || timeValue == null || timeValue <= 0) return null
  return Math.round((pointValue / timeValue) * 1000) / 1000
}

export function normalizeStageScore(stage) {
  const points = toOptionalNumber(stage.points ?? stage.score)
  const time = toOptionalNumber(stage.time)
  const penalties = toOptionalInt(stage.penalties) ?? 0
  const stagePlacement = toOptionalInt(stage.stagePlacement ?? stage.placement)
  const stageTotalCompetitors = toOptionalInt(stage.stageTotalCompetitors ?? stage.totalCompetitors)
  const hitFactor = toOptionalNumber(stage.hitFactor) ?? calculateHitFactor(points, time)

  return {
    ...stage,
    score: points ?? 0,
    points,
    time,
    penalties,
    hitFactor: hitFactor ?? undefined,
    stagePlacement,
    stageTotalCompetitors,
    classifier: Boolean(stage.classifier),
  }
}

function formatNumber(value, digits = 0) {
  const number = toNumber(value)
  if (number == null) return '—'
  return digits > 0 ? number.toFixed(digits).replace(/\.0+$/, '') : String(number)
}

export function buildStageScoreSummary(stage) {
  const points = toNumber(stage.points ?? stage.score)
  const time = toNumber(stage.time)
  const hitFactor = toNumber(stage.hitFactor) ?? calculateHitFactor(points, time)
  const penalties = toNumber(stage.penalties) ?? 0
  const placement = toNumber(stage.stagePlacement ?? stage.placement)
  const totalCompetitors = toNumber(stage.stageTotalCompetitors ?? stage.totalCompetitors)
  const badges = []

  if (placement && totalCompetitors) badges.push(`${placement} / ${totalCompetitors} stage finish`)
  if (stage.classifier) badges.push('Classifier')
  if (badges.length === 0) badges.push('Score details pending')

  return {
    metrics: [
      { label: 'Points', value: points == null ? '—' : formatNumber(points) },
      { label: 'Time', value: time == null ? '—' : `${formatNumber(time, 2)}s` },
      { label: 'Hit factor', value: hitFactor == null ? '—' : formatNumber(hitFactor, 3) },
      { label: 'Penalties', value: formatNumber(penalties) },
    ],
    badges,
  }
}
