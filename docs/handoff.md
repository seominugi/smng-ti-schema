---
timestamp: 2026-07-15T23:55:35+09:00
interface: Codex
branch: codex/schema-contract-v1 (로컬 구현 커밋 완료, 원격 없음)
---

## 현재 목표

0.1.0 관측치·itemdb 공유 계약을 로컬 기능 브랜치에 커밋하고 검증했다. 다음은 GitHub 저장소 가시성(공개 권장/비공개)을 확정해 최초 `main`과 `v0.1.0` 태그를 만든 뒤, overlay와 pricer의 sibling `file:` 의존성을 그 태그로 고정하는 것이다.

## 작업 규약 요점

- TypeScript strict + Zod 단일 진실원 + `z.infer` 타입 파생.
- TDD: 새 경계는 실패 테스트 확인 후 구현.
- 커밋은 conventional + 한글 제목, 작성자 `서민욱 <alsdnr0712@gmail.com>`, Co-Authored-By/Generated-with 금지.
- 비밀값·PII를 계약에 추가하지 않는다. 관측치는 익명 UUID v4와 strict object만 허용한다.

## 완료된 작업

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

- `seominugi/smng-ti-schema` 저장소를 공개 또는 비공개로 만들지 사용자 결정 필요. MIT 계약 코드이며 cross-repo 인증이 필요 없는 공개 저장소를 권장한다.
- 결정 후 최초 `main` push와 `v0.1.0` 태그 생성. 이는 외부 상태 변경이므로 현재 세션에서는 아직 수행하지 않았다.
- overlay Draft PR #1과 로컬 `smng-ti-pricer`의 `file:../smng-ti-schema`를 고정 Git 태그로 전환하고 각 소비자 검증.

## 현재 상태

- 저장소는 기존 로컬 `master`에서 `codex/schema-contract-v1` 브랜치로 격리했다.
- 원격은 설정되어 있지 않다.
- 계약·테스트·JSON Schema·toolchain 구현 커밋은 `13c9e36 feat(schema): 관측치와 아이템 DB 공유 계약 확정`이다.
- 최종 기준은 9파일/42테스트, typecheck/build/schema/pack/audit green이다.
