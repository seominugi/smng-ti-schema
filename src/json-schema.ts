import { z } from "zod"
import { ItemNameTableSchema } from "./itemdb"
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
  }
}

export type ContractJsonSchemas = ReturnType<typeof toContractJsonSchemas>
