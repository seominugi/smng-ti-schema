import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { ItemDbEntrySchema, ItemNameTableSchema } from "../src/itemdb"

const table = {
  schemaVersion: 1,
  source: "tlidb.com",
  attribution: "Item names are Torchlight: Infinite official in-game localization.",
  gameSeason: "SS12",
  generatedAt: 1784054689133,
  locales: ["ko", "en"],
  items: {
    "5028": { ko: "이계의 메아리", en: "Netherrealm resonance", type: "material", isCurrency: false },
    "330001": { ko: "눈꽃 종이 조각", en: "Snowpaper Fragment", type: "material", isCurrency: false },
    "100200": { ko: "최초의 불꽃 가루", en: "Flame Sand", type: "material", isCurrency: false },
    "100300": { ko: "최초의 불꽃 결정", en: "Flame Elementium", type: "material", isCurrency: true },
  },
}

describe("ItemDbEntrySchema", () => {
  it("유효 엔트리 통과 (KO/EN 이름 + isCurrency)", () => {
    const fe = { configBaseId: 100300, name: { ko: "최초의 불꽃 결정", en: "Flame Elementium" }, category: "currency", isCurrency: true }
    expect(ItemDbEntrySchema.parse(fe).isCurrency).toBe(true)
  })
  it("EN 이름 누락 거부 (이중언어 1급 강제)", () => {
    expect(() => ItemDbEntrySchema.parse({ configBaseId: 5011, name: { ko: "가" }, category: "material", isCurrency: false })).toThrow()
  })
  it("현행 메타 헤더와 문자열 ID 맵을 검증한다", () => {
    const parsed = ItemNameTableSchema.parse(table)
    expect(parsed.items["100300"]).toEqual({
      ko: "최초의 불꽃 결정",
      en: "Flame Elementium",
      type: "material",
      isCurrency: true,
    })
  })
  it("네 실측 앵커가 포함된 골든 테이블을 검증한다", () => {
    const fixture = JSON.parse(readFileSync(new URL("../fixtures/item-name-table.sample.json", import.meta.url), "utf8"))
    const parsed = ItemNameTableSchema.parse(fixture)
    expect(Object.keys(parsed.items)).toHaveLength(5)
    expect(parsed.items["5028"]?.en).toBe("Netherrealm resonance")
    expect(parsed.items["71001"]).toEqual({
      ko: "근원의 추억",
      en: "Memory of Origin",
      type: "equipment",
      isCurrency: false,
    })
    expect(parsed.items["330001"]?.ko).toBe("눈꽃 종이 조각")
    expect(parsed.items["100200"]?.isCurrency).toBe(false)
    expect(parsed.items["100300"]).toEqual({
      ko: "최초의 불꽃 결정",
      en: "Flame Elementium",
      type: "material",
      isCurrency: true,
    })
  })
  it.each([
    ["숫자가 아닌 ID 키", { ...table, items: { invalid: table.items["100300"] } }],
    ["빈 KO 이름", { ...table, items: { "100300": { ...table.items["100300"], ko: "" } } }],
    ["120자를 넘는 이름", { ...table, items: { "100300": { ...table.items["100300"], en: "x".repeat(121) } } }],
    ["지원하지 않는 type", { ...table, items: { "100300": { ...table.items["100300"], type: "skill" } } }],
    ["잘못된 locales 순서", { ...table, locales: ["en", "ko"] }],
  ])("%s 거부", (_label, input) => {
    expect(ItemNameTableSchema.safeParse(input).success).toBe(false)
  })
})
