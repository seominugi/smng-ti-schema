import { describe, it, expect } from "vitest"
import { PriceObservationSchema } from "../src/observation"

const validObs = {
  schemaVersion: 1, observedAt: 1752300000000, gameVersion: "S13", locale: "ko", region: "kr",
  source: "xchg_search", item: { configBaseId: 5011 },
  price: { currency: 100300, unitPrices: [1.0, 2.0, 2.5], ref: 1.0 },
  client: { id: "2f1cde8d-d6a8-4d5e-9d13-6b3bf85518dd", version: "0.1.0" },
}

describe("PriceObservationSchema", () => {
  it("유효 관측치 통과", () => {
    expect(PriceObservationSchema.parse(validObs).price.unitPrices).toEqual([1, 2, 2.5])
  })
  it("잘못된 locale 거부", () => {
    expect(() => PriceObservationSchema.parse({ ...validObs, locale: "jp" })).toThrow()
  })
  it("관측치는 client.id를 가짐 (집계 서빙 시 제거되는 대상)", () => {
    expect(PriceObservationSchema.parse(validObs).client.id).toBe("2f1cde8d-d6a8-4d5e-9d13-6b3bf85518dd")
  })
  it.each([
    ["0인 아이템 ID", { ...validObs, item: { configBaseId: 0 } }],
    ["unsafe 통화 ID", { ...validObs, price: { ...validObs.price, currency: Number.MAX_SAFE_INTEGER + 1 } }],
    ["빈 리스팅 배열", { ...validObs, price: { ...validObs.price, unitPrices: [] } }],
    ["음수 리스팅가", { ...validObs, price: { ...validObs.price, unitPrices: [1, -2] } }],
    ["1,000개 초과 리스팅", { ...validObs, price: { ...validObs.price, unitPrices: Array(1_001).fill(1) } }],
    ["UUID가 아닌 client ID", { ...validObs, client: { ...validObs.client, id: "anon-uuid" } }],
    ["빈 gameVersion", { ...validObs, gameVersion: "" }],
    ["PII 의심 미지정 필드", { ...validObs, accountName: "secret" }],
  ])("%s 거부", (_label, input) => {
    expect(PriceObservationSchema.safeParse(input).success).toBe(false)
  })
})
