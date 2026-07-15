import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"))
const packageLock = JSON.parse(readFileSync(new URL("../package-lock.json", import.meta.url), "utf8"))

describe("package contract", () => {
  it("코드와 두 JSON Schema를 공개 패키지에 포함한다", () => {
    expect(packageJson.files).toEqual(expect.arrayContaining(["dist", "schemas"]))
    expect(packageJson.exports["."].types).toBe("./dist/index.d.mts")
    expect(packageJson.exports["."].import).toBe("./dist/index.mjs")
    expect(packageJson.exports["."].require).toBe("./dist/index.cjs")
    expect(packageJson.exports["./schemas/price-observation.json"]).toBe("./schemas/price-observation.schema.json")
    expect(packageJson.exports["./schemas/item-name-table.json"]).toBe("./schemas/item-name-table.schema.json")
  })

  it("Git 태그 의존성 설치 시 패키지 산출물을 생성한다", () => {
    expect(packageJson.scripts.prepare).toBe("npm run build && npm run schemas:emit")
  })

  it("잠금파일에 sibling 저장소 경로를 포함하지 않는다", () => {
    expect(Object.keys(packageLock.packages)).not.toContain("../smng-ti-overlay")
  })

  it("코드 계약을 MIT로 명시한다", () => {
    expect(packageJson.license).toBe("MIT")
  })

  it("공개 GitHub 저장소를 패키지 출처로 명시한다", () => {
    expect(packageJson.repository).toEqual({
      type: "git",
      url: "git+https://github.com/seominugi/smng-ti-schema.git",
    })
  })
})
