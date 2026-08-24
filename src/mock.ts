import type { ItemAggregate, CurrencyRate } from "./aggregate"
import type { ItemsIndex, CurrencyRates } from "./envelope"
import type { CurrencyRatesResponse, ItemResponse, ItemsResponse } from "./market-api"
import { FE_CURRENCY_ID, CONTRACT_SCHEMA_VERSION } from "./constants"

const NOW = 1752300000000
const MOCK_FRESHNESS = {
  state: "fresh",
  ageMs: 0,
  freshForMs: 900_000,
  expiresAfterMs: 86_400_000,
} as const
const MOCK_META = {
  schemaVersion: 1,
  generatedAt: NOW,
  gameVersion: "SS12",
  region: "kr",
} as const

function mockItem(i: number): ItemAggregate {
  const base = 1 + (i % 10) * 0.5
  return {
    schemaVersion: 1,
    configBaseId: 5000 + i,
    name: { ko: "목아이템 " + i, en: "Mock Item " + i },
    category: i % 3 === 0 ? "equipment" : "material",
    currency: FE_CURRENCY_ID,
    ref: { value: base, method: "p20_low", asOf: NOW },
    samples: { observationCount: 10 + i, listingDepth: 40 + i * 4, windowMs: 3600000 },
    confidence: i % 5 === 0 ? "low" : "high",
    history: { resolution: "5m", windowMs: 3600000, points: [
      { ts: NOW - 300000, value: base * 0.98, n: 4 },
      { ts: NOW, value: base, n: 6 },
    ] },
    change: { pct1h: 0.02, pct24h: null },
    volume: null, trend: null,
  }
}

export function mockItemsIndex(count = 20): ItemsIndex {
  return {
    schemaVersion: CONTRACT_SCHEMA_VERSION, generatedAt: NOW, currency: FE_CURRENCY_ID,
    items: Array.from({ length: count }, (_, i) => mockItem(i)),
  }
}

export function mockCurrencyRates(): CurrencyRates {
  const rate = (id: number, ko: string, en: string, value: number): CurrencyRate => ({
    schemaVersion: 1, configBaseId: id, name: { ko, en },
    ref: { value, method: "p20_low", asOf: NOW },
    samples: { observationCount: 25, listingDepth: 100, windowMs: 3600000 },
    confidence: "high",
    history: { resolution: "5m", windowMs: 3600000, points: [] },
  })
  return {
    schemaVersion: CONTRACT_SCHEMA_VERSION, generatedAt: NOW, base: FE_CURRENCY_ID,
    rates: [ rate(7_000_001, "합성 테스트 통화", "Synthetic Test Currency", 0.8) ],
  }
}

export function mockItemsResponse(count = 20): ItemsResponse {
  return {
    data: {
      items: mockItemsIndex(count).items.map((aggregate) => ({
        aggregate,
        freshness: MOCK_FRESHNESS,
      })),
    },
    meta: MOCK_META,
  }
}

export function mockItemResponse(): ItemResponse {
  return {
    data: { item: mockItemsResponse(1).data.items[0]! },
    meta: MOCK_META,
  }
}

export function mockCurrencyRatesResponse(): CurrencyRatesResponse {
  const rate = mockCurrencyRates().rates[0]!
  return {
    data: { rates: [{ rate, freshness: MOCK_FRESHNESS }] },
    meta: MOCK_META,
  }
}
