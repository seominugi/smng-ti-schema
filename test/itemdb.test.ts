import { describe, it, expect } from "vitest"
import { ItemDbEntrySchema } from "../src/itemdb"

describe("ItemDbEntrySchema", () => {
  it("유효 엔트리 통과 (KO/EN 이름 + isCurrency)", () => {
    const fe = { configBaseId: 100300, name: { ko: "최초의 불꽃 결정", en: "Flame Elementium" }, category: "currency", isCurrency: true }
    expect(ItemDbEntrySchema.parse(fe).isCurrency).toBe(true)
  })
  it("EN 이름 누락 거부 (이중언어 1급 강제)", () => {
    expect(() => ItemDbEntrySchema.parse({ configBaseId: 5011, name: { ko: "가" }, category: "material", isCurrency: false })).toThrow()
  })
})
