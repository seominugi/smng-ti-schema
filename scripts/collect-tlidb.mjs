// tlidb 아이템 이름 수집기: ConfigBaseId -> {ko, en}. 출처 tlidb.com (robots: Allow /).
// rate-limit + polite UA + 증분 저장(크래시 안전) + 중복이름(시스템페이지) 필터 + ItemDbEntry 검증.
// 사용: node collect-tlidb.mjs [--limit=N]
import { writeFileSync, existsSync, mkdirSync } from "node:fs"
import { ItemDbEntrySchema } from "../dist/index.js"

const BASE = "https://tlidb.com"
const RATE_MS = 700
const OUT = new URL("../data/items.json", import.meta.url)
const OUT_DIR = new URL("../data/", import.meta.url)
const CURRENCY_IDS = new Set([100200, 100300]) // 알려진 통화(크리스탈·FE). 추후 보강.
const SEED_SLUGS = ["Flame_Elementium"] // 통화 시드(리스팅 미발견분 보강)
const SEED_CATEGORIES = ["Legendary_Gear", "Ethereal_Prism", "Recipe", "Black_Market", "Pactspirit", "Inventory", "Drop_Source", "Active_Skill", "Support_Skill", "Passive_Skill", "Triggered_Skill"]
const NAV = new Set(["Hero","Talent","Inventory","Legendary_Gear","Ethereal_Prism","Recipe","Pactspirit","Black_Market","Drop_Source","Destiny","Active_Skill","Support_Skill","Passive_Skill","Triggered_Skill","Codex","Help","Tip","Hyperlink","Craft","Enchant","Graft","Event","Season_Pass"])

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
async function get(url) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(15000), headers: { "user-agent": "smng-ti-schema item-name collector (non-commercial, tlidb-attributed)" } })
    await sleep(RATE_MS)
    return r.ok ? await r.text() : null
  } catch { await sleep(RATE_MS); return null }
}
const stripTags = (s) => s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
function extractItem(html) {
  const id = (html.match(/id:\s*(\d+)/) || [])[1]
  const h1 = html.match(/<h1[\s\S]*?<\/h1>/)
  return { id: id ? Number(id) : null, name: h1 ? stripTags(h1[0]) : "" }
}
function extractSlugs(html) {
  const rel = [...html.matchAll(/href=[\x22\x27]([^\x22\x27\/][^\x22\x27#]*)[\x22\x27]/g)].map((m) => m[1])
  const abs = [...html.matchAll(/href=[\x22\x27]\/en\/([^\x22\x27#\/]+)[\x22\x27]/g)].map((m) => m[1])
  return [...rel, ...abs].filter((s) => /^[A-Za-z0-9_%.\-]+$/.test(s) && !NAV.has(s))
}
function flush(list) {
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true })
  const sorted = [...list].sort((a, b) => a.configBaseId - b.configBaseId)
  writeFileSync(OUT, JSON.stringify({ source: "tlidb.com", note: "fan wiki; robots Allow /; item names are game facts", count: sorted.length, items: sorted }, null, 2))
}

async function main() {
  const limArg = process.argv.find((a) => a.startsWith("--limit="))
  const limit = limArg ? Number(limArg.split("=")[1]) : Infinity
  const slugs = new Set(SEED_SLUGS)
  for (const cat of SEED_CATEGORIES) {
    const html = await get(BASE + "/en/" + cat)
    if (html) for (const s of extractSlugs(html)) slugs.add(s)
    console.error("[enum]", cat, "=> slugs", slugs.size)
  }
  const raw = []
  const seen = new Set()
  for (const slug of slugs) {
    if (raw.length >= limit) break
    const en = await get(BASE + "/en/" + slug)
    if (!en) continue
    const { id, name: enName } = extractItem(en)
    if (!id || !enName || seen.has(id)) continue
    const ko = await get(BASE + "/ko/" + slug)
    const koName = ko ? extractItem(ko).name : ""
    if (!koName) continue
    const entry = { configBaseId: id, name: { ko: koName, en: enName }, category: null, isCurrency: CURRENCY_IDS.has(id) }
    if (!ItemDbEntrySchema.safeParse(entry).success) continue
    raw.push(entry); seen.add(id)
    if (raw.length % 25 === 0) { flush(raw); console.error("[progress]", raw.length) }
  }
  const counts = {}
  for (const it of raw) counts[it.name.en] = (counts[it.name.en] || 0) + 1
  const clean = raw.filter((it) => counts[it.name.en] === 1)
  flush(clean)
  console.error("DONE raw:", raw.length, "| clean:", clean.length, "| dropped(system-page dup-name):", raw.length - clean.length)
}
main()
