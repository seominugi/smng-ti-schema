import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { ItemsIndexSchema, CurrencyRatesSchema } from "../src/envelope"
import {
  CurrencyRatesResponseSchema,
  ItemResponseSchema,
  ItemsResponseSchema,
} from "../src/market-api"

const load = (name: string) =>
  JSON.parse(readFileSync(new URL("../fixtures/" + name, import.meta.url), "utf8"))

describe("fixtures", () => {
  it("items-index.sample.json 스키마 통과", () => {
    expect(() => ItemsIndexSchema.parse(load("items-index.sample.json"))).not.toThrow()
  })
  it("currency-rates.sample.json 스키마 통과", () => {
    expect(() => CurrencyRatesSchema.parse(load("currency-rates.sample.json"))).not.toThrow()
  })
  it("시세 조회 응답 fixture 세 종이 schema를 통과한다", () => {
    expect(ItemsResponseSchema.parse(load("items-response.sample.json"))).toBeTruthy()
    expect(ItemResponseSchema.parse(load("item-response.sample.json"))).toBeTruthy()
    expect(
      CurrencyRatesResponseSchema.parse(load("currency-rates-response.sample.json")),
    ).toBeTruthy()
  })
})
