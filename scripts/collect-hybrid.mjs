// 하이브리드 보강: TITrack MIT 시드(astockman99/TITrack)로 아이템 리스트 열거 → tlidb에서 이름.
// KO는 tlidb 정본(필수), EN은 tlidb 우선·미해결 시 MIT 시드 name_en 폴백. 기존 items.json에 병합.
import { writeFileSync, readFileSync } from "node:fs"
import { ItemDbEntrySchema } from "../dist/index.js"

const BASE = "https://tlidb.com"
const RATE_MS = 600
const OUT = new URL("../data/items.json", import.meta.url)
const SEED_URL = "https://raw.githubusercontent.com/astockman99/TITrack/master/tlidb_items_seed_en.json"
const CURRENCY_IDS = new Set([100200, 100300, 200003, 200028, 200029, 200030])

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const strip = (s) => s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
const h1 = (t) => { const m = t.match(/<h1[\s\S]*?<\/h1>/); return m ? strip(m[0]) : "" }
const getId = (t) => { const m = t.match(/id:\s*(\d+)/); return m ? Number(m[1]) : null }
const toSlug = (n) => encodeURIComponent(n.trim().replace(/ /g, "_")).replace(/\x27/g, "%27")
async function get(url) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(15000), headers: { "user-agent": "smng-ti-schema item-name collector (non-commercial, tlidb-attributed)" } })
    await sleep(RATE_MS)
    return r.ok ? await r.text() : null
  } catch { await sleep(RATE_MS); return null }
}
function flush(byId, note) {
  const items = [...byId.values()].sort((a, b) => a.configBaseId - b.configBaseId)
  writeFileSync(OUT, JSON.stringify({ source: "tlidb.com", note, count: items.length, items }, null, 2))
}

async function main() {
  const doc = JSON.parse(readFileSync(OUT, "utf8"))
  const note = "fan wiki; robots Allow /; KO/EN names from tlidb; gap enumerated via TITrack MIT seed (astockman99/TITrack)"
  const byId = new Map(doc.items.map((i) => [i.configBaseId, i]))
  const rawSeed = await (await fetch(SEED_URL)).json()
  const seed = Array.isArray(rawSeed) ? rawSeed : (rawSeed.items || Object.values(rawSeed))
  const gap = seed.filter((x) => x.name_en && !byId.has(Number(x.id)))
  console.error("[start] have", byId.size, "gap", gap.length)
  let added = 0, miss = 0, tried = 0
  for (const x of gap) {
    tried++
    const slug = toSlug(x.name_en)
    const ko = await get(BASE + "/ko/" + slug)
    const koName = ko ? h1(ko) : ""
    const id = ko ? getId(ko) : null
    if (!koName || !id || byId.has(id)) { miss++; continue }
    const en = await get(BASE + "/en/" + slug)
    const enName = (en ? h1(en) : "") || x.name_en
    const e = { configBaseId: id, name: { ko: koName, en: enName }, category: null, isCurrency: CURRENCY_IDS.has(id) }
    if (!ItemDbEntrySchema.safeParse(e).success) { miss++; continue }
    byId.set(id, e); added++
    if (added % 50 === 0) { flush(byId, note); console.error("[progress] added", added, "tried", tried) }
  }
  flush(byId, note)
  console.error("DONE hybrid: added", added, "missed", miss, "total", byId.size)
}
main()
