import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { ItemsIndexSchema, CurrencyRatesSchema } from "../src/envelope"

const load = (name: string) =>
  JSON.parse(readFileSync(new URL("../fixtures/" + name, import.meta.url), "utf8"))

describe("fixtures", () => {
  it("items-index.sample.json 스키마 통과", () => {
    expect(() => ItemsIndexSchema.parse(load("items-index.sample.json"))).not.toThrow()
  })
  it("currency-rates.sample.json 스키마 통과", () => {
    expect(() => CurrencyRatesSchema.parse(load("currency-rates.sample.json"))).not.toThrow()
  })
})
