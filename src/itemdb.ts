import { z } from "zod"
import { LocalizedNameSchema } from "./primitives"

// 아이템 DB 포맷 (설계 §7.4). ConfigBaseId → KO/EN 이름 + 메타.
// task #6(tlidb/tli-hub 이름 수집)의 타깃 포맷.
export const ItemDbEntrySchema = z.object({
  configBaseId: z.number().int(),
  name: LocalizedNameSchema,         // ko·en 모두 필수 = 이중언어 1급 강제
  category: z.string().nullable(),   // 실카테고리 집합 확정 후 enum 승격 가능(현재 데이터 0)
  isCurrency: z.boolean(),           // 통화 판별(환율 산정 대상 — 계약 §5.1)
}).strict()

export type ItemDbEntry = z.infer<typeof ItemDbEntrySchema>
