import { z } from 'zod'

const youtubeUrlSchema = z.url().refine((value) => {
  const url = new URL(value)
  const host = url.hostname.replace(/^www\./, '')
  const isWebUrl = url.protocol === 'https:' || url.protocol === 'http:'
  return isWebUrl && (host === 'youtube.com' || host === 'youtu.be' || host.endsWith('.youtube.com'))
}, 'Must be a YouTube URL')

export const stageSchema = z.object({
  stageNum: z.number().int().min(1),
  stageName: z.string().optional(),
  score: z.number().default(0),
  time: z.number().optional(),
  hits: z.number().int().optional(),
  misses: z.number().int().default(0),
  penalties: z.number().int().default(0),
  dnf: z.boolean().default(false),
  youtubeUrl: youtubeUrlSchema.optional(),
  notes: z.string().optional(),
})

export const matchSchema = z.object({
  date: z.string(),
  club: z.string().min(1),
  matchName: z.string().optional(),
  discipline: z.enum(['USPSA', 'SCSA', 'IPSC', 'IDPA', 'THREE_GUN', 'PRS', 'NRL22', 'RIMFIRE', 'OTHER']),
  division: z.string().optional(),
  tier: z.enum(['LOCAL', 'TIER1', 'TIER2', 'TIER3', 'MAJOR']).default('LOCAL'),
  placement: z.number().int().positive().optional(),
  totalCompetitors: z.number().int().positive().optional(),
  roundsUsed: z.number().int().min(0).default(0),
  ammoCostPerRound: z.number().min(0).default(0),
  powerFactor: z.number().int().optional(),
  pfType: z.string().optional(),
  gunId: z.string().optional(),
  dq: z.boolean().default(false),
  dqReason: z.string().optional(),
  notes: z.string().optional(),
  stages: z.array(stageSchema).default([]),
})

export function calcPercentile(placement?: number, totalCompetitors?: number) {
  return placement && totalCompetitors
    ? Math.round((1 - placement / totalCompetitors) * 100)
    : null
}
