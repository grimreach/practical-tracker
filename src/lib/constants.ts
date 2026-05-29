export const DISCIPLINES = {
  USPSA:     'USPSA',
  SCSA:      'Steel Challenge',
  IPSC:      'IPSC',
  IDPA:      'IDPA',
  THREE_GUN: '3-Gun',
  PRS:       'PRS',
  NRL22:     'NRL22',
  RIMFIRE:   'Rimfire Challenge',
  OTHER:     'Other',
} as const

export const DIVISIONS: Record<string, string[]> = {
  USPSA:     ['PCC', 'Open', 'Carry Optics', 'Limited', 'Limited 10', 'Single Stack', 'Revolver'],
  SCSA:      ['PCC', 'Open', 'Carry Optics', 'Limited', 'Iron Sight Revolver', 'Rimfire Pistol', 'Rimfire Rifle'],
  IPSC:      ['PCC', 'Open', 'Standard', 'Production', 'Classic', 'Revolver'],
  IDPA:      ['PCC', 'SSP', 'ESP', 'CDP', 'CCP', 'REV', 'BUG', 'CO'],
  THREE_GUN: ['Open', 'Tactical', 'Limited', 'Heavy Metal'],
  PRS:       ['Open', 'Production', 'Factory'],
  NRL22:     ['Open', 'Factory'],
  RIMFIRE:   ['Open', 'Standard'],
  OTHER:     ['Open'],
}

export const MATCH_TIERS = {
  LOCAL:  'Local / Club Match',
  TIER1:  'Tier 1 — Sectional / Area',
  TIER2:  'Tier 2 — State Championship',
  TIER3:  'Tier 3 — Regional / National',
  MAJOR:  'Major — Nationals / World Shoot',
} as const

export const EXPENSE_CATEGORIES = {
  PARTS:       'Parts & Components',
  AMMO:        'Factory Ammo',
  RELOADING:   'Reloading Supplies',
  OPTICS:      'Optics',
  ACCESSORIES: 'Accessories',
  MATCH_FEES:  'Match Fees',
  TRAINING:    'Training',
  TRAVEL:      'Travel',
  OTHER:       'Other',
} as const

export const MINOR_PF_FLOOR = 125
export const MAJOR_PF_FLOOR = 165

export function calcPF(bulletWeight: number, velocity: number) {
  return Math.round((bulletWeight * velocity) / 1000)
}

export function pfStatus(pf: number): 'major' | 'minor' | 'sub' {
  if (pf >= MAJOR_PF_FLOOR) return 'major'
  if (pf >= MINOR_PF_FLOOR) return 'minor'
  return 'sub'
}

export function percentile(placement: number, total: number) {
  return Math.round((1 - placement / total) * 100)
}

export const fmt$ = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

export const fmtDate = (d: string | Date) =>
  new Date(typeof d === 'string' ? d + 'T12:00:00' : d)
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
