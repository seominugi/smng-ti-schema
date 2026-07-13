import { describe, it, expect } from "vitest"
import { mockItemsIndex, mockCurrencyRates } from "../src/mock"
import { ItemsIndexSchema, CurrencyRatesSchema } from "../src/envelope"

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
})
