---
timestamp: 2026-07-16T00:18:55+09:00
interface: Codex
branch: codex/schema-contract-v1 (origin/main 추적, 공개 v0.1.0 릴리스)
---

## 현재 목표

**[완료] 0.1.0 관측치·itemdb 공유 계약을 공개 저장소와 GitHub Release로 배포했다.** overlay와 pricer는 Git/SSH가 아닌 불변 release tarball URL과 lockfile integrity로 이 계약을 소비한다. 다음 독립 작업은 실제 관측 수집 운영 정책과 집계·조회 계약 v1이다.

## 작업 규약 요점

- TypeScript strict + Zod 단일 진실원 + `z.infer` 타입 파생.
- TDD: 새 경계는 실패 테스트 확인 후 구현.
- 커밋은 conventional + 한글 제목, 작성자 `서민욱 <alsdnr0712@gmail.com>`, Co-Authored-By/Generated-with 금지.
- 비밀값·PII를 계약에 추가하지 않는다. 관측치는 익명 UUID v4와 strict object만 허용한다.

## 완료된 작업

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

- 로컬 `codex/schema-contract-v1`은 공개 `origin/main`을 추적한다. 릴리스 계약 HEAD와 `v0.1.0` 대상은 `3da1e88`이다.
- README는 소비자 설치 경로를 Git/SSH URL이 아닌 release tarball URL로 안내하도록 교정했다.
- 최종 기준은 9파일/43테스트, typecheck/build/schema/pack/audit green이며 공개 release asset 설치·ESM/CJS/JSON import도 통과했다.
