import { describe, it, expect } from "vitest"
import { ItemAggregateSchema, CurrencyRateSchema } from "../src/aggregate"

const validItem = {
  schemaVersion: 1, configBaseId: 5011, name: { ko: "가", en: "A" }, category: "material",
  currency: 100300, ref: { value: 1.25, method: "p20_low", asOf: 1752300000000 },
  samples: { observationCount: 42, listingDepth: 180, windowMs: 3600000 }, confidence: "high",
  history: { resolution: "5m", windowMs: 3600000, points: [{ ts: 1752300000000, value: 1.25, n: 8 }] },
  change: { pct1h: 0.04, pct24h: null }, volume: null, trend: null,
}

describe("ItemAggregateSchema", () => {
  it("유효 레코드 통과", () => {
    expect(ItemAggregateSchema.parse(validItem)).toEqual(validItem)
  })
  it("client.id 실은 레코드 거부 (보안 불변식)", () => {
    expect(() => ItemAggregateSchema.parse({ ...validItem, client: { id: "anon-uuid" } })).toThrow()
  })
  it("currency 타입 오류 거부", () => {
    expect(() => ItemAggregateSchema.parse({ ...validItem, currency: "100300" })).toThrow()
  })
  it("volume/trend는 null 허용", () => {
    expect(ItemAggregateSchema.parse(validItem).volume).toBeNull()
  })
})

describe("CurrencyRateSchema", () => {
  it("유효 환율 통과", () => {
    const rate = {
      schemaVersion: 1, configBaseId: 7_000_001,
      name: { ko: "합성 테스트 통화", en: "Synthetic Test Currency" },
      ref: { value: 0.8, method: "p20_low", asOf: 1752300000000 },
      samples: { observationCount: 30, listingDepth: 120, windowMs: 3600000 }, confidence: "high",
      history: { resolution: "5m", windowMs: 3600000, points: [] },
    }
    expect(CurrencyRateSchema.parse(rate).ref.value).toBe(0.8)
  })
})
