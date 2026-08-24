import { describe, it, expect } from "vitest"
import {
  mockCurrencyRates,
  mockCurrencyRatesResponse,
  mockItemResponse,
  mockItemsIndex,
  mockItemsResponse,
} from "../src/mock"
import { ItemsIndexSchema, CurrencyRatesSchema } from "../src/envelope"
import {
  CurrencyRatesResponseSchema,
  ItemResponseSchema,
  ItemsResponseSchema,
} from "../src/market-api"

describe("mock generators", () => {
  it("mockItemsIndex(20) 스키마 통과", () => {
    const idx = mockItemsIndex(20)
    expect(idx.items).toHaveLength(20)
    expect(() => ItemsIndexSchema.parse(idx)).not.toThrow()
  })
  it("mockCurrencyRates() 스키마 통과", () => {
    expect(() => CurrencyRatesSchema.parse(mockCurrencyRates())).not.toThrow()
  })
  it("결정론적 — 같은 입력 같은 출력", () => {
    expect(mockItemsIndex(5)).toEqual(mockItemsIndex(5))
  })

  it("response mock 세 종이 strict API schema를 통과한다", () => {
    expect(ItemsResponseSchema.parse(mockItemsResponse(3)).data.items).toHaveLength(3)
    expect(ItemResponseSchema.parse(mockItemResponse()).data.item.aggregate.configBaseId).toBe(
      5000,
    )
    const rates = CurrencyRatesResponseSchema.parse(mockCurrencyRatesResponse()).data.rates
    expect(rates[0]?.rate.configBaseId).toBe(7_000_001)
    expect(JSON.stringify(rates)).not.toContain("100200")
  })
})
