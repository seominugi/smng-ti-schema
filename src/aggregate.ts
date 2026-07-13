import { z } from "zod"
import { LocalizedNameSchema, RefPriceSchema, SamplesSchema, ConfidenceSchema, HistorySchema, ChangeSchema } from "./primitives"

export const ItemAggregateSchema = z.object({
  schemaVersion: z.literal(1),
  configBaseId: z.number().int(),
  name: LocalizedNameSchema,
  category: z.string().nullable(),
  currency: z.number().int(),
  ref: RefPriceSchema,
  samples: SamplesSchema,
  confidence: ConfidenceSchema,
  history: HistorySchema,
  change: ChangeSchema,
  volume: z.number().nullable(),
  trend: z.string().nullable(),
}).strict()

export const CurrencyRateSchema = z.object({
  schemaVersion: z.literal(1),
  configBaseId: z.number().int(),
  name: LocalizedNameSchema,
  ref: RefPriceSchema,
  samples: SamplesSchema,
  confidence: ConfidenceSchema,
  history: HistorySchema,
}).strict()

export type ItemAggregate = z.infer<typeof ItemAggregateSchema>
export type CurrencyRate = z.infer<typeof CurrencyRateSchema>
