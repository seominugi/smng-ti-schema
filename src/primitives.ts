import { z } from "zod"

export const LocalizedNameSchema = z.object({ ko: z.string(), en: z.string() }).strict()
export const RefMethodSchema = z.enum(["p20_low", "min", "median"])
export const ConfidenceSchema = z.enum(["high", "medium", "low"])

export const RefPriceSchema = z.object({
  value: z.number(), method: RefMethodSchema, asOf: z.number().int(),
}).strict()

export const SamplesSchema = z.object({
  observationCount: z.number().int().nonnegative(),
  listingDepth: z.number().int().nonnegative(),
  windowMs: z.number().int().positive(),
}).strict()

export const HistoryPointSchema = z.object({
  ts: z.number().int(), value: z.number(), n: z.number().int().nonnegative(),
}).strict()

export const HistorySchema = z.object({
  resolution: z.string(), windowMs: z.number().int().positive(),
  points: z.array(HistoryPointSchema),
}).strict()

export const ChangeSchema = z.object({
  pct1h: z.number().nullable(), pct24h: z.number().nullable(),
}).strict()

export type LocalizedName = z.infer<typeof LocalizedNameSchema>
export type RefMethod = z.infer<typeof RefMethodSchema>
export type Confidence = z.infer<typeof ConfidenceSchema>
export type RefPrice = z.infer<typeof RefPriceSchema>
export type Samples = z.infer<typeof SamplesSchema>
export type HistoryPoint = z.infer<typeof HistoryPointSchema>
export type History = z.infer<typeof HistorySchema>
export type Change = z.infer<typeof ChangeSchema>
