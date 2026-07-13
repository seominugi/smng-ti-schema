import { describe, it, expect } from "vitest"
import { RefPriceSchema, SamplesSchema, HistorySchema } from "../src/primitives"

describe("primitives", () => {
  it("RefPriceSchema: 유효 통과, 미지의 method 거부", () => {
    expect(RefPriceSchema.parse({ value: 1.25, method: "p20_low", asOf: 1752300000000 }).value).toBe(1.25)
    expect(() => RefPriceSchema.parse({ value: 1.25, method: "avg", asOf: 1 })).toThrow()
  })
  it("SamplesSchema: 음수 카운트 거부", () => {
    expect(() => SamplesSchema.parse({ observationCount: -1, listingDepth: 0, windowMs: 3600000 })).toThrow()
  })
  it("HistorySchema: 빈 points 허용", () => {
    expect(HistorySchema.parse({ resolution: "5m", windowMs: 3600000, points: [] }).points).toEqual([])
  })
})
