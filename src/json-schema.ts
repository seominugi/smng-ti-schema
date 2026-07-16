import { z } from "zod"
import { ItemNameTableSchema } from "./itemdb"
import {
  CurrencyRatesResponseSchema,
  ItemResponseSchema,
  ItemsResponseSchema,
} from "./market-api"
import { PriceObservationSchema } from "./observation"

const SCHEMA_BASE_URI = "urn:smng-ti-schema:v1"

function withIdentity(schema: z.core.JSONSchema.JSONSchema, name: string, description: string) {
  return {
    ...schema,
    $id: `${SCHEMA_BASE_URI}:${name}`,
    title: name,
    description,
  }
}

export function toContractJsonSchemas() {
  return {
    priceObservation: withIdentity(
      z.toJSONSchema(PriceObservationSchema, { target: "draft-2020-12" }),
      "price-observation",
      "smng-ti-overlay에서 smng-ti-pricer로 보내는 익명 거래소 가격 관측치",
    ),
    itemNameTable: withIdentity(
      z.toJSONSchema(ItemNameTableSchema, { target: "draft-2020-12" }),
      "item-name-table",
      "ConfigBaseId를 KO/EN 표시 이름과 아이템 메타데이터로 매핑하는 정적 테이블",
    ),
    itemsResponse: withIdentity(
      z.toJSONSchema(ItemsResponseSchema, { target: "draft-2020-12" }),
      "items-response",
      "시장별 최신 아이템 FE 참조가 목록 응답",
    ),
    itemResponse: withIdentity(
      z.toJSONSchema(ItemResponseSchema, { target: "draft-2020-12" }),
      "item-response",
      "단일 아이템 FE 참조가 응답",
    ),
    currencyRatesResponse: withIdentity(
      z.toJSONSchema(CurrencyRatesResponseSchema, { target: "draft-2020-12" }),
      "currency-rates-response",
      "FE 기준 직접 통화 환율 목록 응답",
    ),
  }
}

export type ContractJsonSchemas = ReturnType<typeof toContractJsonSchemas>
