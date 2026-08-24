import { describe, expect, it } from "vitest"
import {
  CurrencyRatesResponseSchema,
  FreshnessSchema,
  ItemResponseSchema,
  ItemsResponseSchema,
} from "../src/market-api"

const NOW = 1_800_000_000_000
const aggregate = {
  schemaVersion: 1 as const,
  configBaseId: 5028,
  name: { ko: "이계의 메아리", en: "Netherrealm resonance" },
  category: "material",
  currency: 100300,
  ref: { value: 1.25, method: "p20_low" as const, asOf: NOW },
  samples: { observationCount: 12, listingDepth: 60, windowMs: 3_600_000 },
  confidence: "high" as const,
  history: { resolution: "5m", windowMs: 3_600_000, points: [] },
  change: { pct1h: null, pct24h: null },
  volume: null,
  trend: null,
}
const freshness = {
  state: "fresh" as const,
  ageMs: 0,
  freshForMs: 900_000 as const,
  expiresAfterMs: 86_400_000 as const,
}
const meta = {
  schemaVersion: 1 as const,
  generatedAt: NOW,
  gameVersion: "SS12",
  region: "kr",
}

describe("market API response contracts", () => {
  it.each(["fresh", "stale"] as const)("%s freshness를 허용한다", (state) => {
    expect(FreshnessSchema.parse({ ...freshness, state }).state).toBe(state)
  })

  it("expired·음수 age·상수 변조를 거부한다", () => {
    expect(FreshnessSchema.safeParse({ ...freshness, state: "expired" }).success).toBe(false)
    expect(FreshnessSchema.safeParse({ ...freshness, ageMs: -1 }).success).toBe(false)
    expect(FreshnessSchema.safeParse({ ...freshness, freshForMs: 1 }).success).toBe(false)
  })

  it("items와 item envelope를 strict parse한다", () => {
    const view = { aggregate, freshness }
    expect(ItemsResponseSchema.parse({ data: { items: [view] }, meta }).data.items).toHaveLength(1)
    expect(
      ItemResponseSchema.parse({ data: { item: view }, meta }).data.item.aggregate.configBaseId,
    ).toBe(5028)
    expect(
      ItemsResponseSchema.safeParse({ data: { items: [view] }, meta, client: "uuid" }).success,
    ).toBe(false)
  })

  it("currency envelope에 raw/client/receipt를 허용하지 않는다", () => {
    const rate = {
      schemaVersion: 1 as const,
      configBaseId: 7_000_001,
      name: { ko: "합성 테스트 통화", en: "Synthetic Test Currency" },
      ref: aggregate.ref,
      samples: aggregate.samples,
      confidence: aggregate.confidence,
      history: aggregate.history,
    }
    const response = { data: { rates: [{ rate, freshness }] }, meta }
    expect(CurrencyRatesResponseSchema.parse(response)).toEqual(response)
    expect(CurrencyRatesResponseSchema.safeParse({ ...response, payload: {} }).success).toBe(false)
  })
})
