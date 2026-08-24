import Ajv2020 from "ajv/dist/2020"
import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { toContractJsonSchemas } from "../src/json-schema"

const load = (path: string) => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"))
const validObservation = load("../fixtures/price-observation.valid.json")
const invalidObservation = load("../fixtures/price-observation.invalid.json")

describe("JSON Schema contracts", () => {
  it("Draft 2020-12 관측치 스키마를 Ajv로 컴파일하고 valid/invalid를 구분한다", () => {
    const { priceObservation } = toContractJsonSchemas()
    expect(priceObservation.$id).toBe("urn:smng-ti-schema:v1:price-observation")
    const validate = new Ajv2020({ strict: true, validateFormats: false }).compile(priceObservation)
    expect(validate(validObservation)).toBe(true)
    expect(validate(invalidObservation)).toBe(false)
  })

  it("itemdb 스키마는 숫자 문자열 키만 허용한다", () => {
    const { itemNameTable } = toContractJsonSchemas()
    const validate = new Ajv2020({ strict: true, strictTuples: false }).compile(itemNameTable)
    const validTable = {
      schemaVersion: 1,
      source: "tlidb.com",
      attribution: "Torchlight: Infinite localization",
      gameSeason: "SS12",
      generatedAt: 1784054689133,
      locales: ["ko", "en"],
      items: { "100300": { ko: "최초의 불꽃 결정", en: "Flame Elementium", type: "material", isCurrency: true } },
    }
    expect(validate(validTable)).toBe(true)
    expect(validate({ ...validTable, items: { invalid: validTable.items["100300"] } })).toBe(false)
    expect(validate({ ...validTable, locales: ["ko"] })).toBe(false)
    expect(validate({ ...validTable, locales: ["ko", "en", "ko"] })).toBe(false)
  })

  it("커밋된 스키마 파일이 Zod 단일 진실원과 동기화되어 있다", () => {
    const generated = toContractJsonSchemas()
    expect(load("../schemas/price-observation.schema.json")).toEqual(generated.priceObservation)
    expect(load("../schemas/item-name-table.schema.json")).toEqual(generated.itemNameTable)
    expect(load("../schemas/items-response.schema.json")).toEqual(generated.itemsResponse)
    expect(load("../schemas/item-response.schema.json")).toEqual(generated.itemResponse)
    expect(load("../schemas/currency-rates-response.schema.json")).toEqual(
      generated.currencyRatesResponse,
    )
  })
})
