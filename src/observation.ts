import { z } from "zod"

// ①→② 업로드 관측치 (설계 §9). 서빙 집계와 달리 익명 client를 가진다(집계 시 제거).
export const LocaleSchema = z.enum(["ko", "en"])
export const ObservationSourceSchema = z.enum(["xchg_search"])

const PositiveSafeIntegerSchema = z.number().int().positive().max(Number.MAX_SAFE_INTEGER)
const BoundedLabelSchema = z.string().min(1).max(64)

export const ObservedItemSchema = z.strictObject({
  configBaseId: PositiveSafeIntegerSchema,
})

export const ObservedPriceSchema = z.strictObject({
  currency: PositiveSafeIntegerSchema,
  unitPrices: z.array(z.number().positive().finite()).min(1).max(1_000),
  ref: z.number().positive().finite(),
})

export const ObservationClientSchema = z.strictObject({
  id: z.uuid({ version: "v4" }),
  version: z.string().min(1).max(32).regex(/^[0-9A-Za-z][0-9A-Za-z.+-]*$/),
})

export const PriceObservationSchema = z.strictObject({
  schemaVersion: z.literal(1),
  observedAt: PositiveSafeIntegerSchema,
  gameVersion: BoundedLabelSchema,
  locale: LocaleSchema,
  region: z.string().min(1).max(32),
  source: ObservationSourceSchema,
  item: ObservedItemSchema,
  price: ObservedPriceSchema,
  client: ObservationClientSchema,
})

export type Locale = z.infer<typeof LocaleSchema>
export type ObservationSource = z.infer<typeof ObservationSourceSchema>
export type ObservedItem = z.infer<typeof ObservedItemSchema>
export type ObservedPrice = z.infer<typeof ObservedPriceSchema>
export type ObservationClient = z.infer<typeof ObservationClientSchema>
export type PriceObservation = z.infer<typeof PriceObservationSchema>
