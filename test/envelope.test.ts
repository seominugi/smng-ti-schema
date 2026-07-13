import { describe, it, expect } from "vitest"
import { ItemsIndexSchema } from "../src/envelope"

describe("ItemsIndexSchema", () => {
  it("빈 인덱스 통과 (무관측 = 빈 배열)", () => {
    expect(ItemsIndexSchema.parse({ schemaVersion: 1, generatedAt: 1752300000000, currency: 100300, items: [] }).items).toEqual([])
  })
  it("currency가 100300 아니면 거부 (FE numéraire 강제)", () => {
    expect(() => ItemsIndexSchema.parse({ schemaVersion: 1, generatedAt: 1, currency: 100200, items: [] })).toThrow()
  })
})
