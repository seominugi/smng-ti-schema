# smng-ti-schema

`smng-ti-overlay`, `smng-ti-pricer`, 이후 `smng-ti-economy`가 공유하는 Torchlight: Infinite 데이터 계약 패키지다. TypeScript 타입을 따로 손으로 유지하지 않고 Zod 스키마에서 타입과 JSON Schema Draft 2020-12를 함께 만든다.

현재 0.2.0의 우선 계약은 다음 세 영역이다.

- `PriceObservationSchema`: 옵트인 거래소 검색 관측치(오버레이 → pricer)
- `ItemNameTableSchema`: ConfigBaseId → KO/EN 이름·타입 정적 테이블
- `ItemsResponseSchema`·`ItemResponseSchema`·`CurrencyRatesResponseSchema`: fresh/stale 상태를 포함하는 private 시세 조회 응답

`ItemAggregateSchema`·`CurrencyRateSchema`의 기존 shape와 데이터 `schemaVersion: 1`은 0.2.0에서도 유지한다.

## 사용

GitHub 릴리스 태그를 사용하는 소비자는 반드시 버전을 고정한다.

```powershell
npm install https://github.com/seominugi/smng-ti-schema/releases/download/v0.2.0/smng-ti-schema-0.2.0.tgz
```

`v0.2.0` 태그에서 `npm pack`으로 만든 GitHub Release tarball에는 ESM/CJS/DTS와 JSON Schema가 포함된다. 소비자는 이 불변 URL과 lockfile integrity를 함께 고정해 Git 도구나 SSH 키 없이 설치한다.

```ts
import {
  ItemNameTableSchema,
  ItemsResponseSchema,
  PriceObservationSchema,
  type ItemNameTable,
  type ItemsResponse,
  type PriceObservation,
} from "smng-ti-schema"

const observation: PriceObservation = PriceObservationSchema.parse(input)
const itemdb: ItemNameTable = ItemNameTableSchema.parse(table)
const prices: ItemsResponse = ItemsResponseSchema.parse(response)
```

비 TypeScript 소비자는 패키지에 포함된 JSON Schema를 사용한다.

```ts
import observationSchema from "smng-ti-schema/schemas/price-observation.json" with { type: "json" }
```

- `smng-ti-schema/schemas/price-observation.json`
- `smng-ti-schema/schemas/item-name-table.json`
- `smng-ti-schema/schemas/items-response.json`
- `smng-ti-schema/schemas/item-response.json`
- `smng-ti-schema/schemas/currency-rates-response.json`

## 관측치 계약

```json
{
  "schemaVersion": 1,
  "observedAt": 1752300000000,
  "gameVersion": "SS12",
  "locale": "ko",
  "region": "kr",
  "source": "xchg_search",
  "item": { "configBaseId": 5028 },
  "price": {
    "currency": 100300,
    "unitPrices": [1, 2, 2.5],
    "ref": 1
  },
  "client": {
    "id": "2f1cde8d-d6a8-4d5e-9d13-6b3bf85518dd",
    "version": "0.1.0"
  }
}
```

- `client.id`는 계정과 무관한 무작위 UUID v4다.
- UUID는 익명 관측치의 중복·rate-limit 보조키일 뿐 인증이나 신뢰의 근거가 아니다. pricer는 이를 위조 가능한 외부 입력으로 취급해야 한다.
- 계정명, 캐릭터명, 로그 경로, 획득 목록, 측정 세션 등 개인정보·행동 이력은 계약에 없으며 strict object 검증으로 추가 필드를 거부한다.
- `unitPrices`는 로그의 원본 순서를 보존한다. 배열은 1~1,000개의 양수 유한값이어야 하지만, 정렬과 `ref` 산식은 생산자 책임이라 수신 스키마가 재계산하지 않는다.
- 기여는 오버레이에서 기본 OFF이며 사용자가 명시적으로 켠 경우에만 전송한다. 이 패키지는 전송 기능을 포함하지 않는다.
- Zod 검증은 요청 body가 JSON으로 파싱된 뒤 실행된다. pricer v0는 파싱 전 요청 바이트 상한과 IP/UUID 기반 rate limit을 별도로 둬야 한다.

## itemdb 계약

현행 형식은 메타 헤더와 문자열 ConfigBaseId 키를 가진 단일 테이블이다.

```json
{
  "schemaVersion": 1,
  "source": "tlidb.com",
  "attribution": "...",
  "gameSeason": "SS12",
  "generatedAt": 1784054689133,
  "locales": ["ko", "en"],
  "items": {
    "100300": {
      "ko": "최초의 불꽃 결정",
      "en": "Flame Elementium",
      "type": "material",
      "isCurrency": true
    }
  }
}
```

`type`은 수집 카테고리인 `material | equipment | currency | prism | card` 중 하나다. `isCurrency`는 FE 환산 대상 큐레이션이라 `type`과 독립적이며, 실제 `100300`처럼 `type: "material"`, `isCurrency: true`일 수 있다. KO/EN/type 중 하나라도 비어 있는 부분 데이터는 허용하지 않으며 이름은 로케일별 120자 이하로 제한한다.

`data/items.json`은 초기 소스 커버리지 조사에 사용한 보조 카탈로그다. npm 패키지에 포함되지 않고 `ItemNameTableSchema`의 정본 데이터가 아니다. 현재 배포 테이블은 `smng-ti-overlay/src/itemdb/data/id_name_table.json`이며 아래 명령으로 전체 호환성을 확인한다.

```powershell
npm run validate:itemdb -- D:\github\smng-ti-overlay\src\itemdb\data\id_name_table.json
```

## 시세 조회 응답 계약

조회 응답은 strict `{data,meta}` 구조다. `ItemPriceView`는 기존 `ItemAggregate`와 freshness를, `CurrencyRateView`는 기존 `CurrencyRate`와 freshness를 묶는다. `MarketMeta`에는 `schemaVersion`, `generatedAt`, `gameVersion`, `region`만 들어간다.

- `fresh`: 참조 시각으로부터 900,000ms(15분) 이하
- `stale`: 900,000ms 초과 86,400,000ms(24시간) 이하
- `expired`: 응답 enum이 아니다. 서버가 24시간 초과 row를 응답 전에 제외한다.

client UUID, receipt, token, IP, raw payload는 조회 응답 계약에 없으며 strict object 검증으로 거부한다. 통화 fixture의 `7000001`은 환산 경계를 검증하는 synthetic ID이고 실제 게임 통화로 주장하지 않는다. 실제 `100200`은 `최초의 불꽃 가루 / Flame Sand`이며 통화가 아니다.

## 개발·검증

```powershell
npm install
npm test
npm run typecheck
npm run schemas
npm run validate:observation -- fixtures\price-observation.valid.json
npm pack --dry-run
```

`npm run schemas`는 빌드된 Zod 정의에서 `schemas/*.schema.json`을 안정적으로 재생성한다. 테스트는 커밋된 JSON Schema가 Zod 단일 진실원과 달라지면 실패한다.

## 버전 정책

- npm 패키지는 SemVer를 따른다.
- 각 JSON 데이터의 `schemaVersion`은 패키지 버전과 독립적으로 진화한다.
- 기존 v1 데이터가 더 이상 통과하지 않는 필드 제거·타입 변경·새 필수 필드는 `schemaVersion`을 올린다.
- 새 독립 스키마 export나 선택적 기능 추가는 패키지 minor, 검증기 버그 수정은 patch로 낸다. 0.x 동안에도 소비자 변경은 handoff와 릴리즈 노트에 명시한다.

## 출처와 라이선스

패키지 코드와 JSON Schema는 MIT 라이선스다. 아이템 이름은 Torchlight: Infinite 게임 로컬라이제이션이며, 카탈로그 출처와 귀속은 각 itemdb 메타 헤더에 별도로 보존한다. 이 저장소는 게임 자산의 권리를 재라이선스하지 않는다.
