import { z } from "zod"
import { CurrencyRateSchema, ItemAggregateSchema } from "./aggregate"

const SafeTimestampSchema = z.number().int().positive().max(Number.MAX_SAFE_INTEGER)

export const FreshnessStateSchema = z.enum(["fresh", "stale"])

export const FreshnessSchema = z.strictObject({
  state: FreshnessStateSchema,
  ageMs: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  freshForMs: z.literal(900_000),
  expiresAfterMs: z.literal(86_400_000),
})

export const ItemPriceViewSchema = z.strictObject({
  aggregate: ItemAggregateSchema,
  freshness: FreshnessSchema,
})

export const CurrencyRateViewSchema = z.strictObject({
  rate: CurrencyRateSchema,
  freshness: FreshnessSchema,
})

export const MarketMetaSchema = z.strictObject({
  schemaVersion: z.literal(1),
  generatedAt: SafeTimestampSchema,
  gameVersion: z.string().min(1).max(64),
  region: z.string().min(1).max(32),
})

export const ItemsResponseSchema = z.strictObject({
  data: z.strictObject({ items: z.array(ItemPriceViewSchema) }),
  meta: MarketMetaSchema,
})

export const ItemResponseSchema = z.strictObject({
  data: z.strictObject({ item: ItemPriceViewSchema }),
  meta: MarketMetaSchema,
})

export const CurrencyRatesResponseSchema = z.strictObject({
  data: z.strictObject({ rates: z.array(CurrencyRateViewSchema) }),
  meta: MarketMetaSchema,
})

export type FreshnessState = z.infer<typeof FreshnessStateSchema>
export type Freshness = z.infer<typeof FreshnessSchema>
export type ItemPriceView = z.infer<typeof ItemPriceViewSchema>
export type CurrencyRateView = z.infer<typeof CurrencyRateViewSchema>
export type MarketMeta = z.infer<typeof MarketMetaSchema>
export type ItemsResponse = z.infer<typeof ItemsResponseSchema>
export type ItemResponse = z.infer<typeof ItemResponseSchema>
export type CurrencyRatesResponse = z.infer<typeof CurrencyRatesResponseSchema>
