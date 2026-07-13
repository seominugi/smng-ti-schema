import { describe, it, expect } from "vitest"
import { PriceObservationSchema } from "../src/observation"

const validObs = {
  schemaVersion: 1, observedAt: 1752300000000, gameVersion: "S13", locale: "ko", region: "kr",
  source: "xchg_search", item: { configBaseId: 5011 },
  price: { currency: 100300, unitPrices: [1.0, 2.0, 2.5], ref: 1.0 },
  client: { id: "anon-uuid", version: "0.1.0" },
}

describe("PriceObservationSchema", () => {
  it("유효 관측치 통과", () => {
    expect(PriceObservationSchema.parse(validObs).price.unitPrices).toEqual([1, 2, 2.5])
  })
  it("잘못된 locale 거부", () => {
    expect(() => PriceObservationSchema.parse({ ...validObs, locale: "jp" })).toThrow()
  })
  it("관측치는 client.id를 가짐 (집계 서빙 시 제거되는 대상)", () => {
    expect(PriceObservationSchema.parse(validObs).client.id).toBe("anon-uuid")
  })
})
