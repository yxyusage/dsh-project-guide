// 开发用的小探针：调本地 /api/learn-up 看看真实项目讲得怎么样。
const base = 'http://127.0.0.1:56441/api/learn-up'
const paths = process.argv.slice(2)

for (const p of paths) {
  const started = Date.now()
  let ready = null
  for (;;) {
    const res = await fetch(`${base}/map?path=${encodeURIComponent(p)}`)
    const j = await res.json()
    if (!j.ok) { console.log(`\n=== ${p}\n  ERROR: ${j.error}`); break }
    if (j.status === 'ready') { ready = j; break }
    if (Date.now() - started > 240000) { console.log(`\n=== ${p}\n  TIMEOUT at ${j.phase}`); break }
    await new Promise((r) => setTimeout(r, 1500))
  }
  if (!ready) continue
  const m = ready.map
  console.log(`\n=== ${p}   narrated=${m.narrated}  note=${ready.note ?? '-'}  ${m.stats.files}f/${m.stats.areas}areas`)
  m.summary.forEach((s, i) => console.log(`  S${i + 1}. ${s}`))
  console.log('  route: ' + m.route.map((r) => r.file).join('  |  '))
  for (const n of m.nodes) {
    console.log(`  ■ ${n.path}  《${n.title}》  ${n.safety}  ${n.fileCount}f`)
    console.log(`     one : ${n.oneLine}`)
    console.log(`     say : ${n.plain.lead}`)
    console.log(`     eff : ${n.plain.effect}`)
    for (const c of n.children ?? []) {
      console.log(`     ↳ ${c.path}  《${c.title}》 ${c.safety}`)
      console.log(`        ${c.plain.lead}  ||  ${c.plain.effect}`)
    }
  }
}
