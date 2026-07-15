import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { ItemNameTableSchema, PriceObservationSchema } from "../dist/index.mjs"

const [kind, inputPath] = process.argv.slice(2)

if (!inputPath || (kind !== "itemdb" && kind !== "observation")) {
  console.error("Usage: validate-contract.mjs <itemdb|observation> <json-path>")
  process.exitCode = 2
} else {
  try {
    const absolutePath = resolve(inputPath)
    const input = JSON.parse(readFileSync(absolutePath, "utf8"))
    const parsed = kind === "itemdb"
      ? ItemNameTableSchema.parse(input)
      : PriceObservationSchema.parse(input)
    const summary = kind === "itemdb" ? `${Object.keys(parsed.items).length} items` : "1 observation"
    console.log(`PASS ${kind}: ${summary} (${absolutePath})`)
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}
