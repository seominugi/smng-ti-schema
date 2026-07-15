import { mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { toContractJsonSchemas } from "../dist/index.mjs"

const outputDirectory = fileURLToPath(new URL("../schemas/", import.meta.url))
const schemas = toContractJsonSchemas()

mkdirSync(outputDirectory, { recursive: true })

for (const [name, schema] of [
  ["price-observation.schema.json", schemas.priceObservation],
  ["item-name-table.schema.json", schemas.itemNameTable],
]) {
  writeFileSync(join(outputDirectory, name), `${JSON.stringify(schema, null, 2)}\n`, "utf8")
}
