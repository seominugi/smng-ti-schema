# smng-ti Market API Contract v0.2.0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기존 관측·itemdb 계약을 깨지 않고 fresh/stale 시세 조회 응답 세 종을 strict Zod·TypeScript·Draft 2020-12 JSON Schema로 제공하는 `smng-ti-schema v0.2.0`을 릴리스한다.

**Architecture:** 기존 `ItemAggregateSchema`와 `CurrencyRateSchema`를 값 객체로 재사용하고, `src/market-api.ts`에 freshness·view·market meta·API envelope만 추가한다. Zod가 단일 진실원이며 `toContractJsonSchemas()`와 emitter가 커밋 JSON Schema를 생성하고 fixture·package import 테스트가 동기화를 강제한다.

**Tech Stack:** TypeScript 5.5+, Zod 4, Vitest 4, Ajv 8 Draft 2020-12, tsdown 0.22, npm pack, GitHub Release.

## Global Constraints

- 기존 `ItemAggregateSchema`, `CurrencyRateSchema`, `ItemsIndexSchema`, `CurrencyRatesSchema` shape와 각 데이터의 `schemaVersion: 1`을 변경하지 않는다.
- package SemVer만 `0.2.0`으로 올리고 기존 v0.1.0 export와 JSON Schema subpath를 모두 보존한다.
- freshness는 `fresh <= 900_000ms`, `stale <= 86_400_000ms`만 응답에 허용하며 expired row는 서버가 응답 전에 제외한다.
- 성공 응답은 strict `{data,meta}`이고 client UUID·receipt·token·IP·raw payload 필드는 허용하지 않는다.
- 신규 runtime dependency는 추가하지 않는다.
- TDD 순서는 실패 테스트 확인 → 최소 구현 → 전체 회귀 → conventional 한글 커밋이다.
- 커밋 작성자는 `서민욱 <alsdnr0712@gmail.com>`이며 Co-Authored-By/Generated-with footer를 넣지 않는다.

---

### Task 1: Freshness와 조회 응답 Zod 계약

**Files:**
- Create: `src/market-api.ts`
- Create: `test/market-api.test.ts`
- Modify: `src/index.ts`

**Interfaces:**
- Consumes: `ItemAggregateSchema`, `CurrencyRateSchema`, `ItemAggregate`, `CurrencyRate` from `src/aggregate.ts`.
- Produces: `FreshnessSchema`, `ItemPriceViewSchema`, `CurrencyRateViewSchema`, `MarketMetaSchema`, `ItemsResponseSchema`, `ItemResponseSchema`, `CurrencyRatesResponseSchema`와 각각의 `z.infer` 타입.

- [ ] **Step 1: strict response와 freshness 경계를 고정하는 실패 테스트를 작성한다**

```ts
// test/market-api.test.ts
import { describe, expect, it } from "vitest"
import {
  CurrencyRatesResponseSchema,
  FreshnessSchema,
  ItemResponseSchema,
  ItemsResponseSchema,
} from "../src/market-api"

const NOW = 1_800_000_000_000
const aggregate = {
  schemaVersion: 1 as const,
  configBaseId: 5028,
  name: { ko: "이계의 메아리", en: "Netherrealm resonance" },
  category: "material",
  currency: 100300,
  ref: { value: 1.25, method: "p20_low" as const, asOf: NOW },
  samples: { observationCount: 12, listingDepth: 60, windowMs: 3_600_000 },
  confidence: "high" as const,
  history: { resolution: "5m", windowMs: 3_600_000, points: [] },
  change: { pct1h: null, pct24h: null },
  volume: null,
  trend: null,
}
const freshness = {
  state: "fresh" as const,
  ageMs: 0,
  freshForMs: 900_000 as const,
  expiresAfterMs: 86_400_000 as const,
}
const meta = { schemaVersion: 1 as const, generatedAt: NOW, gameVersion: "SS12", region: "kr" }

describe("market API response contracts", () => {
  it.each(["fresh", "stale"] as const)("%s freshness를 허용한다", (state) => {
    expect(FreshnessSchema.parse({ ...freshness, state }).state).toBe(state)
  })

  it("expired·음수 age·상수 변조를 거부한다", () => {
    expect(FreshnessSchema.safeParse({ ...freshness, state: "expired" }).success).toBe(false)
    expect(FreshnessSchema.safeParse({ ...freshness, ageMs: -1 }).success).toBe(false)
    expect(FreshnessSchema.safeParse({ ...freshness, freshForMs: 1 }).success).toBe(false)
  })

  it("items와 item envelope를 strict parse한다", () => {
    const view = { aggregate, freshness }
    expect(ItemsResponseSchema.parse({ data: { items: [view] }, meta }).data.items).toHaveLength(1)
    expect(ItemResponseSchema.parse({ data: { item: view }, meta }).data.item.aggregate.configBaseId).toBe(5028)
    expect(ItemsResponseSchema.safeParse({ data: { items: [view] }, meta, client: "uuid" }).success).toBe(false)
  })

  it("currency envelope에 raw/client/receipt를 허용하지 않는다", () => {
    const rate = {
      schemaVersion: 1 as const,
      configBaseId: 7000001,
      name: { ko: "합성 테스트 통화", en: "Synthetic Test Currency" },
      ref: aggregate.ref,
      samples: aggregate.samples,
      confidence: aggregate.confidence,
      history: aggregate.history,
    }
    const response = { data: { rates: [{ rate, freshness }] }, meta }
    expect(CurrencyRatesResponseSchema.parse(response)).toEqual(response)
    expect(CurrencyRatesResponseSchema.safeParse({ ...response, payload: {} }).success).toBe(false)
  })
})
```

- [ ] **Step 2: 새 테스트가 export 부재로 RED인지 확인한다**

Run: `npx vitest run test/market-api.test.ts`

Expected: FAIL with module/export errors for `src/market-api.ts`.

- [ ] **Step 3: strict Zod 계약과 타입을 구현하고 root export에 연결한다**

```ts
// src/market-api.ts
import { z } from "zod"
import { CurrencyRateSchema, ItemAggregateSchema } from "./aggregate"

const SafeTimestampSchema = z.number().int().positive().max(Number.MAX_SAFE_INTEGER)

export const FreshnessStateSchema = z.enum(["fresh", "stale"])
export const FreshnessSchema = z.strictObject({
  state: FreshnessStateSchema,
  ageMs: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  freshForMs: z.literal(900_000),
  expiresAfterMs: z.literal(86_400_000),
})

export const ItemPriceViewSchema = z.strictObject({
  aggregate: ItemAggregateSchema,
  freshness: FreshnessSchema,
})

export const CurrencyRateViewSchema = z.strictObject({
  rate: CurrencyRateSchema,
  freshness: FreshnessSchema,
})

export const MarketMetaSchema = z.strictObject({
  schemaVersion: z.literal(1),
  generatedAt: SafeTimestampSchema,
  gameVersion: z.string().min(1).max(64),
  region: z.string().min(1).max(32),
})

export const ItemsResponseSchema = z.strictObject({
  data: z.strictObject({ items: z.array(ItemPriceViewSchema) }),
  meta: MarketMetaSchema,
})

export const ItemResponseSchema = z.strictObject({
  data: z.strictObject({ item: ItemPriceViewSchema }),
  meta: MarketMetaSchema,
})

export const CurrencyRatesResponseSchema = z.strictObject({
  data: z.strictObject({ rates: z.array(CurrencyRateViewSchema) }),
  meta: MarketMetaSchema,
})

export type FreshnessState = z.infer<typeof FreshnessStateSchema>
export type Freshness = z.infer<typeof FreshnessSchema>
export type ItemPriceView = z.infer<typeof ItemPriceViewSchema>
export type CurrencyRateView = z.infer<typeof CurrencyRateViewSchema>
export type MarketMeta = z.infer<typeof MarketMetaSchema>
export type ItemsResponse = z.infer<typeof ItemsResponseSchema>
export type ItemResponse = z.infer<typeof ItemResponseSchema>
export type CurrencyRatesResponse = z.infer<typeof CurrencyRatesResponseSchema>
```

```ts
// src/index.ts 마지막 export 인접 위치
export * from "./market-api"
```

- [ ] **Step 4: 단위 테스트와 타입체크를 GREEN으로 만든다**

Run: `npx vitest run test/market-api.test.ts && npm run typecheck`

Expected: `test/market-api.test.ts` PASS and TypeScript exit 0.

- [ ] **Step 5: 계약 단위를 커밋한다**

```powershell
git add src/market-api.ts src/index.ts test/market-api.test.ts
git -c user.name="서민욱" -c user.email="alsdnr0712@gmail.com" commit -m "feat(schema): 시세 조회 응답 계약 추가"
```

---

### Task 2: JSON Schema·fixture·package subpath 동기화

**Files:**
- Modify: `src/json-schema.ts`
- Modify: `scripts/emit-json-schemas.mjs`
- Modify: `test/json-schema.test.ts`
- Modify: `test/package.test.ts`
- Modify: `test/fixtures.test.ts`
- Create: `fixtures/items-response.sample.json`
- Create: `fixtures/item-response.sample.json`
- Create: `fixtures/currency-rates-response.sample.json`
- Create after generation: `schemas/items-response.schema.json`
- Create after generation: `schemas/item-response.schema.json`
- Create after generation: `schemas/currency-rates-response.schema.json`
- Modify: `package.json`

**Interfaces:**
- Consumes: Task 1의 세 response Zod schema.
- Produces: `toContractJsonSchemas().itemsResponse|itemResponse|currencyRatesResponse`와 세 package JSON Schema subpath.

- [ ] **Step 1: 생성물·fixture·package export가 아직 없어서 실패하는 테스트를 추가한다**

```ts
// test/json-schema.test.ts의 동기화 테스트에 추가
expect(load("../schemas/items-response.schema.json")).toEqual(generated.itemsResponse)
expect(load("../schemas/item-response.schema.json")).toEqual(generated.itemResponse)
expect(load("../schemas/currency-rates-response.schema.json")).toEqual(generated.currencyRatesResponse)
```

```ts
// test/package.test.ts의 공개 파일 테스트에 추가
expect(packageJson.exports["./schemas/items-response.json"]).toBe("./schemas/items-response.schema.json")
expect(packageJson.exports["./schemas/item-response.json"]).toBe("./schemas/item-response.schema.json")
expect(packageJson.exports["./schemas/currency-rates-response.json"]).toBe("./schemas/currency-rates-response.schema.json")
```

```ts
// test/fixtures.test.ts의 fixture 검증에 추가
import {
  CurrencyRatesResponseSchema,
  ItemResponseSchema,
  ItemsResponseSchema,
} from "../src/market-api"

it("시세 조회 응답 fixture 세 종이 schema를 통과한다", () => {
  expect(ItemsResponseSchema.parse(load("items-response.sample.json"))).toBeTruthy()
  expect(ItemResponseSchema.parse(load("item-response.sample.json"))).toBeTruthy()
  expect(CurrencyRatesResponseSchema.parse(load("currency-rates-response.sample.json"))).toBeTruthy()
})
```

- [ ] **Step 2: 새 테스트가 누락 파일·subpath로 RED인지 확인한다**

Run: `npx vitest run test/json-schema.test.ts test/package.test.ts test/fixtures.test.ts`

Expected: FAIL because the three schemas, fixtures, and package exports do not exist.

- [ ] **Step 3: JSON Schema 변환기와 emitter 목록을 확장한다**

```ts
// src/json-schema.ts import
import {
  CurrencyRatesResponseSchema,
  ItemResponseSchema,
  ItemsResponseSchema,
} from "./market-api"

// toContractJsonSchemas() 반환 객체에 추가
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
```

```js
// scripts/emit-json-schemas.mjs의 파일 목록에 추가
["items-response.schema.json", schemas.itemsResponse],
["item-response.schema.json", schemas.itemResponse],
["currency-rates-response.schema.json", schemas.currencyRatesResponse],
```

```json
// package.json exports에 추가
"./schemas/items-response.json": "./schemas/items-response.schema.json",
"./schemas/item-response.json": "./schemas/item-response.schema.json",
"./schemas/currency-rates-response.json": "./schemas/currency-rates-response.schema.json"
```

- [ ] **Step 4: 실제 anchor와 synthetic currency를 분리한 fixture 세 종을 만든다**

`fixtures/items-response.sample.json`:

```json
{
  "data": {
    "items": [
      {
        "aggregate": {
          "schemaVersion": 1,
          "configBaseId": 5028,
          "name": { "ko": "이계의 메아리", "en": "Netherrealm resonance" },
          "category": "material",
          "currency": 100300,
          "ref": { "value": 1.25, "method": "p20_low", "asOf": 1800000000000 },
          "samples": { "observationCount": 12, "listingDepth": 60, "windowMs": 3600000 },
          "confidence": "high",
          "history": { "resolution": "5m", "windowMs": 3600000, "points": [] },
          "change": { "pct1h": null, "pct24h": null },
          "volume": null,
          "trend": null
        },
        "freshness": { "state": "fresh", "ageMs": 0, "freshForMs": 900000, "expiresAfterMs": 86400000 }
      }
    ]
  },
  "meta": { "schemaVersion": 1, "generatedAt": 1800000000000, "gameVersion": "SS12", "region": "kr" }
}
```

`fixtures/item-response.sample.json`:

```json
{
  "data": {
    "item": {
      "aggregate": {
        "schemaVersion": 1,
        "configBaseId": 5028,
        "name": { "ko": "이계의 메아리", "en": "Netherrealm resonance" },
        "category": "material",
        "currency": 100300,
        "ref": { "value": 1.25, "method": "p20_low", "asOf": 1800000000000 },
        "samples": { "observationCount": 12, "listingDepth": 60, "windowMs": 3600000 },
        "confidence": "high",
        "history": { "resolution": "5m", "windowMs": 3600000, "points": [] },
        "change": { "pct1h": null, "pct24h": null },
        "volume": null,
        "trend": null
      },
      "freshness": { "state": "fresh", "ageMs": 0, "freshForMs": 900000, "expiresAfterMs": 86400000 }
    }
  },
  "meta": { "schemaVersion": 1, "generatedAt": 1800000000000, "gameVersion": "SS12", "region": "kr" }
}
```

`fixtures/currency-rates-response.sample.json`:

```json
{
  "data": {
    "rates": [
      {
        "rate": {
          "schemaVersion": 1,
          "configBaseId": 7000001,
          "name": { "ko": "합성 테스트 통화", "en": "Synthetic Test Currency" },
          "ref": { "value": 2, "method": "p20_low", "asOf": 1799999099999 },
          "samples": { "observationCount": 12, "listingDepth": 60, "windowMs": 3600000 },
          "confidence": "high",
          "history": { "resolution": "5m", "windowMs": 3600000, "points": [] }
        },
        "freshness": { "state": "stale", "ageMs": 900001, "freshForMs": 900000, "expiresAfterMs": 86400000 }
      }
    ]
  },
  "meta": { "schemaVersion": 1, "generatedAt": 1800000000000, "gameVersion": "SS12", "region": "kr" }
}
```

- [ ] **Step 5: schema 파일을 생성하고 세 검증 파일을 GREEN으로 만든다**

Run: `npm run schemas && npx vitest run test/json-schema.test.ts test/package.test.ts test/fixtures.test.ts`

Expected: five committed JSON Schema files match Zod output and all selected tests PASS.

- [ ] **Step 6: 생성 계약 단위를 커밋한다**

```powershell
git add src/json-schema.ts scripts/emit-json-schemas.mjs schemas package.json fixtures test/json-schema.test.ts test/package.test.ts test/fixtures.test.ts
git -c user.name="서민욱" -c user.email="alsdnr0712@gmail.com" commit -m "feat(schema): 시세 API JSON 계약 방출"
```

---

### Task 3: v0.2.0 package·mock·문서·공개 release

**Files:**
- Modify: `src/mock.ts`
- Modify: `test/mock.test.ts`
- Modify: `fixtures/currency-rates.sample.json`
- Modify: `test/aggregate.test.ts`
- Modify: `package.json`
- Modify mechanically: `package-lock.json`
- Modify: `README.md`
- Modify at completion: `docs/handoff.md`

**Interfaces:**
- Consumes: Task 1·2의 response exports와 package subpaths.
- Produces: deterministic response mock, `smng-ti-schema-0.2.0.tgz`, public immutable release URL `https://github.com/seominugi/smng-ti-schema/releases/download/v0.2.0/smng-ti-schema-0.2.0.tgz`.

- [ ] **Step 1: mock·fixture가 실제 `100200`을 currency로 오인하지 않고 새 response를 생성해야 한다는 실패 테스트를 쓴다**

```ts
// test/mock.test.ts
import {
  mockCurrencyRatesResponse,
  mockItemResponse,
  mockItemsResponse,
} from "../src/mock"
import {
  CurrencyRatesResponseSchema,
  ItemResponseSchema,
  ItemsResponseSchema,
} from "../src/market-api"

it("response mock 세 종이 strict API schema를 통과한다", () => {
  expect(ItemsResponseSchema.parse(mockItemsResponse(3)).data.items).toHaveLength(3)
  expect(ItemResponseSchema.parse(mockItemResponse()).data.item.aggregate.configBaseId).toBe(5000)
  const rates = CurrencyRatesResponseSchema.parse(mockCurrencyRatesResponse()).data.rates
  expect(rates[0]?.rate.configBaseId).toBe(7000001)
  expect(JSON.stringify(rates)).not.toContain("100200")
})
```

- [ ] **Step 2: 새 mock export 부재로 RED인지 확인한다**

Run: `npx vitest run test/mock.test.ts`

Expected: FAIL for missing `mockItemsResponse`, `mockItemResponse`, and `mockCurrencyRatesResponse`.

- [ ] **Step 3: 기존 mock 값을 재사용해 response mock을 구현하고 잘못된 synthetic currency ID를 교정한다**

```ts
// src/mock.ts에 추가
import type { CurrencyRatesResponse, ItemResponse, ItemsResponse } from "./market-api"

const MOCK_FRESHNESS = {
  state: "fresh",
  ageMs: 0,
  freshForMs: 900_000,
  expiresAfterMs: 86_400_000,
} as const
const MOCK_META = { schemaVersion: 1, generatedAt: NOW, gameVersion: "SS12", region: "kr" } as const

export function mockItemsResponse(count = 20): ItemsResponse {
  return {
    data: { items: mockItemsIndex(count).items.map((aggregate) => ({ aggregate, freshness: MOCK_FRESHNESS })) },
    meta: MOCK_META,
  }
}

export function mockItemResponse(): ItemResponse {
  return { data: { item: mockItemsResponse(1).data.items[0]! }, meta: MOCK_META }
}

export function mockCurrencyRatesResponse(): CurrencyRatesResponse {
  const rate = mockCurrencyRates().rates[0]!
  return { data: { rates: [{ rate, freshness: MOCK_FRESHNESS }] }, meta: MOCK_META }
}
```

`mockCurrencyRates()`, `fixtures/currency-rates.sample.json`, `test/aggregate.test.ts`의 schema-only 가상 통화는 모두 `7000001`과 `합성 테스트 통화 / Synthetic Test Currency`로 바꾼다. 실제 `100200`은 Flame Sand이며 currency가 아니라는 도메인 경계를 유지한다.

- [ ] **Step 4: package version과 README 소비 예시를 0.2.0으로 올린다**

Run: `npm version 0.2.0 --no-git-tag-version`

README에 새 response import와 세 JSON Schema subpath, fresh/stale 의미, expired는 서버가 제외한다는 문장을 추가한다. 기존 v0.1.0 설치 URL 설명은 migration history로 남기지 않고 현재 권장 URL을 v0.2.0으로 갱신한다.

- [ ] **Step 5: 전체 package gate와 tarball 내용을 검증한다**

Run:

```powershell
npm ci
npm test
npm run typecheck
npm run schemas
npm run build
npm pack --dry-run
npm audit --omit=dev --audit-level=moderate
git diff --check
```

Expected: all tests PASS, typecheck/build/schema generation exit 0, audit reports 0 vulnerabilities, dry-run package includes ESM/CJS/DTS and five JSON Schema files.

- [ ] **Step 6: package 변경을 커밋한다**

```powershell
git add src/mock.ts test/mock.test.ts test/aggregate.test.ts fixtures/currency-rates.sample.json package.json package-lock.json README.md schemas
git -c user.name="서민욱" -c user.email="alsdnr0712@gmail.com" commit -m "release(schema): 시세 API 계약 0.2.0 준비"
```

- [ ] **Step 7: 공개 tag/release 직전 사용자 확인 후 asset을 생성·검증한다**

Task 3 code commit의 전체 gate가 green인 상태에서 공개 tag/release 확인을 받는다. 현재 feature commit에 annotated tag를 만들고 push한 뒤 tag 원본과 동일한 clean worktree에서 다음을 실행한다.

```powershell
git -c user.name="서민욱" -c user.email="alsdnr0712@gmail.com" tag -a v0.2.0 -m "smng-ti-schema v0.2.0"
git push origin v0.2.0
npm ci
npm pack
$asset = (Resolve-Path .\smng-ti-schema-0.2.0.tgz).Path
$sha256 = (Get-FileHash -Algorithm SHA256 $asset).Hash
gh release create v0.2.0 $asset --repo seominugi/smng-ti-schema --title "smng-ti-schema v0.2.0" --notes "Freshness와 private market read API response 계약 세 종을 추가합니다. 기존 v0.1.0 관측·itemdb 계약은 유지됩니다."
gh release view v0.2.0 --repo seominugi/smng-ti-schema --json tagName,url,assets
```

Expected: public release asset name is exactly `smng-ti-schema-0.2.0.tgz`; downloaded asset SHA-256 equals `$sha256`; clean consumer imports ESM, CJS, DTS, and all five JSON Schema subpaths without Git/SSH.

- [ ] **Step 8: handoff에 release 근거와 pricer 소비 정보를 기록하고 커밋한다**

`docs/handoff.md` 맨 앞에 v0.2.0 commit/tag/release URL, SHA-256, package size, 테스트 수, clean consumer 검증, 다음 소비 URL을 기록한다.

```powershell
git add docs/handoff.md
git -c user.name="서민욱" -c user.email="alsdnr0712@gmail.com" commit -m "docs(handoff): schema 0.2.0 릴리스 기록"
```

이 커밋까지 feature branch에 포함한 뒤 보호 브랜치 `main` push 직전 사용자 확인을 한 번 받고, fast-forward 가능한 이력만 main에 통합·push한다. push 후 `git ls-remote origin refs/heads/main refs/tags/v0.2.0`으로 main과 tag를 대조한다.
