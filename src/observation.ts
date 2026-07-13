import { z } from "zod"

// ①→② 업로드 관측치 (설계 §9). 서빙 집계와 달리 익명 client를 가진다(집계 시 제거).
export const LocaleSchema = z.enum(["ko", "en"])
export const ObservationSourceSchema = z.enum(["xchg_search"])

export const ObservedItemSchema = z.object({ configBaseId: z.number().int() }).strict()

export const ObservedPriceSchema = z.object({
  currency: z.number().int(),
  unitPrices: z.array(z.number()),   // 오름차순 리스팅가 원본 배열(보존)
  ref: z.number(),
}).strict()

export const ObservationClientSchema = z.object({
  id: z.string(),        // 익명 uuid
  version: z.string(),
}).strict()

export const PriceObservationSchema = z.object({
  schemaVersion: z.literal(1),
  observedAt: z.number().int(),
  gameVersion: z.string(),
  locale: LocaleSchema,
  region: z.string(),
  source: ObservationSourceSchema,
  item: ObservedItemSchema,
  price: ObservedPriceSchema,
  client: ObservationClientSchema,
}).strict()

export type Locale = z.infer<typeof LocaleSchema>
export type ObservationSource = z.infer<typeof ObservationSourceSchema>
export type ObservedItem = z.infer<typeof ObservedItemSchema>
export type ObservedPrice = z.infer<typeof ObservedPriceSchema>
export type ObservationClient = z.infer<typeof ObservationClientSchema>
export type PriceObservation = z.infer<typeof PriceObservationSchema>
