import { z } from "zod"
import { ItemAggregateSchema, CurrencyRateSchema } from "./aggregate"

export const ItemsIndexSchema = z.object({
  schemaVersion: z.literal(1),
  generatedAt: z.number().int(),
  currency: z.literal(100300),
  items: z.array(ItemAggregateSchema),
}).strict()

export const CurrencyRatesSchema = z.object({
  schemaVersion: z.literal(1),
  generatedAt: z.number().int(),
  base: z.literal(100300),
  rates: z.array(CurrencyRateSchema),
}).strict()

export type ItemsIndex = z.infer<typeof ItemsIndexSchema>
export type CurrencyRates = z.infer<typeof CurrencyRatesSchema>
