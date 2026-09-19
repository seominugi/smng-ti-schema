---
timestamp: 2026-09-20T03:40:00+09:00
interface: Codex
branch: codex/source-available-license (origin/main에서 분기)
---

> **생태계 지도**: TLI 트래커 생태계(4 repo) 역할·데이터 흐름·운영 절차 정본 — sibling repo `smng-ti-overlay`(private)의 `docs/생태계-지도.md`

## 현재 목표

**[완료] 공개 계약을 source-available로 전환했다.** 투명성 검토를 위한 열람·분석·일시적 로컬 실행은 허용하되, 제3자의 재사용·변형·재배포·서비스화는 사전 서면 허락 대상으로 둔다. `v0.2.0` 이하 태그의 기존 MIT 권리는 보존하고, 전환 이후 npm 공개 게시는 `private: true`로 차단한다.

**[완료] 0.1.0 관측치·itemdb 공유 계약을 공개 저장소와 GitHub Release로 배포했다.** overlay와 pricer는 Git/SSH가 아닌 불변 release tarball URL과 lockfile integrity로 이 계약을 소비한다. 다음 독립 작업은 실제 관측 수집 운영 정책과 집계·조회 계약 v1이다.

## 작업 규약 요점

- TypeScript strict + Zod 단일 진실원 + `z.infer` 타입 파생.
- TDD: 새 경계는 실패 테스트 확인 후 구현.
- 커밋은 conventional + 한글 제목, 작성자 `서민욱 <alsdnr0712@gmail.com>`, Co-Authored-By/Generated-with 금지.
- 비밀값·PII를 계약에 추가하지 않는다. 관측치는 익명 UUID v4와 strict object만 허용한다.

## 완료된 작업

### 소스 투명성 라이선스 전환 (2026-09-20)

- 한·영 병기 `Seominugi Transparency Source License 1.0`, README 상단 경고, `THIRD_PARTY_NOTICES.md`를 추가했다.
- 패키지 메타데이터를 `private: true`, `SEE LICENSE IN LICENSE`로 바꾸고 저장소 URL을 현재 이름 `ti-schema`로 바로잡았다.
- Git 태그 `v0.2.0` 이하에 이미 부여된 MIT 권리는 소급 취소하지 않으며, 전환 커밋 이후 스냅샷부터 새 조건을 적용한다.
- 기준선 검증: 테스트 10파일·51개, typecheck, build 통과. npm 감사의 기존 취약점 5건(중간 3·높음 2)은 이번 범위에서 자동 수정하지 않았다.
- 독립 계약 검토에서 종전 권리와 종료 조항 충돌, 패키지 계약 테스트, TITrack/tlidb 및 번들 고지 누락을 발견해 모두 수정했다. 최종 원격 통합 상태는 GitHub PR 이력을 기준으로 확인한다.

### 공개 v0.1.0 릴리스와 소비자 고정 (2026-07-16)

- 공개 저장소 [seominugi/smng-ti-schema](https://github.com/seominugi/smng-ti-schema)를 만들고 검증된 `3da1e88`을 최초 `main`과 annotated `v0.1.0` 태그로 push했다.
- 태그 원본에서 `npm pack`한 12.4 kB/59.2 kB tarball을 [GitHub Release v0.1.0](https://github.com/seominugi/smng-ti-schema/releases/tag/v0.1.0)에 첨부했다. SHA-256은 `66F0FAB983B9071542F84D7A1F962B0B96BFA81EC45B6D075AD74DBD6096CF12`다.
- 깨끗한 임시 소비자에서 공개 태그 설치와 ESM/CJS/JSON Schema import를 확인했다. npm의 GitHub 축약 URL이 lockfile을 `git+ssh`로 바꾸는 동작을 발견해, overlay/pricer는 인증 없는 release asset URL과 SHA-512 integrity를 고정했다.
- 공개 저장소 메타데이터 회귀 테스트를 추가했다. 최종 schema 검증은 `npm test` **9파일/43테스트**, typecheck, build/schema 생성, 전체 1,690행 itemdb, observation fixture, pack, audit 0건이다.

### 관측치·itemdb 계약 v1 보강 (2026-07-15)

- 관측치 ID·timestamp·문자열·가격 배열(1~1,000 양수 유한값)·UUID v4 경계를 강화하고 미지정 PII 필드를 strict object로 거부한다.
- 현행 메타 헤더 + 문자열 ID 맵 `ItemNameTableSchema`를 추가했다. `type`은 수집 카테고리, `isCurrency`는 FE 환산 큐레이션으로 독립임을 테스트·README에 고정했다.
- Zod 4 공식 변환으로 Draft 2020-12 JSON Schema 두 종을 생성하고 Ajv valid/invalid 골든 픽스처 및 커밋 산출물 동기화 테스트를 추가했다.
- 실제 `smng-ti-overlay` SS12 itemdb **1,690행** 전체가 새 계약을 통과했다. `5028`, `71001`, `100200`, `100300`, `330001` 다섯 표본의 KO/EN/type/isCurrency가 실제 테이블과 일치한다.
- 유지보수 종료 tsup을 공식 후속 tsdown으로 교체하고 Vitest 4로 갱신했다. ESM/CJS/DTS 및 JSON Schema subpath self-import를 확인했다.
- Git 태그 의존성 설치 시 `dist`와 JSON Schema를 생성하는 `prepare` 계약을 추가했다. `package-lock.json`에 섞였던 `../smng-ti-overlay` extraneous 경로도 제거하고 회귀 테스트로 고정했다.
- 검증: `npm test` **9파일/42테스트**, `npm run typecheck`, `npm run schemas`, itemdb/observation CLI, `npm pack --dry-run`(12.2 kB tarball/58.7 kB unpacked), `npm audit` 0건 통과.
- 멀티 페르소나: Designer 승인, Domain Fidelity 승인, QA/Security PASS, Red Team PASS. Release/Ops는 배포가 없어 미발동.

## 미완료 작업

- 후속 독립 작업: 실제 관측이 쌓인 뒤 집계 시세·환율·조회 응답 계약을 schemaVersion과 SemVer 정책에 맞춰 v1로 설계한다.
- 새 계약 릴리스는 태그 원본에서 npm tarball을 만들고 release asset SHA-256, 소비자 lockfile integrity, ESM/CJS/JSON Schema import를 동일하게 검증한다.

## 현재 상태

- **라이선스 전환 (2026-09-20)**: 라이선스·README·패키지 메타데이터·제3자 고지를 일치시켰다. 계약 스키마 자체는 변경하지 않았고, 패키지 메타데이터 회귀 테스트만 새 정책에 맞춰 갱신했다.

- 로컬 `codex/schema-contract-v1`은 공개 `origin/main`을 추적한다. 릴리스 계약 HEAD와 `v0.1.0` 대상은 `3da1e88`이다.
- README는 소비자 설치 경로를 Git/SSH URL이 아닌 release tarball URL로 안내하도록 교정했다.
- 최종 기준은 9파일/43테스트, typecheck/build/schema/pack/audit green이며 공개 release asset 설치·ESM/CJS/JSON import도 통과했다.
