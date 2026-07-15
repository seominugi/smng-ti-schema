import { z } from "zod"
import { LocalizedNameSchema } from "./primitives"

// 아이템 DB 포맷 (설계 §7.4). ConfigBaseId → KO/EN 이름 + 메타.
// task #6(tlidb/tli-hub 이름 수집)의 타깃 포맷.
export const ItemDbEntrySchema = z.object({
  configBaseId: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  name: LocalizedNameSchema,         // ko·en 모두 필수 = 이중언어 1급 강제
  category: z.string().nullable(),   // 실카테고리 집합 확정 후 enum 승격 가능(현재 데이터 0)
  isCurrency: z.boolean(),           // 통화 판별(환율 산정 대상 — 계약 §5.1)
}).strict()

export const ItemTypeSchema = z.enum(["material", "equipment", "currency", "prism", "card"])

const ItemNameSchema = z.string().min(1).max(120)
const ConfigBaseIdKeySchema = z.string().regex(/^[1-9]\d*$/)
const LocalesSchema = z.intersection(
  z.tuple([z.literal("ko"), z.literal("en")]).rest(z.never()),
  z.array(z.enum(["ko", "en"])).length(2),
)

export const ItemRecordSchema = z.strictObject({
  ko: ItemNameSchema,
  en: ItemNameSchema,
  type: ItemTypeSchema,
  isCurrency: z.boolean(),
})

export const ItemNameTableSchema = z.strictObject({
  schemaVersion: z.literal(1),
  source: z.literal("tlidb.com"),
  attribution: z.string().min(1).max(500),
  gameSeason: z.string().min(1).max(32),
  generatedAt: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  locales: LocalesSchema,
  items: z.record(ConfigBaseIdKeySchema, ItemRecordSchema),
})

export type ItemDbEntry = z.infer<typeof ItemDbEntrySchema>
export type ItemType = z.infer<typeof ItemTypeSchema>
export type ItemRecord = z.infer<typeof ItemRecordSchema>
export type ItemNameTable = z.infer<typeof ItemNameTableSchema>
